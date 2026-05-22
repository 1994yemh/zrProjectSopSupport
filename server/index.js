const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDB } = require('./db')

async function startServer() {
  await initDB()

  const app = express()
  app.use(cors())
  app.use(express.json())

  app.use(express.static(path.join(__dirname, '../dist')))

  // API routes
  app.use('/api/auth', require('./routes/auth'))
  app.use('/api/courses', require('./routes/courses'))
  app.use('/api/products', require('./routes/products'))

  // Project routes (protected + public for kanban)
  const { protectedRouter: projectProtected, publicRouter: projectPublic } = require('./routes/projects')
  app.use('/api/projects', projectProtected)
  app.use('/api/public/projects', projectPublic)

  // Lifecycle routes (protected + public for kanban)
  const { protectedRouter: lifecycleProtected, publicRouter: lifecyclePublic } = require('./routes/lifecycle')
  app.use('/api/lifecycle', lifecycleProtected)
  app.use('/api/public/lifecycle', lifecyclePublic)

  app.get('/api/health', (req, res) => {
    res.json({ code: 0, data: { status: 'ok' } })
  })

  // SPA fallback - serve index.html for non-API routes
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })

  const PORT = 3001
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

startServer().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
