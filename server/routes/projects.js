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

/**
 * Determine the current phase for a project.
 * Walk lifecycle steps in order; the first step whose checks are NOT all passed
 * determines the current phase. If all pass, return 'completed'.
 */
// Phase sort order for SQL
const PHASE_SORT = `
  CASE phase
    WHEN 'startup' THEN 1
    WHEN 'planning' THEN 2
    WHEN 'execution' THEN 3
    WHEN 'monitoring' THEN 4
    WHEN 'closure' THEN 5
    ELSE 6
  END, sort_order`

function getCurrentPhase(projectId) {
  const lifecycles = queryAll(
    `SELECT id, phase, sort_order FROM project_lifecycle WHERE project_id = ? ORDER BY ${PHASE_SORT}`,
    [projectId]
  )

  // If no lifecycle data yet, default to startup
  if (lifecycles.length === 0) return 'startup'

  for (const lc of lifecycles) {
    const checks = queryAll(
      'SELECT is_passed FROM lifecycle_checks WHERE project_lifecycle_id = ?',
      [lc.id]
    )
    const allPassed = checks.length > 0 && checks.every(c => c.is_passed === 1)
    if (!allPassed) return lc.phase
  }
  return 'completed'
}

// ==================== Handler functions ====================

function listProjects(req, res) {
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 10
  const keyword = (req.query.keyword || '').toString().trim()
  const offset = (page - 1) * pageSize
  const hasKeyword = keyword.length > 0

  const whereSql = hasKeyword ? 'WHERE name LIKE ?' : ''
  const whereParams = hasKeyword ? [`%${keyword}%`] : []

  // Count query using db.exec (consistent with products.js)
  const db = getDB()
  const countSql = `SELECT COUNT(*) as total FROM projects ${whereSql}`
  const countResult = db.exec(countSql, hasKeyword ? whereParams : [])
  let total = 0
  if (countResult && countResult.length > 0 && countResult[0].values.length > 0) {
    total = countResult[0].values[0][0]
  }

  const list = queryAll(
    `SELECT * FROM projects ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...whereParams, pageSize, offset]
  )

  // Enrich each project with product_count, course_count, current_phase
  const enriched = list.map(p => {
    const pcResult = queryOne('SELECT COUNT(*) as cnt FROM project_products WHERE project_id=?', [p.id])
    const ccResult = queryOne('SELECT COUNT(*) as cnt FROM project_courses WHERE project_id=?', [p.id])
    const current_phase = getCurrentPhase(p.id)

    return {
      ...p,
      product_count: pcResult ? pcResult.cnt : 0,
      course_count: ccResult ? ccResult.cnt : 0,
      current_phase
    }
  })

  res.json({ code: 0, data: { list: enriched, total, page, pageSize } })
}

function getProjectAll(req, res) {
  const list = queryAll('SELECT id, name, delivery_start_date, delivery_end_date FROM projects ORDER BY id DESC')
  res.json({ code: 0, data: list })
}

function getProjectDetail(req, res) {
  const project = queryOne('SELECT * FROM projects WHERE id=?', [req.params.id])
  if (!project) return res.json({ code: 1, message: '项目不存在' })

  const products = queryAll(
    `SELECT p.* FROM products p JOIN project_products pp ON p.id = pp.product_id WHERE pp.project_id = ?`,
    [req.params.id]
  )

  const courses = queryAll(
    `SELECT c.* FROM courses c JOIN project_courses pc ON c.id = pc.course_id WHERE pc.project_id = ?`,
    [req.params.id]
  )

  res.json({ code: 0, data: { project, products, courses } })
}

function getProjectSummary(req, res) {
  const project = queryOne('SELECT * FROM projects WHERE id=?', [req.params.id])
  if (!project) return res.json({ code: 1, message: '项目不存在' })

  const products = queryAll(
    `SELECT p.name, p.install_path, p.install_manual_path, p.usage_manual_path, p.verification_path
     FROM products p JOIN project_products pp ON p.id = pp.product_id WHERE pp.project_id = ?`,
    [req.params.id]
  )

  const courses = queryAll(
    `SELECT c.name, c.experiment_type, c.experiment_image, c.description
     FROM courses c JOIN project_courses pc ON c.id = pc.course_id WHERE pc.project_id = ?`,
    [req.params.id]
  )

  res.json({
    code: 0,
    data: {
      name: project.name,
      deploy_method: project.deploy_method,
      is_kvm: project.is_kvm,
      is_eve: project.is_eve,
      responsible_person: project.responsible_person,
      after_sales_person: project.after_sales_person,
      delivery_start_date: project.delivery_start_date,
      delivery_end_date: project.delivery_end_date,
      products,
      courses
    }
  })
}

function createProject(req, res) {
  const {
    name, is_kvm, is_eve, deploy_method,
    responsible_person, after_sales_person,
    delivery_start_date, delivery_end_date,
    product_ids = [], course_ids = []
  } = req.body

  if (!name) return res.json({ code: 1, message: '项目名称必填' })

  const db = getDB()

  // 1. Create project
  db.run(
    `INSERT INTO projects (name, is_kvm, is_eve, deploy_method, responsible_person, after_sales_person, delivery_start_date, delivery_end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, is_kvm ? 1 : 0, is_eve ? 1 : 0, deploy_method || 'centralized',
     responsible_person || '', after_sales_person || '',
     delivery_start_date || '', delivery_end_date || '']
  )

  const projectId = getLastInsertId()

  // 2. Associate products
  for (const pid of product_ids) {
    db.run('INSERT INTO project_products (project_id, product_id) VALUES (?, ?)', [projectId, pid])
  }

  // 3. Associate courses
  for (const cid of course_ids) {
    db.run('INSERT INTO project_courses (project_id, course_id) VALUES (?, ?)', [projectId, cid])
  }

  // 4. Copy lifecycle templates to project lifecycle
  const templates = queryAll('SELECT * FROM lifecycle_templates ORDER BY phase, sort_order')
  for (const tmpl of templates) {
    db.run(
      'INSERT INTO project_lifecycle (project_id, phase, step_name, sort_order) VALUES (?, ?, ?, ?)',
      [projectId, tmpl.phase, tmpl.step_name, tmpl.sort_order]
    )
    const plId = getLastInsertId()

    // Create check items from template
    const checks = JSON.parse(tmpl.check_items_json)
    for (let i = 0; i < checks.length; i++) {
      db.run(
        'INSERT INTO lifecycle_checks (project_lifecycle_id, check_content, is_passed, sort_order) VALUES (?, ?, NULL, ?)',
        [plId, checks[i], i + 1]
      )
    }

    // Create empty note for this step
    db.run('INSERT INTO lifecycle_notes (project_lifecycle_id, content) VALUES (?, ?)', [plId, ''])
  }

  saveDB()

  res.json({ code: 0, data: { id: projectId } })
}

function updateProject(req, res) {
  const {
    name, is_kvm, is_eve, deploy_method,
    responsible_person, after_sales_person,
    delivery_start_date, delivery_end_date,
    product_ids, course_ids
  } = req.body

  const db = getDB()

  db.run(
    `UPDATE projects SET name=?, is_kvm=?, is_eve=?, deploy_method=?, responsible_person=?,
     after_sales_person=?, delivery_start_date=?, delivery_end_date=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`,
    [name, is_kvm ? 1 : 0, is_eve ? 1 : 0, deploy_method || 'centralized',
     responsible_person || '', after_sales_person || '',
     delivery_start_date || '', delivery_end_date || '', req.params.id]
  )

  // Update associations if provided - do NOT recreate lifecycle data
  if (product_ids) {
    db.run('DELETE FROM project_products WHERE project_id=?', [req.params.id])
    for (const pid of product_ids) {
      db.run('INSERT INTO project_products (project_id, product_id) VALUES (?, ?)', [req.params.id, pid])
    }
  }

  if (course_ids) {
    db.run('DELETE FROM project_courses WHERE project_id=?', [req.params.id])
    for (const cid of course_ids) {
      db.run('INSERT INTO project_courses (project_id, course_id) VALUES (?, ?)', [req.params.id, cid])
    }
  }

  saveDB()
  res.json({ code: 0, message: '更新成功' })
}

function deleteProject(req, res) {
  const db = getDB()
  const id = req.params.id

  // Delete associated lifecycle data (checks, notes, then lifecycle steps)
  const plItems = queryAll('SELECT id FROM project_lifecycle WHERE project_id=?', [id])
  for (const pl of plItems) {
    db.run('DELETE FROM lifecycle_checks WHERE project_lifecycle_id=?', [pl.id])
    db.run('DELETE FROM lifecycle_notes WHERE project_lifecycle_id=?', [pl.id])
  }
  db.run('DELETE FROM project_lifecycle WHERE project_id=?', [id])
  db.run('DELETE FROM project_products WHERE project_id=?', [id])
  db.run('DELETE FROM project_courses WHERE project_id=?', [id])
  db.run('DELETE FROM projects WHERE id=?', [id])

  saveDB()
  res.json({ code: 0, message: '删除成功' })
}

// ==================== Protected router (auth required) ====================
const protectedRouter = express.Router()
protectedRouter.use(authMiddleware)

protectedRouter.get('/', listProjects)
protectedRouter.get('/all', getProjectAll)
protectedRouter.get('/:id/summary', getProjectSummary)
protectedRouter.get('/:id', getProjectDetail)
protectedRouter.post('/', createProject)
protectedRouter.put('/:id', updateProject)
protectedRouter.delete('/:id', deleteProject)

// ==================== Public router (no auth, for kanban) ====================
const publicRouter = express.Router()

publicRouter.get('/', listProjects)
publicRouter.get('/all', getProjectAll)
publicRouter.get('/:id', getProjectDetail)

module.exports = { protectedRouter, publicRouter }
