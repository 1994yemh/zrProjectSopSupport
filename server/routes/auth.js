const express = require('express')
const jwt = require('jsonwebtoken')
const { getDB } = require('../db')
const { JWT_SECRET } = require('../middleware/auth')
const router = express.Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body
  const db = getDB()
  var stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
  stmt.bind([username, password])
  var user = null
  if (stmt.step()) user = stmt.getAsObject()
  stmt.free()

  if (!user) return res.json({ code: 1, message: '账号或密码错误' })
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' })
  res.json({ code: 0, data: { token, username: user.username } })
})

module.exports = router
