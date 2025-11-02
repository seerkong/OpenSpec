import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.augment/commands/openspec-proposal.md',
  'design-architect': '.augment/commands/openspec-design-architect.md',
  'init-architect': '.augment/commands/openspec-init-architect.md',
  'refine-architect': '.augment/commands/openspec-refine-architect.md',
  'sync-code-to-architect': '.augment/commands/openspec-sync-code-to-architect.md',
  apply: '.augment/commands/openspec-apply.md',
  archive: '.augment/commands/openspec-archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
description: Scaffold a new OpenSpec change and validate strictly.
argument-hint: feature description or request
---`,
  'design-architect': `---
description: Iterate the architecture DSL for an OpenSpec change before implementation.
argument-hint: change-id
---`,
  'init-architect': `---
description: Seed the OpenSpec architecture DSL from a requirement document.
argument-hint: requirement doc path or summary
---`,
  'refine-architect': `---
description: Refine the OpenSpec architecture DSL with a targeted prompt.
argument-hint: prompt text (optionally with --change)
---`,
  'sync-code-to-architect': `---
description: Sync the OpenSpec architecture DSL with code-level findings.
argument-hint: paths/prompt/--change flags
---`,
  apply: `---
description: Implement an approved OpenSpec change and keep tasks in sync.
argument-hint: change-id
---`,
  archive: `---
description: Archive a deployed OpenSpec change and update specs.
argument-hint: change-id
---`
};

export class AuggieSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'auggie';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
