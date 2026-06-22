CREATE TABLE IF NOT EXISTS clientes (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nome      TEXT NOT NULL,
  telefone  TEXT DEFAULT '',
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orcamentos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  numero        TEXT UNIQUE NOT NULL,
  cliente_id    INTEGER REFERENCES clientes(id),
  status        TEXT DEFAULT 'em_aberto',
  itens         TEXT NOT NULL DEFAULT '{"m2":[],"ml":[]}',
  instalacao    REAL DEFAULT 0,
  desconto      REAL DEFAULT 0,
  observacoes   TEXT DEFAULT '{"prazo":"","condicoes_instalacao":"","geral":""}',
  criado_em     TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria     TEXT NOT NULL,
  tipo          TEXT,
  nome          TEXT NOT NULL,
  cor           TEXT,
  preco         REAL NOT NULL DEFAULT 0,
  criado_em     TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usuarios (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL,
  empresa    TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'pendente',
  token      TEXT,
  criado_em  TEXT DEFAULT (datetime('now'))
);
