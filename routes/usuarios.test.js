import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import db from '../db/database.js'

let adminToken
let userId

beforeAll(async () => {
  db.prepare("DELETE FROM usuarios WHERE role != 'admin'").run()
  db.prepare("UPDATE usuarios SET token = NULL WHERE role = 'admin'").run()

  const login = await request(app).post('/api/auth/login').send({
    email: 'admin@vix.com', senha: process.env.ADMIN_SENHA || 'admin123'
  })
  adminToken = login.body.token

  const reg = await request(app).post('/api/auth/registro').send({
    nome: 'Maria', empresa: 'Cortinas M', email: 'maria@test.com', senha: '123456'
  })
  userId = reg.body.id
})

describe('GET /api/usuarios', () => {
  it('admin lista usuários', async () => {
    const res = await request(app).get('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.some(u => u.email === 'maria@test.com')).toBe(true)
  })

  it('não-autenticado recebe 401', async () => {
    const res = await request(app).get('/api/usuarios')
    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/usuarios/:id', () => {
  it('admin aprova usuário', async () => {
    const res = await request(app).patch(`/api/usuarios/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ativo' })
    expect(res.status).toBe(200)
    expect(res.body.role).toBe('ativo')
  })

  it('rejeita role inválido', async () => {
    const res = await request(app).patch(`/api/usuarios/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' })
    expect(res.status).toBe(400)
  })

  it('não pode alterar o admin', async () => {
    const admin = db.prepare("SELECT id FROM usuarios WHERE role = 'admin'").get()
    const res = await request(app).patch(`/api/usuarios/${admin.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ativo' })
    expect(res.status).toBe(404)
  })
})
