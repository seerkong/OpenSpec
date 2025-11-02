import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.github/prompts/openspec-proposal.prompt.md',
  'design-architect': '.github/prompts/openspec-design-architect.prompt.md',
  'init-architect': '.github/prompts/openspec-init-architect.prompt.md',
  'refine-architect': '.github/prompts/openspec-refine-architect.prompt.md',
  'sync-code-to-architect': '.github/prompts/openspec-sync-code-to-architect.prompt.md',
  apply: '.github/prompts/openspec-apply.prompt.md',
  archive: '.github/prompts/openspec-archive.prompt.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
description: Scaffold a new OpenSpec change and validate strictly.
---

$ARGUMENTS`,
  'design-architect': `---
description: Iterate the OpenSpec architecture DSL for the selected change.
---

$ARGUMENTS`,
  'init-architect': `---
description: Seed the OpenSpec architecture DSL from a requirement document.
---

$ARGUMENTS`,
  'refine-architect': `---
description: Refine the OpenSpec architecture DSL with a targeted prompt.
---

$ARGUMENTS`,
  'sync-code-to-architect': `---
description: Sync the OpenSpec architecture DSL with code-level findings.
---

$ARGUMENTS`,
  apply: `---
description: Implement an approved OpenSpec change and keep tasks in sync.
---

$ARGUMENTS`,
  archive: `---
description: Archive a deployed OpenSpec change and update specs.
---

$ARGUMENTS`
};

export class GitHubCopilotSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'github-copilot';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
