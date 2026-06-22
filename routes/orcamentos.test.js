import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import db from '../db/database.js'

let createdId
let adminToken

beforeAll(async () => {
  db.prepare('DELETE FROM orcamentos').run()
  db.prepare('DELETE FROM clientes').run()
  db.prepare("UPDATE usuarios SET token = NULL WHERE role = 'admin'").run()
  const login = await request(app).post('/api/auth/login').send({
    email: 'admin@vix.com', senha: process.env.ADMIN_SENHA || 'admin123'
  })
  adminToken = login.body.token
})

describe('POST /api/orcamentos', () => {
  it('creates orcamento with sequential number', async () => {
    const res = await request(app).post('/api/orcamentos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'em_aberto',
        itens: { m2: [], ml: [] },
        instalacao: 300,
        desconto: 0,
        observacoes: { prazo: '15 dias', condicoes_instalacao: '', geral: '' },
      })
    expect(res.status).toBe(201)
    expect(res.body.numero).toMatch(/^ORC-\d{4}-\d{4}$/)
    createdId = res.body.id
  })
})

describe('GET /api/orcamentos/:id', () => {
  it('returns created orcamento', async () => {
    const res = await request(app).get(`/api/orcamentos/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.itens).toMatchObject({ m2: [], ml: [] })
    expect(res.body.instalacao).toBe(300)
  })

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/orcamentos/99999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/orcamentos/:id', () => {
  it('updates orcamento status', async () => {
    const res = await request(app)
      .patch(`/api/orcamentos/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'aprovado' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('aprovado')
  })
})

describe('DELETE /api/orcamentos/:id', () => {
  it('removes existing orcamento', async () => {
    const res = await request(app).delete(`/api/orcamentos/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
  })
})
