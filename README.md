# Learning Journal

A local full-stack daily learning tracker built with React, Vite, TypeScript, Tailwind CSS, Express, and SQLite.

## Run Locally

```bash
npm install
npm run dev
```

Client: http://localhost:5173  
API: http://localhost:3001

The SQLite database is created automatically at `server/data/learning-journal.sqlite` and seeded with sample entries on first start.

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run start
```

## API

All responses use:

```json
{ "success": true, "data": {} }
```

or:

```json
{ "success": false, "error": "Message" }
```

Implemented endpoints:

- `GET /api/entries`
- `GET /api/entries/:id`
- `POST /api/entries`
- `PUT /api/entries/:id`
- `DELETE /api/entries/:id`
- `GET /api/entries/dates`
- `GET /api/stats`
- `GET /api/categories`
- `GET /api/tags`
