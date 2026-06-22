const express = require('express')
const router = express.Router()
const db = require('../db/database')

router.get('/', (req, res) => {
  const { categoria } = req.query
  const rows = categoria
    ? db.prepare('SELECT * FROM produtos WHERE categoria = ? ORDER BY tipo, nome').all(categoria)
    : db.prepare('SELECT * FROM produtos ORDER BY categoria, tipo, nome').all()
  res.json(rows)
})

router.post('/', (req, res) => {
  const { categoria, tipo, nome, cor, preco } = req.body
  if (!categoria || !nome) return res.status(400).json({ error: 'categoria e nome são obrigatórios' })
  const info = db.prepare(
    'INSERT INTO produtos (categoria, tipo, nome, cor, preco) VALUES (?, ?, ?, ?, ?)'
  ).run(categoria, tipo ?? null, nome, cor ?? null, preco ?? 0)
  const row = db.prepare('SELECT * FROM produtos WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json(row)
})

router.patch('/:id', (req, res) => {
  const { categoria, tipo, nome, cor, preco } = req.body
  const existing = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Não encontrado' })
  db.prepare(`UPDATE produtos SET
    categoria = ?, tipo = ?, nome = ?, cor = ?, preco = ?,
    atualizado_em = datetime('now')
    WHERE id = ?`
  ).run(
    categoria ?? existing.categoria,
    tipo !== undefined ? tipo : existing.tipo,
    nome ?? existing.nome,
    cor !== undefined ? cor : existing.cor,
    preco !== undefined ? preco : existing.preco,
    req.params.id
  )
  res.json(db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Não encontrado' })
  res.status(204).end()
})

module.exports = router
