# Contributing to StreamDeck for MentraOS

Thanks for your interest in contributing — StreamDeck is meant to be a community project for the MentraOS ecosystem.

This document explains how to get set up locally, the branch and PR workflow, and a few code-style expectations.

---

## Local development

### Prerequisites

- [Bun](https://bun.sh) installed (latest stable)
- Node.js 18+ (for tooling compatibility)
- A MentraOS developer account with:
  - A package name (e.g. `com.mrdula.streamdeck`)
  - An API key

### Setup

```bash
git clone https://github.com/mrdulasolutions/streamdeck.git
cd streamdeck

bun install
cp .env.example .env
```

Edit `.env` to match your MentraOS app:

```env
PACKAGE_NAME=com.yourcompany.streamdeck
MENTRAOS_API_KEY=your-mentra-api-key
PORT=3000
```

### Run the app

```bash
# Dev mode with hot reload
bun run dev

# Or without hot reload
bun run start
```

The server will start on `http://localhost:3000`.

If you want to test with Mentra Cloud from real devices, expose the port via ngrok:

```bash
bun run tunnel
```

---

## Branch strategy

- **`main`** — stable branch, always deployable
- Feature work should happen in **topic branches**:
  - `feature/short-description`
  - `fix/short-description`
  - `docs/short-description`

Workflow:

1. Fork the repo (or create a branch if you have write access)
2. Create a topic branch from `main`
3. Make your changes (see code style below)
4. Run checks locally
5. Open a Pull Request against `main`

---

## Checks to run before opening a PR

From the repo root:

```bash
bun install
bun run typecheck
bun test
```

The CI workflow will run the same commands on every push/PR:

- `bun run typecheck` (wraps `tsc --noEmit`)
- `bun test`

Please make sure these pass before requesting a review.

---

## Code style & guidelines

### TypeScript

- Use modern TypeScript with `strict` mode (see `tsconfig.json`)
- Prefer explicit types for public APIs (method parameters, return types, exported values)
- Avoid `any` unless there is a clear interop reason and leave a short comment when you do

### Project structure

- Backend app entrypoint is in `src/index.ts`
- Webview routes and UI wiring live in `src/webview.ts` and `src/views/webview.ejs`
- Tests live alongside source in `src/__tests__` (Bun test)

If you add a new subsystem, consider adding a short design note to `docs/ARCHITECTURE.md`.

### Tests

- Use `bun test` with the built-in test runner
- Aim for at least a smoke test when adding new behavior (e.g. non-trivial route, helper, or streaming logic)
- Keep tests fast and side-effect-free; mock MentraOS SDK calls where appropriate

---

## Pull Requests

When opening a PR:

- Provide a clear, concise summary in the PR description
- Link to any related issues
- Add screenshots or screen recordings if you change the webview UI
- Check off the items in `.github/pull_request_template.md`

PRs that are small and focused are easier to review and merge quickly.

---

## Reporting bugs & requesting features

- For **bugs**, use the “Bug report” issue template
- For **feature requests**, use the “Feature request” issue template

For security-sensitive issues, please **do not** open a public issue — see `SECURITY.md` for instructions.

---

## Code of Conduct

By participating in this project, you agree to uphold the standards described in [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

