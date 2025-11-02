import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.claude/commands/openspec/proposal.md',
  'design-architect': '.claude/commands/openspec/design-architect.md',
  'init-architect': '.claude/commands/openspec/init-architect.md',
  'refine-architect': '.claude/commands/openspec/refine-architect.md',
  'sync-code-to-architect': '.claude/commands/openspec/sync-code-to-architect.md',
  apply: '.claude/commands/openspec/apply.md',
  archive: '.claude/commands/openspec/archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
name: OpenSpec: Proposal
description: Scaffold a new OpenSpec change and validate strictly.
category: OpenSpec
tags: [openspec, change]
---`,
  'design-architect': `---
name: OpenSpec: Tech Design
description: Iterate the OpenSpec architecture DSL for an approved change.
category: OpenSpec
tags: [openspec, architecture]
---`,
  'init-architect': `---
name: OpenSpec: Init Architect
description: Seed the OpenSpec architecture DSL from a requirement document.
category: OpenSpec
tags: [openspec, architecture, bootstrap]
---`,
  'refine-architect': `---
name: OpenSpec: Refine Architect
description: Refine the OpenSpec architecture DSL with a targeted prompt.
category: OpenSpec
tags: [openspec, architecture, refine]
---`,
  'sync-code-to-architect': `---
name: OpenSpec: Sync Code → Architect
description: Sync the OpenSpec architecture DSL with code-level findings.
category: OpenSpec
tags: [openspec, architecture, sync]
---`,
  apply: `---
name: OpenSpec: Apply
description: Implement an approved OpenSpec change and keep tasks in sync.
category: OpenSpec
tags: [openspec, apply]
---`,
  archive: `---
name: OpenSpec: Archive
description: Archive a deployed OpenSpec change and update specs.
category: OpenSpec
tags: [openspec, archive]
---`
};

export class ClaudeSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'claude';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
