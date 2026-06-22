import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import db from '../db/database.js'

let adminToken

beforeAll(async () => {
  db.prepare('DELETE FROM clientes').run()
  db.prepare("UPDATE usuarios SET token = NULL WHERE role = 'admin'").run()
  const login = await request(app).post('/api/auth/login').send({
    email: 'admin@vix.com', senha: process.env.ADMIN_SENHA || 'admin123'
  })
  adminToken = login.body.token
})

describe('POST /api/clientes', () => {
  it('creates client with name and phone', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Maria Silva', telefone: '11999990000' })
    expect(res.status).toBe(201)
    expect(res.body.nome).toBe('Maria Silva')
    expect(res.body.id).toBeDefined()
  })

  it('rejects client without name', async () => {
    const res = await request(app).post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ telefone: '11999990000' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })
})

describe('GET /api/clientes', () => {
  it('lists all clients', async () => {
    const res = await request(app).get('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('filters clients by name', async () => {
    const res = await request(app).get('/api/clientes?q=Maria')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body[0].nome).toContain('Maria')
  })
})
