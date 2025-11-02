import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.cursor/commands/openspec-proposal.md',
  'design-architect': '.cursor/commands/openspec-design-architect.md',
  'init-architect': '.cursor/commands/openspec-init-architect.md',
  'refine-architect': '.cursor/commands/openspec-refine-architect.md',
  'sync-code-to-architect': '.cursor/commands/openspec-sync-code-to-architect.md',
  apply: '.cursor/commands/openspec-apply.md',
  archive: '.cursor/commands/openspec-archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
name: /openspec-proposal
id: openspec-proposal
category: OpenSpec
description: Scaffold a new OpenSpec change and validate strictly.
---`,
  'design-architect': `---
name: /openspec-design-architect
id: openspec-design-architect
category: OpenSpec
description: Iterate the OpenSpec architecture DSL for the selected change.
---`,
  'init-architect': `---
name: /openspec-init-architect
id: openspec-init-architect
category: OpenSpec
description: Seed the OpenSpec architecture DSL from a requirement document.
---`,
  'refine-architect': `---
name: /openspec-refine-architect
id: openspec-refine-architect
category: OpenSpec
description: Refine the OpenSpec architecture DSL with a targeted prompt.
---`,
  'sync-code-to-architect': `---
name: /openspec-sync-code-to-architect
id: openspec-sync-code-to-architect
category: OpenSpec
description: Sync the OpenSpec architecture DSL with code-level findings.
---`,
  apply: `---
name: /openspec-apply
id: openspec-apply
category: OpenSpec
description: Implement an approved OpenSpec change and keep tasks in sync.
---`,
  archive: `---
name: /openspec-archive
id: openspec-archive
category: OpenSpec
description: Archive a deployed OpenSpec change and update specs.
---`
};

export class CursorSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'cursor';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
