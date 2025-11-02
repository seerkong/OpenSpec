import { SlashCommandConfigurator } from "./base.js";
import { SlashCommandId } from "../../templates/index.js";

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: ".kilocode/workflows/openspec-proposal.md",
  "design-architect": ".kilocode/workflows/openspec-design-architect.md",
  "init-architect": ".kilocode/workflows/openspec-init-architect.md",
  "refine-architect": ".kilocode/workflows/openspec-refine-architect.md",
  "sync-code-to-architect": ".kilocode/workflows/openspec-sync-code-to-architect.md",
  apply: ".kilocode/workflows/openspec-apply.md",
  archive: ".kilocode/workflows/openspec-archive.md"
};

export class KiloCodeSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = "kilocode";
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(_id: SlashCommandId): string | undefined {
    return undefined;
  }
}
