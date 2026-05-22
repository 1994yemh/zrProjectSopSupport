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

// Phase metadata
const PHASE_ORDER = ['startup', 'planning', 'execution', 'monitoring', 'closure']
const PHASE_LABELS = {
  startup: '项目启动',
  planning: '项目规划',
  execution: '项目执行',
  monitoring: '项目监控',
  closure: '项目收尾'
}

// ==================== Handler functions ====================

function getProjectLifecycle(req, res) {
  const { projectId } = req.params

  const phases = PHASE_ORDER.map(phase => {
    const steps = queryAll(
      'SELECT id, step_name, sort_order FROM project_lifecycle WHERE project_id=? AND phase=? ORDER BY sort_order',
      [projectId, phase]
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
      phase,
      label: PHASE_LABELS[phase],
      steps: enrichedSteps
    }
  })

  res.json({ code: 0, data: { phases } })
}

function updateCheck(req, res) {
  const { is_passed } = req.body
  const db = getDB()
  db.run(
    'UPDATE lifecycle_checks SET is_passed=? WHERE id=?',
    [is_passed === true ? 1 : is_passed === false ? 0 : null, req.params.checkId]
  )
  saveDB()
  res.json({ code: 0, message: '更新成功' })
}

function updateNotes(req, res) {
  const { content } = req.body
  const db = getDB()
  const { projectLifecycleId } = req.params

  // Check if note exists
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

// ==================== Protected router (auth required) ====================
const protectedRouter = express.Router()
protectedRouter.use(authMiddleware)

protectedRouter.get('/project/:projectId', getProjectLifecycle)
protectedRouter.put('/checks/:checkId', updateCheck)
protectedRouter.put('/notes/:projectLifecycleId', updateNotes)

// ==================== Public router (no auth, for kanban) ====================
const publicRouter = express.Router()

publicRouter.get('/project/:projectId', getProjectLifecycle)

module.exports = { protectedRouter, publicRouter }
