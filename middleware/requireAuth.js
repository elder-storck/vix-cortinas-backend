const db = require('../db/database')

function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado' })
  }
  const token = auth.slice(7)
  const usuario = db.prepare('SELECT * FROM usuarios WHERE token = ?').get(token)
  if (!usuario || !['admin', 'ativo'].includes(usuario.role)) {
    return res.status(401).json({ error: 'Token inválido ou usuário inativo' })
  }
  req.usuario = usuario
  next()
}

module.exports = requireAuth
