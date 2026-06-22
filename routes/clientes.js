const express = require('express')
const router = express.Router()
const db = require('../db/database')

router.get('/', (req, res) => {
  const { q } = req.query
  const rows = q
    ? db.prepare('SELECT * FROM clientes WHERE nome LIKE ? ORDER BY nome LIMIT 20').all(`%${q}%`)
    : db.prepare('SELECT * FROM clientes ORDER BY nome LIMIT 50').all()
  res.json(rows)
})

router.post('/', (req, res) => {
  const { nome, telefone = '' } = req.body
  if (!nome?.trim()) return res.status(400).json({ error: 'Nome e obrigatorio' })
  const result = db
    .prepare('INSERT INTO clientes (nome, telefone) VALUES (?, ?)')
    .run(nome.trim(), telefone)
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(cliente)
})

module.exports = router
