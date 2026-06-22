const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const db = require('../db/database')
const requireAuth = require('../middleware/requireAuth')

router.post('/registro', (req, res) => {
  const { nome, empresa, email, senha } = req.body
  if (!nome || !empresa || !email || !senha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
  }
  if (db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'E-mail já cadastrado' })
  }
  const info = db.prepare(
    'INSERT INTO usuarios (nome, empresa, email, senha_hash) VALUES (?, ?, ?, ?)'
  ).run(nome, empresa, email, bcrypt.hashSync(senha, 10))
  const u = db.prepare('SELECT id, nome, empresa, email, role FROM usuarios WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json(u)
})

router.post('/login', (req, res) => {
  const { email, senha } = req.body
  if (!email || !senha) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' })
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email)
  if (!u || !bcrypt.compareSync(senha, u.senha_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos' })
  }
  if (u.role === 'pendente') return res.status(403).json({ error: 'Sua conta ainda aguarda aprovação' })
  if (u.role === 'rejeitado') return res.status(403).json({ error: 'Sua conta foi rejeitada' })
  const token = crypto.randomUUID()
  db.prepare('UPDATE usuarios SET token = ? WHERE id = ?').run(token, u.id)
  res.json({ token, usuario: { id: u.id, nome: u.nome, empresa: u.empresa, email: u.email, role: u.role } })
})

router.post('/logout', requireAuth, (req, res) => {
  db.prepare('UPDATE usuarios SET token = NULL WHERE id = ?').run(req.usuario.id)
  res.status(204).end()
})

router.get('/me', requireAuth, (req, res) => {
  const { id, nome, empresa, email, role } = req.usuario
  res.json({ id, nome, empresa, email, role })
})

module.exports = router
