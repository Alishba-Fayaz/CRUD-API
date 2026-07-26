# Task API

A small in-memory CRUD API for managing a to-do list, built with Node.js and Express.
Built for FlyRank Internship — Backend Track — Week 2 — Assignment A1.

## What this is

A REST API that lets a client create, read, update, and delete tasks. Data is stored
in memory only (a JavaScript array) — it resets whenever the server restarts. There is
no database yet.

## How to install & run

```bash
npm install
node server.js
```

The server starts on **http://localhost:3000**.
Interactive Swagger docs are at **http://localhost:3000/docs**.

## Endpoints

| Method | Path            | Description                        | Success | Errors        |
|--------|-----------------|-------------------------------------|---------|---------------|
| GET    | `/`             | API info                            | 200     | —             |
| GET    | `/health`       | Health check                        | 200     | —             |
| GET    | `/tasks`        | List all tasks (supports `?done=` and `?search=`) | 200 | — |
| GET    | `/tasks/:id`    | Get a single task                   | 200     | 404 not found |
| POST   | `/tasks`        | Create a task (`{ "title": "..." }`)| 201     | 400 invalid   |
| PUT    | `/tasks/:id`    | Update a task's `title` and/or `done` | 200   | 400 invalid, 404 not found |
| DELETE | `/tasks/:id`    | Delete a task                       | 204     | 404 not found |
| GET    | `/stats`        | Task counts (total/done/open)       | 200     | —             |
| POST   | `/reset`        | Restore the 3 seed tasks            | 200     | —             |

## Example request

```bash
curl.exe -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "@body.json"
```

```
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 51

{"id":4,"title":"Review pull request","done":false}
```

I also verified the full CRUD cycle end-to-end via curl: `GET /tasks/99` → `404`,
`POST /tasks` with an empty body → `400`, `PUT /tasks/4` → `200`, `DELETE /tasks/4` → `204`,
and a follow-up `GET /tasks/4` → `404`, confirming the delete actually took effect.

## Swagger UI

![Swagger UI](./swagger-screenshot.png)

