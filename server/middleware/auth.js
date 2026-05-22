const jwt = require('jsonwebtoken')
const JWT_SECRET = 'zr-project-sop-secret-key'

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ code: 401, message: '未登录' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ code: 401, message: 'token无效' })
  }
}

module.exports = { authMiddleware, JWT_SECRET }
