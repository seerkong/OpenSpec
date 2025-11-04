## MODIFIED Requirements
### Requirement: Quick Reference Placement
`openspec/AGENTS.md` SHALL explicitly call out the Kode CLI alongside other supported tools within the quick-reference section.
#### Scenario: Listing Kode shortcuts
- **WHEN** regenerating `openspec/AGENTS.md`
- **THEN** include Kode in the supported tooling quick-reference list
- **AND** spell out the `/openspec:proposal`, `/openspec:apply`, `/openspec:archive`, and `/openspec:validate` shortcuts so agents know how to trigger them inside the CLI
- **AND** point readers to install `@shareai-lab/kode` alongside `@fission-ai/openspec` when they want the combined workflow.
