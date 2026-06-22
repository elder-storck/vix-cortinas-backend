function requireAdmin(req, res, next) {
  if (req.usuario?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador' })
  }
  next()
}

module.exports = requireAdmin
