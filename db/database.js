const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'db.sqlite')
const SCHEMA_PATH = path.join(__dirname, 'schema.sql')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8')
const statements = schema.split(';').map(s => s.trim()).filter(Boolean)
for (const statement of statements) {
  db.prepare(statement).run()
}

module.exports = db
