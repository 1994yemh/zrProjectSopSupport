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

  // Routes will be added in later tasks

  app.get('/api/health', (req, res) => {
    res.json({ code: 0, data: { status: 'ok' } })
  })

  const PORT = 3001
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

startServer().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
