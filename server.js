const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');
const { DatabaseSync: Database } = require('node:sqlite');

const app = express();
const PORT = 3000;
const db = new Database('tasks.db');

app.use(express.json());

// ---- Stage 0: create table if missing, seed only if empty ----
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

const countRow = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
if (countRow.count === 0) {
  const insertSeed = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  insertSeed.run('Complete Assignment 1', 0);
  insertSeed.run('Submit project deliverables', 1);
  insertSeed.run('Write a progress report', 0);
  console.log('Seeded 3 example tasks (table was empty)');
} else {
  console.log(`Table already has ${countRow.count} task(s), skipping seed`);
}

// SQLite has no real boolean type — it stores 0/1. Convert back to true/false
// for the API so clients see exactly the same shape as Assignment 1.
function toApiShape(row) {
  return { id: row.id, title: row.title, done: !!row.done };
}

// ---- Root + health (unchanged from A1) ----
app.get('/', (req, res) => {
  res.json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ---- Read ----
app.get('/tasks', (req, res) => {
  let sql = 'SELECT * FROM tasks';
  const conditions = [];
  const params = [];

  if (req.query.done !== undefined) {
    conditions.push('done = ?');
    params.push(req.query.done === 'true' ? 1 : 0);
  }
  if (req.query.search) {
    conditions.push('title LIKE ?');
    params.push(`%${req.query.search}%`);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(toApiShape));
});

app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: `Task ${id} not found` });
  res.json(toApiShape(row));
});

// ---- Create ----
app.post('/tasks', (req, res) => {
  const { title } = req.body || {};
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }
  const info = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)').run(title.trim(), 0);
  res.status(201).json({ id: Number(info.lastInsertRowid), title: title.trim(), done: false });
});

// ---- Update & Delete ----
app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: `Task ${id} not found` });

  const { title, done } = req.body || {};
  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'Provide at least one of: title, done' });
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  if (done !== undefined && typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done must be a boolean' });
  }

  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newDone = done !== undefined ? (done ? 1 : 0) : existing.done;

  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);
  res.json({ id, title: newTitle, done: !!newDone });
});

app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: `Task ${id} not found` });
  res.status(204).send();
});

// ---- Extras, now computed with SQL instead of JS ----
app.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS c FROM tasks').get().c;
  const done = db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE done = 1').get().c;
  res.json({ total, done, open: total - done });
});

app.post('/reset', (req, res) => {
  db.exec('DELETE FROM tasks');
  const insertSeed = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  insertSeed.run('Complete Assignment 1', 0);
  insertSeed.run('Submit project deliverables', 1);
  insertSeed.run('Write a progress report', 0);
  const rows = db.prepare('SELECT * FROM tasks').all();
  res.json({ message: 'Tasks reset to seed data', tasks: rows.map(toApiShape) });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.listen(PORT, () => {
  console.log(`Task API (SQLite) listening on http://localhost:${PORT}`);
  console.log(`Swagger UI at http://localhost:${PORT}/docs`);
});
