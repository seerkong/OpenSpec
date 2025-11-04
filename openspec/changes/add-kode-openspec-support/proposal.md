## Why
Kode currently has no awareness of the OpenSpec workflow, forcing users to fall back to manual prompts or external slash commands. Without native support the terminal assistant cannot surface `/openspec:` shortcuts through Tab completion, interpret those commands, or help agents run `openspec validate` as part of the hand-off. Tight integration is required so the paired repositories (Kode + OpenSpec) deliver an end-to-end spec-driven workflow inside the CLI experience.

## What Changes
- Introduce built-in `/openspec:proposal`, `/openspec:apply`, and `/openspec:archive` commands in Kode that mirror the canonical OpenSpec slash templates and participate in the unified completion system.
- Add a validation helper inside Kode that shells out to the local OpenSpec CLI (`openspec validate --strict`) and shares the results inline when agents invoke an `/openspec:validate` shortcut.
- Update OpenSpec tooling and documentation so `openspec init`/`update` advertise Kode as a first-class integration and keep AGENTS.md guidance synchronized with the new CLI behaviour.

## Impact
- Affected specs: `specs/kode-openspec-integration`, `specs/docs-agent-instructions`
- Affected code: `Kode/src/commands`, `Kode/src/hooks/useUnifiedCompletion.ts`, `Kode/src/services/*`, `OpenSpec/src/core/templates`, `OpenSpec/src/core/configurators`, documentation under both repos.
