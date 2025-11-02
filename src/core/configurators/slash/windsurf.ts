import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.windsurf/workflows/openspec-proposal.md',
  'design-architect': '.windsurf/workflows/openspec-design-architect.md',
  'init-architect': '.windsurf/workflows/openspec-init-architect.md',
  'refine-architect': '.windsurf/workflows/openspec-refine-architect.md',
  'sync-code-to-architect': '.windsurf/workflows/openspec-sync-code-to-architect.md',
  apply: '.windsurf/workflows/openspec-apply.md',
  archive: '.windsurf/workflows/openspec-archive.md'
};

export class WindsurfSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'windsurf';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string | undefined {
    const descriptions: Record<SlashCommandId, string> = {
      proposal: 'Scaffold a new OpenSpec change and validate strictly.',
      'design-architect': 'Iterate the OpenSpec architecture DSL for the selected change.',
      'init-architect': 'Seed the OpenSpec architecture DSL from a requirement document.',
      'refine-architect': 'Refine the OpenSpec architecture DSL with a targeted prompt.',
      'sync-code-to-architect': 'Sync the OpenSpec architecture DSL with code-level findings.',
      apply: 'Implement an approved OpenSpec change and keep tasks in sync.',
      archive: 'Archive a deployed OpenSpec change and update specs.'
    };
    const description = descriptions[id];
    return `---\ndescription: ${description}\nauto_execution_mode: 3\n---`;
  }
}
