import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import db from '../db/database.js'

let adminToken

beforeAll(async () => {
  db.prepare('DELETE FROM produtos').run()
  db.prepare("UPDATE usuarios SET token = NULL WHERE role = 'admin'").run()
  const login = await request(app).post('/api/auth/login').send({
    email: 'admin@vix.com', senha: process.env.ADMIN_SENHA || 'admin123'
  })
  adminToken = login.body.token
})

describe('POST /api/produtos', () => {
  it('cria produto m2', async () => {
    const res = await request(app).post('/api/produtos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoria: 'm2', tipo: 'Persiana', nome: 'Alumínio', cor: 'Branco', preco: 48 })
    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.nome).toBe('Alumínio')
  })

  it('rejeita sem nome', async () => {
    const res = await request(app).post('/api/produtos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoria: 'm2' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/produtos', () => {
  it('lista todos', async () => {
    const res = await request(app).get('/api/produtos')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('filtra por categoria', async () => {
    await request(app).post('/api/produtos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoria: 'ml', nome: 'Voil', preco: 32 })
    const res = await request(app).get('/api/produtos?categoria=ml')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.every(p => p.categoria === 'ml')).toBe(true)
  })
})

describe('PATCH /api/produtos/:id', () => {
  it('atualiza preço', async () => {
    const created = await request(app).post('/api/produtos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoria: 'm2', nome: 'Tela Solar', preco: 55 })
    const id = created.body.id
    const res = await request(app).patch(`/api/produtos/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ preco: 60 })
    expect(res.status).toBe(200)
    expect(res.body.preco).toBe(60)
  })

  it('retorna 404 para id inexistente', async () => {
    const res = await request(app).patch('/api/produtos/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ preco: 10 })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/produtos/:id', () => {
  it('remove produto', async () => {
    const created = await request(app).post('/api/produtos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoria: 'blackout', nome: 'Blackout Duplo', preco: 62 })
    const id = created.body.id
    const del = await request(app).delete(`/api/produtos/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(del.status).toBe(204)
    const get = await request(app).get('/api/produtos?categoria=blackout')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(get.body.find(p => p.id === id)).toBeUndefined()
  })

  it('retorna 404 para id inexistente', async () => {
    const res = await request(app).delete('/api/produtos/99999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})
