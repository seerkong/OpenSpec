import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import vm from 'vm';
import { FileSystemUtils } from '../../utils/file-system.js';
import {
  ARCHITECT_DIR,
  ARCHITECT_NODE_TYPES,
  ARCHITECT_PROMPT_DIR,
  ARCHITECT_STATE_FILE,
  ArchitectNodeType,
} from './constants.js';

export type ArchitectNodeRecord = Record<string, ArchitectNodeData>;

export interface ArchitectState {
  Module: ArchitectNodeRecord;
  ModuleRelationDiagram: ArchitectNodeRecord;
  Entity: ArchitectNodeRecord;
  EntityRelationDiagram: ArchitectNodeRecord;
  Enum: ArchitectNodeRecord;
  HttpEndpoint: ArchitectNodeRecord;
  PublicProcedure: ArchitectNodeRecord;
  PrivateProcedure: ArchitectNodeRecord;
  StateMachine: ArchitectNodeRecord;
  BackendCache: ArchitectNodeRecord;
  ViewComponent: ArchitectNodeRecord;
  Page: ArchitectNodeRecord;
}

export interface ArchitectNodeData {
  version: number;
  [key: string]: any;
}

export interface MutationApplication {
  type: ArchitectNodeType;
  id: string;
  mutationType: MutationType;
  previousVersion?: number;
  nextVersion?: number;
}

export type MutationType = 'Create' | 'Update' | 'Delete';

export interface ApplyMutationOptions {
  dryRun?: boolean;
  onDeleteFile?: (filePath: string) => Promise<void>;
}

export const EMPTY_STATE: ArchitectState = ARCHITECT_NODE_TYPES.reduce(
  (acc, type) => {
    (acc as any)[type] = {};
    return acc;
  },
  {} as ArchitectState
);

export async function ensureArchitectWorkspace(
  projectPath: string
): Promise<string> {
  const architectPath = path.join(projectPath, ARCHITECT_DIR);
  await FileSystemUtils.createDirectory(architectPath);
  await FileSystemUtils.createDirectory(
    path.join(architectPath, ARCHITECT_PROMPT_DIR)
  );
  return architectPath;
}

export async function loadArchitectState(
  projectPath: string
): Promise<ArchitectState> {
  const architectPath = await ensureArchitectWorkspace(projectPath);
  const statePath = path.join(architectPath, ARCHITECT_STATE_FILE);
  if (!existsSync(statePath)) {
    return structuredClone(EMPTY_STATE);
  }

  const raw = await fs.readFile(statePath, 'utf-8');
  const data = JSON.parse(raw) as ArchitectState;
  for (const type of ARCHITECT_NODE_TYPES) {
    if (!data[type]) {
      (data as any)[type] = {};
    }
  }
  return data;
}

export async function saveArchitectState(
  projectPath: string,
  state: ArchitectState
): Promise<void> {
  const architectPath = await ensureArchitectWorkspace(projectPath);
  const statePath = path.join(architectPath, ARCHITECT_STATE_FILE);
  await FileSystemUtils.writeFile(
    statePath,
    JSON.stringify(state, null, 2) + '\n'
  );

  const retainedFiles = new Set<string>();
  for (const type of ARCHITECT_NODE_TYPES) {
    const entries = Object.entries(state[type]);
    for (const [id, data] of entries) {
      const xml = renderNodeXml(type, id, data);
      const filePath = getNodeFilePath(architectPath, id);
      await FileSystemUtils.writeFile(filePath, xml + '\n');
      retainedFiles.add(path.resolve(filePath));
    }
  }

  await cleanupStaleFiles(architectPath, retainedFiles);
}

export function renderNodeXml(
  type: ArchitectNodeType,
  id: string,
  data: ArchitectNodeData
): string {
  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<${type} id="${escapeAttr(id)}">`);

  const orderedKeys = ['version', 'title', 'businessDesc', 'techSummary'];
  const keys = Object.keys(data);

  const sortedKeys = [
    ...orderedKeys.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !orderedKeys.includes(k) && k !== 'version'),
  ];

  for (const key of sortedKeys) {
    if (data[key] === undefined) continue;
    lines.push(renderXmlElement(1, key, data[key]));
  }

  lines.push(`</${type}>`);
  return lines.join('\n');
}

function renderXmlElement(level: number, key: string, value: any): string {
  const indent = '  '.repeat(level);
  if (value === null || value === undefined) {
    return `${indent}<${key}/>`;
  }

  if (typeof value === 'string') {
    const content = wrapCdata(value);
    return `${indent}<${key}>${content}</${key}>`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${indent}<${key}>${value}</${key}>`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${indent}<${key}/>`;
    }
    const itemTag = guessArrayItemTag(key);
    const childLines = value
      .map((item) => renderXmlElement(level + 1, itemTag, item))
      .join('\n');
    return `${indent}<${key}>\n${childLines}\n${indent}</${key}>`;
  }

  // object
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return `${indent}<${key}/>`;
  }
  const childLines = entries
    .map(([childKey, childValue]) =>
      renderXmlElement(level + 1, childKey, childValue)
    )
    .join('\n');
  return `${indent}<${key}>\n${childLines}\n${indent}</${key}>`;
}

function wrapCdata(value: string): string {
  if (value.length === 0) {
    return '<![CDATA[]]>';
  }
  return `<![CDATA[${value}]]>`;
}

function guessArrayItemTag(key: string): string {
  if (key.endsWith('Ids')) {
    return key.slice(0, -3).replace(/s$/, '') || 'item';
  }
  if (key.endsWith('List')) {
    return 'item';
  }
  return 'item';
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, '&quot;');
}

export async function applyMutationsToState(
  state: ArchitectState,
  mutationsXml: string,
  options: ApplyMutationOptions = {}
): Promise<MutationApplication[]> {
  const partials = extractMutationPartials(mutationsXml);
  const applied: MutationApplication[] = [];

  for (const partial of partials) {
    const { type, id, mutationType, payload } = partial;
    if (!ARCHITECT_NODE_TYPES.includes(type)) {
      continue;
    }

    const bucket = state[type];
    const existing = bucket[id];
    const previousVersion = existing?.version;

    if (mutationType === 'Delete') {
      if (existing) {
        delete bucket[id];
        applied.push({
          type,
          id,
          mutationType,
          previousVersion,
        });
      }
      continue;
    }

    const nextVersion =
      mutationType === 'Update' && typeof previousVersion === 'number'
        ? previousVersion + 1
        : 1;

    const nextData: ArchitectNodeData = {
      ...(payload ?? {}),
      version: nextVersion,
    };
    bucket[id] = nextData;
    applied.push({
      type,
      id,
      mutationType,
      previousVersion,
      nextVersion,
    });
  }

  return applied;
}

interface ParsedMutation {
  type: ArchitectNodeType;
  id: string;
  mutationType: MutationType;
  payload?: ArchitectNodeData;
}

const MUTATION_PARTIAL_REGEX =
  /<MutationPartial>([\s\S]*?)<\/MutationPartial>/gi;

function extractMutationPartials(xml: string): ParsedMutation[] {
  const matches: ParsedMutation[] = [];
  let match: RegExpExecArray | null;

  while ((match = MUTATION_PARTIAL_REGEX.exec(xml)) !== null) {
    const body = match[1];
    const childMatch = body.match(
      /<([A-Za-z]+)\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/i
    );
    if (!childMatch) continue;

    const type = childMatch[1] as ArchitectNodeType;
    const attrString = childMatch[2];
    const rawContent = childMatch[3] || '';

    const attrs = parseAttributes(attrString);
    const mutationType = (attrs.mutationType ?? 'Create') as MutationType;
    const id = attrs.id;
    if (!id) continue;

    let payload: ArchitectNodeData | undefined;
    if (mutationType !== 'Delete') {
      const cdataMatch = rawContent.match(/<!\[CDATA\[([\s\S]*?)]]>/i);
      if (cdataMatch) {
        const jsObjectLiteral = cdataMatch[1].trim();
        payload = evaluateObjectLiteral(jsObjectLiteral);
      }
    }

    matches.push({
      type,
      id,
      mutationType,
      payload,
    });
  }

  return matches;
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([a-zA-Z_][\w-]*)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function evaluateObjectLiteral(content: string): ArchitectNodeData {
  try {
    const script = new vm.Script(`(${content})`);
    const result = script.runInNewContext({});
    if (result && typeof result === 'object') {
      return result as ArchitectNodeData;
    }
    throw new Error('表达式未返回对象');
  } catch (error: any) {
    throw new Error(
      `无法解析 MutationPartial 中的 JSON：${error.message}\n${content}`
    );
  }
}

export function getNodeFilePath(architectPath: string, id: string): string {
  const segments = id.split('/').filter(Boolean);
  const fileName = segments.pop() || id;
  const dirPath = path.join(architectPath, ...segments);
  return path.join(dirPath, fileName);
}

export async function removeNodeFile(
  projectPath: string,
  id: string
): Promise<void> {
  const architectPath = path.join(projectPath, ARCHITECT_DIR);
  const filePath = getNodeFilePath(architectPath, id);
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore missing file
  }
}

export function isArchitectWorkspaceInitial(state: ArchitectState): boolean {
  return ARCHITECT_NODE_TYPES.every((type) => {
    const bucket = state[type];
    return !bucket || Object.keys(bucket).length === 0;
  });
}

async function cleanupStaleFiles(
  architectPath: string,
  retainedFiles: Set<string>
): Promise<void> {
  const queue: string[] = [architectPath];
  while (queue.length > 0) {
    const current = queue.pop()!;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      if (abs.endsWith(ARCHITECT_STATE_FILE)) continue;
      if (abs.includes(`${path.sep}${ARCHITECT_PROMPT_DIR}${path.sep}`)) continue;
      if (abs.includes(`${path.sep}logs${path.sep}`)) continue;
      if (entry.isDirectory()) {
        queue.push(abs);
        continue;
      }
      if (!retainedFiles.has(path.resolve(abs))) {
        await fs.unlink(abs).catch(() => {});
      }
    }
  }
}

export function summariseState(state: ArchitectState): Record<string, any> {
  const summary: Record<string, any> = {};
  for (const type of ARCHITECT_NODE_TYPES) {
    const entries = Object.entries(state[type]);
    if (entries.length === 0) continue;
    summary[type] = entries.map(([id, data]) => {
      const pick: Record<string, any> = { id, version: data.version };
      if (data.title) pick.title = truncateText(data.title, 160);
      if (data.businessDesc) pick.businessDesc = truncateText(data.businessDesc, 240);
      if (data.techSummary) pick.techSummary = truncateText(data.techSummary, 240);
      if (data.dependency) pick.dependency = data.dependency;
      return pick;
    });
  }
  return summary;
}

function truncateText(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.slice(0, maxLength) + '…';
}
