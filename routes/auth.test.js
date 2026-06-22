import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import db from '../db/database.js'

beforeAll(() => {
  db.prepare("DELETE FROM usuarios WHERE role != 'admin'").run()
  db.prepare("UPDATE usuarios SET token = NULL WHERE role = 'admin'").run()
})

let adminToken

describe('POST /api/auth/registro', () => {
  it('cria usuário pendente', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nome: 'Teste', empresa: 'Empresa X', email: 'teste@email.com', senha: '123456'
    })
    expect(res.status).toBe(201)
    expect(res.body.role).toBe('pendente')
    expect(res.body.senha_hash).toBeUndefined()
  })

  it('rejeita campos faltando', async () => {
    const res = await request(app).post('/api/auth/registro').send({ nome: 'Só nome' })
    expect(res.status).toBe(400)
  })

  it('rejeita e-mail duplicado', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nome: 'Outro', empresa: 'Y', email: 'teste@email.com', senha: '654321'
    })
    expect(res.status).toBe(409)
  })
})

describe('POST /api/auth/login', () => {
  it('recusa usuário pendente', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'teste@email.com', senha: '123456' })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/aprovação/)
  })

  it('recusa senha errada', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@vix.com', senha: 'errada' })
    expect(res.status).toBe(401)
  })

  it('loga admin e retorna token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@vix.com', senha: process.env.ADMIN_SENHA || 'admin123'
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.usuario.role).toBe('admin')
    adminToken = res.body.token
  })
})

describe('GET /api/auth/me', () => {
  it('retorna usuário logado', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.role).toBe('admin')
    expect(res.body.senha_hash).toBeUndefined()
  })

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('apaga token do banco', async () => {
    const res = await request(app).post('/api/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
    const row = db.prepare('SELECT token FROM usuarios WHERE email = ?').get('admin@vix.com')
    expect(row.token).toBeNull()
  })
})
