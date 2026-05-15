<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# UI Rules

- Always use ShadCN components when possible.
- Never create custom buttons, dialogs, inputs, or modals if ShadCN already provides them.
- Prefer composition of ShadCN components.
- Keep UI clean and modern.
- Use Tailwind utility classes only.

---

# HTTP Rules

- Always use Axios for HTTP requests.
- Create a reusable Axios instance in `/lib/axios.ts`.
- Never use `fetch` directly unless explicitly requested.
- Handle errors with interceptors.

---

# Component Rules

- Use client components by default.
- Keep components small and reusable.
- Avoid prop drilling; use Zustand when shared state is needed.

---

# Code Style

- Use TypeScript strictly.
- Never use `any`.
- Use meaningful names.
- Avoid duplicated logic.
- Extract reusable hooks.

---

# Folder Structure

```text
app/
|-- page.tsx
|-- layout.tsx
`-- globals.css

components/
|-- ui/
|-- forms/
|-- templates/
`-- presentation/

services/
|-- api.ts
`-- presentation.service.ts

types/
`-- presentation.ts

hooks/

lib/
`-- utils.ts
```

---

# Before Generating Code

Always:

1. Analyze existing patterns.
2. Reuse existing components.
3. Respect folder structure.
4. Follow existing naming conventions.

---

# 📝 Documentation Maintenance

- **README Rule**: Every time a new core feature, major UI component (like a new workspace tool), or global state logic is modified, you MUST update the `README.md` to reflect these changes.
- Ensure the `Project Structure` and `Features` sections remain accurate.

