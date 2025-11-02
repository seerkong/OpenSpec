export const ARCHITECT_DIR = 'openspec/architect';
export const ARCHITECT_STATE_FILE = 'state.json';

export const ARCHITECT_PROMPT_DIR = 'prompts';

export type ArchitectNodeType =
  | 'Module'
  | 'ModuleRelationDiagram'
  | 'Entity'
  | 'EntityRelationDiagram'
  | 'Enum'
  | 'HttpEndpoint'
  | 'PublicProcedure'
  | 'PrivateProcedure'
  | 'StateMachine'
  | 'BackendCache'
  | 'ViewComponent'
  | 'Page';

export const ARCHITECT_NODE_TYPES: ArchitectNodeType[] = [
  'Module',
  'ModuleRelationDiagram',
  'Entity',
  'EntityRelationDiagram',
  'Enum',
  'HttpEndpoint',
  'PublicProcedure',
  'PrivateProcedure',
  'StateMachine',
  'BackendCache',
  'ViewComponent',
  'Page'
];

export const MUTATION_LOG_FILE = 'mutations.xml';

export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
