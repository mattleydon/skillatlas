# Contributing to SkillAtlas

SkillAtlas uses a feature-branch and pull-request workflow. Keep changes focused, preserve working functionality, and prefer a polished country-level MVP over unrelated expansion.

## Follow the repository rules

Read and follow [`AGENTS.md`](./AGENTS.md) before starting work. It defines the current product scope, design language, navigation requirements, and engineering rules. If this guide and `AGENTS.md` appear to conflict, stop and resolve the conflict before making a destructive change.

Automated contributors must also respect the instruction in `AGENTS.md` not to commit, push, or merge unless explicitly asked.

## Development workflow

### 1. Start from the latest `main`

Do not perform feature work directly on `main`.

```bash
git switch main
git pull --ff-only origin main
```

Confirm the working tree is clean before branching:

```bash
git status
```

### 2. Create a focused feature branch

Use a short, descriptive branch name:

```bash
git switch -c feature/short-description
```

Keep one feature or closely related set of changes per branch.

### 3. Inspect before editing

Review the repository structure, relevant routes, shared components, styles, and recent implementation before changing files. Do not replace newer working functionality with an older or duplicated implementation.

Run the project locally when useful:

```bash
npm install
npm run dev
```

### 4. Implement and validate

Preserve existing behavior unless the task explicitly changes it. Follow the shared design and navigation rules in `AGENTS.md` and keep layouts responsive in light and dark modes.

After substantial changes, run:

```bash
npm run build
```

Fix TypeScript and build errors before reporting the work as complete.

### 5. Review the change

Before committing, inspect the working tree and complete diff:

```bash
git status
git diff --check
git diff
```

Remove accidental or unrelated edits. Confirm every changed file belongs to the feature and summarise those files clearly.

### 6. Commit and push the feature branch

Create a concise commit, then push the branch rather than pushing feature work directly to `main`:

```bash
git add <files>
git commit -m "Concise change summary"
git push -u origin feature/short-description
```

### 7. Open a pull request

Create a pull request from the feature branch into `main`. The pull request should include:

- A concise summary of the change
- The important files or areas affected
- The successful `npm run build` result
- Any known limitations, follow-up work, or remaining warnings

Do not merge automatically.

### 8. Inspect the Vercel Preview

Open the Vercel Preview generated for the pull request and compare it with the intended local result. Check:

- Core interactions and routes
- Shared header and navigation behavior
- Light and dark modes
- Desktop, tablet, and mobile layouts
- Horizontal overflow, clipping, and spacing
- Browser console and obvious runtime errors

Report and fix preview-only or deployment issues on the same feature branch.

### 9. Review and merge

Merge into `main` only after the code diff, build, Vercel Preview, and requested behavior have been reviewed and approved. Do not bypass required review or merge with unresolved build or runtime errors.

### 10. Synchronise after merge

After the pull request is merged, update the local `main` branch:

```bash
git switch main
git pull --ff-only origin main
```

Confirm the expected merge is present and the working tree is clean before beginning the next feature branch.
