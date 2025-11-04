## Overview
Kode already ships a pluggable slash command system (`src/commands`) plus a unified completion hook that discovers commands dynamically. The OpenSpec CLI keeps canonical slash command templates under `src/core/templates/slash-command-templates.ts` and generates editor-specific stubs. The design connects both sides without inventing a new workflow: Kode consumes those canonical instructions while OpenSpec documents Kode as a supported surface.

## Command surfaces
- **Prompt commands**: `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` will be implemented as `type: 'prompt'` commands. Their prompt bodies will embed the same guardrails/steps used by existing OpenSpec templates so agents receive consistent instructions regardless of tool.
- **Local command**: `/openspec:validate` will be a `type: 'local'` command that shells out via the existing Bash tool helper. It must locate the `openspec` binary via PATH (falling back to `pnpm exec openspec` when the binary is missing) and stream formatted output back to the conversation.
- **Completion**: The unified completion hook already indexes commands, but we will add explicit weighting so `/openspec:` entries rank alongside core commands when typing `/open…`.

## Validation runner
- Use the existing `PersistentShell` utility where possible to execute `openspec validate <id?> --strict`. When run without arguments the command should validate the entire repo; when arguments follow, forward them verbatim.
- Capture stdout/stderr separately so success can render with a green prefix while failures surface the CLI exit code and tail output for debugging.
- When the binary is missing, surface a friendly remediation message that suggests installing `@fission-ai/openspec` or running within the OpenSpec repo via `pnpm exec`.

## Tooling alignment
- Update `OpenSpec` CLI configurators to list Kode as a supported integration (no file scaffolding required because Kode ships the commands internally, but documentation must guide users to update Kode if templates change).
- Refresh `openspec/AGENTS.md` and README snippets so AI agents know Kode exposes these shortcuts and still rely on `openspec validate --strict` before implementation hand-off.
- Ensure automated tests assert the new command registration plus the validation runner behaviour under success and failure cases.
