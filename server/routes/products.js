const express = require('express')
const router = express.Router()
const { getDB, saveDB } = require('../db')
const { authMiddleware } = require('../middleware/auth')

// Parse results from db.exec()
function parseResults(result) {
  if (!result || result.length === 0) return []
  const columns = result[0].columns
  return result[0].values.map(row => {
    const obj = {}
    columns.forEach((col, i) => obj[col] = row[i])
    return obj
  })
}

// All routes require auth
router.use(authMiddleware)

// GET / - Paginated list with keyword search
router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, keyword = '' } = req.query
  const db = getDB()
  const offset = (page - 1) * pageSize

  let countSql, dataSql, params

  if (keyword) {
    countSql = "SELECT COUNT(*) as total FROM products WHERE name LIKE ?"
    dataSql = "SELECT * FROM products WHERE name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?"
    params = ['%' + keyword + '%', Number(pageSize), offset]
  } else {
    countSql = "SELECT COUNT(*) as total FROM products"
    dataSql = "SELECT * FROM products ORDER BY id DESC LIMIT ? OFFSET ?"
    params = [Number(pageSize), offset]
  }

  const countResult = parseResults(db.exec(countSql, keyword ? ['%' + keyword + '%'] : []))
  const total = countResult.length > 0 ? countResult[0].total : 0

  var stmt = db.prepare(dataSql)
  stmt.bind(params)
  var rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()

  res.json({
    code: 0,
    data: {
      list: rows,
      total: total,
      page: Number(page),
      pageSize: Number(pageSize)
    }
  })
})

// GET /all - Full list for dropdown
router.get('/all', (req, res) => {
  const db = getDB()
  const result = db.exec('SELECT id, name, install_path, install_manual_path, usage_manual_path, verification_path FROM products ORDER BY id ASC')
  const rows = parseResults(result)
  res.json({ code: 0, data: rows })
})

// POST / - Create product
router.post('/', (req, res) => {
  const { name, install_path, install_manual_path, usage_manual_path, verification_path } = req.body
  const db = getDB()
  db.run(
    'INSERT INTO products (name, install_path, install_manual_path, usage_manual_path, verification_path) VALUES (?, ?, ?, ?, ?)',
    [name, install_path || '', install_manual_path || '', usage_manual_path || '', verification_path || '']
  )
  const result = db.exec('SELECT last_insert_rowid() as id')
  const id = result[0].values[0][0]
  saveDB()

  res.json({ code: 0, data: { id } })
})

// PUT /:id - Update product
router.put('/:id', (req, res) => {
  const { id } = req.params
  const { name, install_path, install_manual_path, usage_manual_path, verification_path } = req.body
  const db = getDB()
  db.run(
    'UPDATE products SET name = ?, install_path = ?, install_manual_path = ?, usage_manual_path = ?, verification_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, install_path || '', install_manual_path || '', usage_manual_path || '', verification_path || '', id]
  )
  saveDB()

  res.json({ code: 0, message: '更新成功' })
})

// DELETE /:id - Delete product
router.delete('/:id', (req, res) => {
  const { id } = req.params
  const db = getDB()
  db.run('DELETE FROM products WHERE id = ?', [id])
  saveDB()

  res.json({ code: 0, message: '删除成功' })
})

module.exports = router
