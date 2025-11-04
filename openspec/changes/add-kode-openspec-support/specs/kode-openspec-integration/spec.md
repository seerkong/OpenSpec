## ADDED Requirements
### Requirement: Kode exposes OpenSpec slash commands
Kode SHALL register builtin `/openspec:` commands so users can trigger proposal, apply, archive, and validation workflows directly from the terminal assistant.

#### Scenario: Tab completion surfaces OpenSpec commands
- **GIVEN** a repo with Kode installed and OpenSpec files present
- **WHEN** the user types `/open` in the prompt and presses Tab
- **THEN** the completion list SHALL include `/openspec:proposal`, `/openspec:apply`, `/openspec:archive`, and `/openspec:validate`
- **AND** selecting one of the entries SHALL insert the full command name in the input field.

#### Scenario: Slash command syntax is accepted verbatim
- **WHEN** the user submits `/openspec:apply add login audit logging`
- **THEN** Kode SHALL treat it as a recognized command (not a plain chat message)
- **AND** route execution to the OpenSpec command handler with the argument string `add login audit logging`.

### Requirement: Command prompts reuse canonical OpenSpec instructions
Kode SHALL reuse the canonical guardrails/steps from OpenSpec slash templates so agents receive consistent instructions regardless of tooling.

#### Scenario: Proposal command mirrors canonical template
- **WHEN** `/openspec:proposal add multi-tenant settings` is invoked
- **THEN** the generated prompt SHALL include the same Guardrails and Steps text shipped in `slash-command-templates.ts`
- **AND** mention the requirement to run `openspec validate <id> --strict` before sharing the proposal.

#### Scenario: Apply command reminds agents to validate
- **WHEN** `/openspec:apply add multi-tenant settings` is executed
- **THEN** the prompt body SHALL contain the canonical apply guardrails and steps
- **AND** explicitly direct the agent to run `openspec validate --strict` before marking tasks complete.

### Requirement: Validate command shells out to OpenSpec CLI
Kode SHALL provide a validation runner that executes the OpenSpec CLI and streams the results back to the chat.

#### Scenario: Successful validation shows pass status
- **WHEN** `/openspec:validate add-profile-filters` runs in a project where `openspec validate add-profile-filters --strict` exits with code 0
- **THEN** Kode SHALL display the CLI stdout with a success indicator (e.g., "OpenSpec validation passed")
- **AND** return control to the conversation without queuing a model request.

#### Scenario: Missing CLI produces remediation message
- **WHEN** `/openspec:validate` runs on a machine without the `openspec` binary in PATH and no project-local install
- **THEN** Kode SHALL show an actionable error that explains how to install `@fission-ai/openspec` or rerun via `pnpm exec openspec`
- **AND** exit the command without crashing the session.

#### Scenario: Validation failure shares stderr and exit code
- **WHEN** the OpenSpec CLI exits non-zero during `/openspec:validate add-profile-filters`
- **THEN** Kode SHALL surface the exit code and the final stderr lines so the user can debug the failure
- **AND** mark the command as failed while leaving the assistant idle awaiting further input.
