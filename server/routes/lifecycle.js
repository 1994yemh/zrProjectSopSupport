const express = require('express')
const { getDB, saveDB } = require('../db')
const { authMiddleware } = require('../middleware/auth')

// Helpers for sql.js
function queryAll(sql, params = []) {
  const db = getDB()
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows.length > 0 ? rows[0] : null
}

function getLastInsertId() {
  const db = getDB()
  const result = db.exec('SELECT last_insert_rowid() as id')
  return result[0].values[0][0]
}

// Phase metadata (fallback for legacy projects without project_phases entries)
const PHASE_ORDER = ['startup', 'planning', 'execution', 'monitoring', 'closure']
const PHASE_LABELS = {
  startup: '项目启动',
  planning: '项目规划',
  execution: '项目执行',
  monitoring: '项目监控',
  closure: '项目收尾'
}

// Auto-seed project_phases for a project if missing
function ensureProjectPhases(projectId) {
  const existing = queryAll(
    'SELECT phase FROM project_phases WHERE project_id=?',
    [projectId]
  )
  if (existing.length > 0) return

  const db = getDB()
  const distinctPhases = queryAll(
    'SELECT DISTINCT phase FROM project_lifecycle WHERE project_id=?',
    [projectId]
  )

  if (distinctPhases.length > 0) {
    // Order by hardcoded PHASE_ORDER first, then any custom phases
    distinctPhases.sort((a, b) => {
      const ai = PHASE_ORDER.indexOf(a.phase)
      const bi = PHASE_ORDER.indexOf(b.phase)
      const ao = ai === -1 ? 999 : ai
      const bo = bi === -1 ? 999 : bi
      return ao - bo
    })
    distinctPhases.forEach((p, i) => {
      db.run(
        'INSERT OR IGNORE INTO project_phases (project_id, phase, label, sort_order) VALUES (?, ?, ?, ?)',
        [projectId, p.phase, PHASE_LABELS[p.phase] || p.phase, i + 1]
      )
    })
  } else {
    PHASE_ORDER.forEach((phase, i) => {
      db.run(
        'INSERT OR IGNORE INTO project_phases (project_id, phase, label, sort_order) VALUES (?, ?, ?, ?)',
        [projectId, phase, PHASE_LABELS[phase], i + 1]
      )
    })
  }
  saveDB()
}

// ==================== Handler functions ====================

function getProjectLifecycle(req, res) {
  const { projectId } = req.params

  ensureProjectPhases(projectId)

  const phases = queryAll(
    'SELECT phase, label, sort_order FROM project_phases WHERE project_id=? ORDER BY sort_order',
    [projectId]
  )

  const result = phases.map(p => {
    const steps = queryAll(
      'SELECT id, step_name, sort_order FROM project_lifecycle WHERE project_id=? AND phase=? ORDER BY sort_order',
      [projectId, p.phase]
    )

    const enrichedSteps = steps.map(item => {
      const checks = queryAll(
        'SELECT id, check_content, is_passed, sort_order FROM lifecycle_checks WHERE project_lifecycle_id=? ORDER BY sort_order',
        [item.id]
      )
      const noteRow = queryOne(
        'SELECT content FROM lifecycle_notes WHERE project_lifecycle_id=?',
        [item.id]
      )
      return {
        id: item.id,
        step_name: item.step_name,
        sort_order: item.sort_order,
        checks: checks.map(c => ({
          id: c.id,
          check_content: c.check_content,
          is_passed: c.is_passed === 1 ? true : c.is_passed === 0 ? false : null,
          sort_order: c.sort_order
        })),
        notes: noteRow ? noteRow.content : ''
      }
    })

    return {
      phase: p.phase,
      label: p.label,
      steps: enrichedSteps
    }
  })

  res.json({ code: 0, data: { phases: result } })
}

function updateCheck(req, res) {
  const { is_passed, check_content } = req.body
  const db = getDB()

  if (check_content !== undefined) {
    db.run(
      'UPDATE lifecycle_checks SET check_content=? WHERE id=?',
      [check_content.trim(), req.params.checkId]
    )
  } else {
    db.run(
      'UPDATE lifecycle_checks SET is_passed=? WHERE id=?',
      [is_passed === true ? 1 : is_passed === false ? 0 : null, req.params.checkId]
    )
  }
  saveDB()
  res.json({ code: 0, message: '更新成功' })
}

function updateNotes(req, res) {
  const { content } = req.body
  const db = getDB()
  const { projectLifecycleId } = req.params

  const existing = queryOne(
    'SELECT id FROM lifecycle_notes WHERE project_lifecycle_id=?',
    [projectLifecycleId]
  )

  if (existing) {
    db.run(
      'UPDATE lifecycle_notes SET content=? WHERE project_lifecycle_id=?',
      [content || '', projectLifecycleId]
    )
  } else {
    db.run(
      'INSERT INTO lifecycle_notes (project_lifecycle_id, content) VALUES (?, ?)',
      [projectLifecycleId, content || '']
    )
  }

  saveDB()
  res.json({ code: 0, message: '更新成功' })
}

// ==================== Phase CRUD ====================

function createPhase(req, res) {
  const { project_id, label } = req.body
  if (!label || !label.trim()) {
    return res.json({ code: 1, message: '请输入阶段名称' })
  }

  ensureProjectPhases(project_id)

  const phase = `phase_${Date.now()}`
  const maxOrder = queryOne(
    'SELECT MAX(sort_order) as max_order FROM project_phases WHERE project_id=?',
    [project_id]
  )
  const sortOrder = (maxOrder && maxOrder.max_order ? maxOrder.max_order : 0) + 1

  const db = getDB()
  db.run(
    'INSERT INTO project_phases (project_id, phase, label, sort_order) VALUES (?, ?, ?, ?)',
    [project_id, phase, label.trim(), sortOrder]
  )
  saveDB()

  res.json({ code: 0, data: { phase, label: label.trim() }, message: '创建成功' })
}

function updatePhase(req, res) {
  const { label, project_id } = req.body
  const { phase } = req.params

  if (!label || !label.trim()) {
    return res.json({ code: 1, message: '请输入阶段名称' })
  }

  const db = getDB()
  db.run(
    'UPDATE project_phases SET label=? WHERE project_id=? AND phase=?',
    [label.trim(), project_id, phase]
  )
  saveDB()

  res.json({ code: 0, message: '更新成功' })
}

function deletePhase(req, res) {
  const { phase } = req.params
  const { project_id } = req.body

  const db = getDB()

  // Get all step IDs for this phase
  const steps = queryAll(
    'SELECT id FROM project_lifecycle WHERE project_id=? AND phase=?',
    [project_id, phase]
  )

  // Delete checks and notes for each step
  for (const step of steps) {
    db.run('DELETE FROM lifecycle_notes WHERE project_lifecycle_id=?', [step.id])
    db.run('DELETE FROM lifecycle_checks WHERE project_lifecycle_id=?', [step.id])
  }

  // Delete steps
  db.run('DELETE FROM project_lifecycle WHERE project_id=? AND phase=?', [project_id, phase])

  // Delete phase
  db.run('DELETE FROM project_phases WHERE project_id=? AND phase=?', [project_id, phase])

  saveDB()
  res.json({ code: 0, message: '删除成功' })
}

// ==================== Step CRUD ====================

function createStep(req, res) {
  const { project_id, phase, step_name } = req.body
  if (!step_name || !step_name.trim()) {
    return res.json({ code: 1, message: '请输入步骤名称' })
  }

  const maxOrder = queryOne(
    'SELECT MAX(sort_order) as max_order FROM project_lifecycle WHERE project_id=? AND phase=?',
    [project_id, phase]
  )
  const sortOrder = (maxOrder && maxOrder.max_order ? maxOrder.max_order : 0) + 1

  const db = getDB()
  db.run(
    'INSERT INTO project_lifecycle (project_id, phase, step_name, sort_order) VALUES (?, ?, ?, ?)',
    [project_id, phase, step_name.trim(), sortOrder]
  )
  const newId = getLastInsertId()

  // Create empty note
  db.run('INSERT INTO lifecycle_notes (project_lifecycle_id, content) VALUES (?, ?)', [newId, ''])

  saveDB()

  res.json({
    code: 0,
    data: { id: newId, phase, step_name: step_name.trim(), sort_order: sortOrder, checks: [], notes: '' },
    message: '创建成功'
  })
}

function updateStep(req, res) {
  const { step_name } = req.body
  const { stepId } = req.params

  if (!step_name || !step_name.trim()) {
    return res.json({ code: 1, message: '请输入步骤名称' })
  }

  const db = getDB()
  db.run(
    'UPDATE project_lifecycle SET step_name=? WHERE id=?',
    [step_name.trim(), stepId]
  )
  saveDB()

  res.json({ code: 0, message: '更新成功' })
}

function deleteStep(req, res) {
  const { stepId } = req.params
  const db = getDB()

  db.run('DELETE FROM lifecycle_notes WHERE project_lifecycle_id=?', [stepId])
  db.run('DELETE FROM lifecycle_checks WHERE project_lifecycle_id=?', [stepId])
  db.run('DELETE FROM project_lifecycle WHERE id=?', [stepId])

  saveDB()
  res.json({ code: 0, message: '删除成功' })
}

// ==================== Check CRUD ====================

function createCheck(req, res) {
  const { project_lifecycle_id, check_content } = req.body
  if (!check_content || !check_content.trim()) {
    return res.json({ code: 1, message: '请输入细项内容' })
  }

  const maxOrder = queryOne(
    'SELECT MAX(sort_order) as max_order FROM lifecycle_checks WHERE project_lifecycle_id=?',
    [project_lifecycle_id]
  )
  const sortOrder = (maxOrder && maxOrder.max_order ? maxOrder.max_order : 0) + 1

  const db = getDB()
  db.run(
    'INSERT INTO lifecycle_checks (project_lifecycle_id, check_content, is_passed, sort_order) VALUES (?, ?, NULL, ?)',
    [project_lifecycle_id, check_content.trim(), sortOrder]
  )
  const newId = getLastInsertId()
  saveDB()

  res.json({
    code: 0,
    data: { id: newId, check_content: check_content.trim(), is_passed: null, sort_order: sortOrder },
    message: '创建成功'
  })
}

function deleteCheck(req, res) {
  const { checkId } = req.params
  const db = getDB()
  db.run('DELETE FROM lifecycle_checks WHERE id=?', [checkId])
  saveDB()
  res.json({ code: 0, message: '删除成功' })
}

// ==================== Protected router (auth required) ====================
const protectedRouter = express.Router()
protectedRouter.use(authMiddleware)

protectedRouter.get('/project/:projectId', getProjectLifecycle)
protectedRouter.put('/checks/:checkId', updateCheck)
protectedRouter.put('/notes/:projectLifecycleId', updateNotes)

// Phase CRUD
protectedRouter.post('/phases', createPhase)
protectedRouter.put('/phases/:phase', updatePhase)
protectedRouter.delete('/phases/:phase', deletePhase)

// Step CRUD
protectedRouter.post('/steps', createStep)
protectedRouter.put('/steps/:stepId', updateStep)
protectedRouter.delete('/steps/:stepId', deleteStep)

// Check CRUD
protectedRouter.post('/checks', createCheck)
protectedRouter.put('/checks/:checkId', updateCheck)
protectedRouter.delete('/checks/:checkId', deleteCheck)

// ==================== Public router (no auth, for kanban) ====================
const publicRouter = express.Router()

publicRouter.get('/project/:projectId', getProjectLifecycle)

module.exports = { protectedRouter, publicRouter }
