import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.kode/commands/openspec-proposal.md',
  'design-architect': '.kode/commands/openspec-design-architect.md',
  'init-architect': '.kode/commands/openspec-init-architect.md',
  'refine-architect': '.kode/commands/openspec-refine-architect.md',
  'sync-code-to-architect': '.kode/commands/openspec-sync-code-to-architect.md',
  apply: '.kode/commands/openspec-apply.md',
  archive: '.kode/commands/openspec-archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
name: project:openspec:proposal
description: Create an OpenSpec change proposal using canonical guardrails and steps.
aliases: [openspec:proposal]
progressMessage: Assembling OpenSpec proposal instructions...
---`,
  'design-architect': `---
name: project:openspec:design-architect
description: Iterate the OpenSpec architecture DSL before implementation.
aliases: [openspec:design-architect]
progressMessage: Preparing OpenSpec design-architect guidance...
---`,
  'init-architect': `---
name: project:openspec:init-architect
description: Seed the OpenSpec architecture DSL from a requirement document.
aliases: [openspec:init-architect]
progressMessage: Preparing OpenSpec init-architect guidance...
---`,
  'refine-architect': `---
name: project:openspec:refine-architect
description: Refine the OpenSpec architecture DSL with a targeted prompt.
aliases: [openspec:refine-architect]
progressMessage: Preparing OpenSpec refine-architect guidance...
---`,
  'sync-code-to-architect': `---
name: project:openspec:sync-code-to-architect
description: Sync the OpenSpec architecture DSL with code-level findings.
aliases: [openspec:sync-code-to-architect]
progressMessage: Preparing OpenSpec sync-code-to-architect guidance...
---`,
  apply: `---
name: project:openspec:apply
description: Follow OpenSpec apply workflow and checklist.
aliases: [openspec:apply]
progressMessage: Preparing OpenSpec apply guidance...
---`,
  archive: `---
name: project:openspec:archive
description: Archive an OpenSpec change using canonical workflow.
aliases: [openspec:archive]
progressMessage: Preparing OpenSpec archive guidance...
---`
};

export class KodeSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'kode';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }

  protected getBody(id: SlashCommandId): string {
    const baseBody = super.getBody(id);
    const contextBlock = this.getContextBlock(id);
    return [
      `You are running the OpenSpec ${id} workflow from inside the Kode CLI.`,
      baseBody,
      contextBlock
    ].join('\n\n');
  }

  private getContextBlock(id: SlashCommandId): string {
    switch (id) {
      case 'proposal':
        return `<ChangeRequest>\n$ARGUMENTS\n</ChangeRequest>`;
      case 'design-architect':
        return `<TechDesignInput>\n$ARGUMENTS\n</TechDesignInput>`;
      case 'init-architect':
        return `<InitArchitectInput>\n$ARGUMENTS\n</InitArchitectInput>`;
      case 'refine-architect':
        return `<RefineArchitectInput>\n$ARGUMENTS\n</RefineArchitectInput>`;
      case 'sync-code-to-architect':
        return `<SyncArchitectInput>\n$ARGUMENTS\n</SyncArchitectInput>`;
      case 'apply':
        return `<ChangeId>\n$ARGUMENTS\n</ChangeId>`;
      case 'archive':
        return `<ChangeId>\n$ARGUMENTS\n</ChangeId>`;
      default:
        return '$ARGUMENTS';
    }
  }
}
