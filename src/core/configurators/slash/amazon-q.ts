import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.amazonq/prompts/openspec-proposal.md',
  'design-architect': '.amazonq/prompts/openspec-design-architect.md',
  'init-architect': '.amazonq/prompts/openspec-init-architect.md',
  'refine-architect': '.amazonq/prompts/openspec-refine-architect.md',
  'sync-code-to-architect': '.amazonq/prompts/openspec-sync-code-to-architect.md',
  apply: '.amazonq/prompts/openspec-apply.md',
  archive: '.amazonq/prompts/openspec-archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
description: Scaffold a new OpenSpec change and validate strictly.
---

The user has requested the following change proposal. Use the openspec instructions to create their change proposal.

<UserRequest>
  $ARGUMENTS
</UserRequest>`,
  'design-architect': `---
description: Iterate the OpenSpec architecture DSL for the selected change.
---

The user wants to evolve the architecture for the following change. Use the OpenSpec design-architect workflow to update the DSL and mutation log.

<ChangeId>
  $ARGUMENTS
</ChangeId>`,
  'init-architect': `---
description: Seed the OpenSpec architecture DSL from a requirement document.
---

The user needs to bootstrap the architecture DSL using the provided requirement document. Follow the OpenSpec init-architect workflow to generate the initial modules and module relations.

<InitArchitectInput>
  $ARGUMENTS
</InitArchitectInput>`,
  'refine-architect': `---
description: Refine the OpenSpec architecture DSL with a targeted prompt.
---

The user wants to iterate on the architecture DSL according to the following instructions. Use the OpenSpec refine-architect workflow to update mutations and snapshots.

<RefineArchitectInput>
  $ARGUMENTS
</RefineArchitectInput>`,
  'sync-code-to-architect': `---
description: Sync the OpenSpec architecture DSL with code-level findings.
---

The user wants to synchronize architecture from the codebase using these parameters. Run the OpenSpec sync-code-to-architect workflow and apply the resulting MutationPartial.

<SyncArchitectInput>
  $ARGUMENTS
</SyncArchitectInput>`,
  apply: `---
description: Implement an approved OpenSpec change and keep tasks in sync.
---

The user wants to apply the following change. Use the openspec instructions to implement the approved change.

<ChangeId>
  $ARGUMENTS
</ChangeId>`,
  archive: `---
description: Archive a deployed OpenSpec change and update specs.
---

The user wants to archive the following deployed change. Use the openspec instructions to archive the change and update specs.

<ChangeId>
  $ARGUMENTS
</ChangeId>`
};

export class AmazonQSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'amazon-q';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
