import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.factory/commands/openspec-proposal.md',
  'design-architect': '.factory/commands/openspec-design-architect.md',
  'init-architect': '.factory/commands/openspec-init-architect.md',
  'refine-architect': '.factory/commands/openspec-refine-architect.md',
  'sync-code-to-architect': '.factory/commands/openspec-sync-code-to-architect.md',
  apply: '.factory/commands/openspec-apply.md',
  archive: '.factory/commands/openspec-archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
description: Scaffold a new OpenSpec change and validate strictly.
argument-hint: request or feature description
---`,
  'design-architect': `---
description: Iterate the OpenSpec architecture DSL for the selected change.
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

export class FactorySlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'factory';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }

  protected getBody(id: SlashCommandId): string {
    const baseBody = super.getBody(id);
    return `${baseBody}\n\n$ARGUMENTS`;
  }
}
