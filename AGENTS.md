## Quality gates
- Run `npm run lint`, `npm run typecheck`, and `npm test` before completion.
- Git hooks live in `.githooks` (ensure `git config core.hooksPath .githooks`).

### React Router v7 data returns
- Do NOT use `json()` helpers (deprecated from Remix days). In React Router v7:
  - If you don’t need custom headers or status, return plain objects directly from loaders/actions: `return { ok: true }`.
  - If you need status and/or headers, use `data(payload, { status, headers })` from `react-router`.
