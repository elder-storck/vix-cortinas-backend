const express = require('express')
const router = express.Router()
const db = require('../db/database')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

router.use(requireAuth, requireAdmin)

router.get('/', (req, res) => {
  const rows = db.prepare(
    "SELECT id, nome, empresa, email, role, criado_em FROM usuarios WHERE role != 'admin' ORDER BY criado_em DESC"
  ).all()
  res.json(rows)
})

router.patch('/:id', (req, res) => {
  const { role } = req.body
  if (!['ativo', 'rejeitado'].includes(role)) {
    return res.status(400).json({ error: 'Role inválido. Use "ativo" ou "rejeitado"' })
  }
  const info = db.prepare(
    "UPDATE usuarios SET role = ? WHERE id = ? AND role != 'admin'"
  ).run(role, req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' })
  res.json(db.prepare('SELECT id, nome, empresa, email, role FROM usuarios WHERE id = ?').get(req.params.id))
})

module.exports = router
