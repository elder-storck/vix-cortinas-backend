const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const db = require('./db/database')
const requireAuth = require('./middleware/requireAuth')

const app = express()
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : true

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

// Seed admin na primeira execução
;(function seedAdmin() {
  const senha = process.env.ADMIN_SENHA || 'admin123'
  if (!process.env.ADMIN_SENHA) {
    console.warn('⚠️  ADMIN_SENHA não definida. Usando senha padrão "admin123".')
  }
  const existing = db.prepare("SELECT id FROM usuarios WHERE role = 'admin'").get()
  if (existing) return
  db.prepare(
    'INSERT INTO usuarios (nome, empresa, email, senha_hash, role) VALUES (?, ?, ?, ?, ?)'
  ).run('Administrador', 'Vix Cortinas & Persianas', 'admin@vix.com', bcrypt.hashSync(senha, 10), 'admin')
  console.log('Admin criado: admin@vix.com')
})()

// Rotas públicas
app.use('/api/auth', require('./routes/auth'))

// Rotas autenticadas
app.use('/api/clientes', requireAuth, require('./routes/clientes'))
app.use('/api/orcamentos', requireAuth, require('./routes/orcamentos'))
app.use('/api/produtos', requireAuth, require('./routes/produtos'))
app.use('/api/usuarios', require('./routes/usuarios'))

if (require.main === module) {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`))
}

module.exports = app
