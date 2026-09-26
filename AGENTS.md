# Repository instructions

Read `README.md` and the relevant specification for scanner behavior and scoring. This dedicated file is the agent entry point; `CLAUDE.md` continues to reference the README. Preserve scan semantics and security boundaries when changing analyzers.

The app uses Remix/React on Cloudflare Pages. Routes are in `app/routes/`; scanner/scoring logic is under `app/lib/`. `vitest.config.ts` configures tests, and `.github/workflows/ci.yml` defines the validation baseline.

Use Node 22 as in CI and `npm ci` with the lockfile. Root commands are `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test` (single Vitest run), and `npm run build`. Start with tests for the changed route/analyzer, then the relevant CI checks. For UI changes, inspect the changed flow in a browser as well as checking the build. For instruction-only changes, use path/link inspection and `git diff --check -- <changed-paths>`.

Use mocked HTTP responses and disposable local state for scanner tests; running against real URLs is an external network action and does not establish deterministic coverage. Read the README's custom Worker/Pages build instructions before release: `npm run deploy` is a publishing action, not a smoke test. Keep credentials and remote storage changes outside ordinary verification.

Complete the authorized change through relevant verification and repair of introduced failures. Resolve routine implementation choices directly; ask only for information or decisions that materially affect the result. If blocked, name the affected action and missing prerequisite, continue independent work, and close with changed paths, checks actually run, and unverified behavior.
