const express = require('express')
const router = express.Router()
const db = require('../db/database')

function gerarNumero() {
  const ano = new Date().getFullYear()
  const ultimo = db
    .prepare('SELECT numero FROM orcamentos WHERE numero LIKE ? ORDER BY id DESC LIMIT 1')
    .get(`ORC-${ano}-%`)
  if (!ultimo) return `ORC-${ano}-0001`
  const seq = parseInt(ultimo.numero.split('-')[2], 10) + 1
  return `ORC-${ano}-${String(seq).padStart(4, '0')}`
}

function parseRow(row) {
  if (!row) return null
  return { ...row, itens: JSON.parse(row.itens), observacoes: JSON.parse(row.observacoes) }
}

router.get('/', (_req, res) => {
  const rows = db.prepare(
    `SELECT o.*, c.nome as cliente_nome
     FROM orcamentos o
     LEFT JOIN clientes c ON o.cliente_id = c.id
     ORDER BY o.id DESC LIMIT 50`
  ).all()
  res.json(rows.map(parseRow))
})

router.post('/', (req, res) => {
  const {
    cliente_id, status = 'em_aberto',
    itens = { m2: [], ml: [] },
    instalacao = 0, desconto = 0, observacoes = {},
  } = req.body
  const numero = gerarNumero()
  const result = db.prepare(
    'INSERT INTO orcamentos (numero, cliente_id, status, itens, instalacao, desconto, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(numero, cliente_id ?? null, status, JSON.stringify(itens), instalacao, desconto, JSON.stringify(observacoes))
  res.status(201).json(parseRow(db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(result.lastInsertRowid)))
})

router.get('/:id', (req, res) => {
  const row = parseRow(db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(req.params.id))
  if (!row) return res.status(404).json({ error: 'Nao encontrado' })
  res.json(row)
})

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Nao encontrado' })
  const { cliente_id, status, itens, instalacao, desconto, observacoes } = req.body
  db.prepare(
    `UPDATE orcamentos SET
       cliente_id = ?, status = ?, itens = ?, instalacao = ?, desconto = ?,
       observacoes = ?, atualizado_em = datetime('now')
     WHERE id = ?`
  ).run(
    cliente_id ?? existing.cliente_id,
    status ?? existing.status,
    itens !== undefined ? JSON.stringify(itens) : existing.itens,
    instalacao ?? existing.instalacao,
    desconto ?? existing.desconto,
    observacoes !== undefined ? JSON.stringify(observacoes) : existing.observacoes,
    req.params.id
  )
  res.json(parseRow(db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(req.params.id)))
})

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM orcamentos WHERE id = ?').run(req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: 'Nao encontrado' })
  res.status(204).end()
})

module.exports = router
