import fs from 'fs/promises';
import path from 'path';
import type { Ora } from 'ora';
import { FileSystemUtils } from '../../utils/file-system.js';
import {
  ARCHITECT_DIR,
  ARCHITECT_PROMPT_DIR,
  DEFAULT_OPENAI_MODEL,
} from './constants.js';
import {
  ArchitectState,
  applyMutationsToState,
  loadArchitectState,
  saveArchitectState,
  summariseState,
} from './state.js';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface ArchitectCommandOptions {
  projectPath: string;
  dryRun?: boolean;
  changeId?: string;
  spinner?: Ora;
}

export interface ArchitectCommandResult {
  applied: number;
  rawResponse: string;
  mutationLogPath?: string;
}

interface GenerateContextBase {
  projectPath: string;
  state: ArchitectState;
}

interface InitArchitectContext extends GenerateContextBase {
  requirementContent: string;
}

interface RefineArchitectContext extends GenerateContextBase {
  userPrompt: string;
}

interface SyncArchitectContext extends GenerateContextBase {
  summary: string;
  userPrompt?: string;
  macroOnly?: boolean;
}

export async function runInitArchitect(
  ctx: InitArchitectContext,
  options: ArchitectCommandOptions
): Promise<ArchitectCommandResult> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: await loadPrompt(ctx.projectPath, 'DSL结构定义.md'),
    },
    {
      role: 'system',
      content: await loadPrompt(ctx.projectPath, 'DSL输出规范.md'),
    },
    {
      role: 'system',
      content: await loadPrompt(ctx.projectPath, 'DSL设计示例.md'),
    },
    {
      role: 'user',
      content: `需求文档如下（请基于此拆分宏观模块，输出 Module 及 ModuleRelationDiagram 的创建指令，不要生成其他 DSL 类别）：\n\n${ctx.requirementContent}`,
    },
  ];

  const rawResponse = await callArchitectModel(messages, options.spinner);
  const applied = await applyAndPersistMutations(
    ctx.projectPath,
    ctx.state,
    rawResponse,
    options
  );
  const mutationLogPath = options.dryRun
    ? undefined
    : await logMutations(
        ctx.projectPath,
        rawResponse,
        options.changeId,
        'init'
      );
  return {
    applied,
    rawResponse,
    mutationLogPath,
  };
}

export async function runRefineArchitect(
  ctx: RefineArchitectContext,
  options: ArchitectCommandOptions
): Promise<ArchitectCommandResult> {
  const stateSummary = JSON.stringify(summariseState(ctx.state), null, 2);
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: await loadPrompt(ctx.projectPath, 'DSL结构定义.md'),
    },
    {
      role: 'system',
      content: await loadPrompt(ctx.projectPath, 'DSL输出规范.md'),
    },
    {
      role: 'system',
      content: await loadPrompt(ctx.projectPath, 'DSL设计示例.md'),
    },
    {
      role: 'user',
      content: `当前 DSL 状态（供参考，不要重复返回已存在的节点）：\n${stateSummary}`,
    },
    {
      role: 'user',
      content: `请基于以上状态，针对以下需求进行架构补充或调整。输出尽量精简，只返回必要的 MutationPartial。\n\n${ctx.userPrompt}`,
    },
  ];

  const rawResponse = await callArchitectModel(messages, options.spinner);
  const applied = await applyAndPersistMutations(
    ctx.projectPath,
    ctx.state,
    rawResponse,
    options
  );
  const mutationLogPath = options.dryRun
    ? undefined
    : await logMutations(
        ctx.projectPath,
        rawResponse,
        options.changeId,
        'refine'
      );
  return {
    applied,
    rawResponse,
    mutationLogPath,
  };
}

export async function runSyncCodeToArchitect(
  ctx: SyncArchitectContext,
  options: ArchitectCommandOptions
): Promise<ArchitectCommandResult> {
  const stateSummary = JSON.stringify(summariseState(ctx.state), null, 2);
  const instructions = [
    '请根据以下代码扫描摘要，识别或补充宏观架构要素。',
    ctx.macroOnly
      ? '这是第一次同步，请优先拆分模块并建立关键关系，无需深入细节。'
      : '这是增量同步，可针对指定模块或细节局部更新。',
    ctx.userPrompt ? `额外需求提示：${ctx.userPrompt}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: await loadPrompt(ctx.projectPath, 'DSL结构定义.md'),
    },
    {
      role: 'system',
      content: await loadPrompt(ctx.projectPath, 'DSL输出规范.md'),
    },
    {
      role: 'system',
      content:
        (await maybeLoadPrompt(ctx.projectPath, 'DSL设计示例.md')) ?? '',
    },
    {
      role: 'user',
      content: `当前 DSL 状态（供参考）：\n${stateSummary}`,
    },
    {
      role: 'user',
      content: `代码摘要：\n${ctx.summary}`,
    },
    {
      role: 'user',
      content: instructions,
    },
  ].filter((msg) => msg.content.trim().length > 0) as ChatMessage[];

  const rawResponse = await callArchitectModel(messages, options.spinner);
  const applied = await applyAndPersistMutations(
    ctx.projectPath,
    ctx.state,
    rawResponse,
    options
  );
  const mutationLogPath = options.dryRun
    ? undefined
    : await logMutations(
        ctx.projectPath,
        rawResponse,
        options.changeId,
        'sync'
      );
  return {
    applied,
    rawResponse,
    mutationLogPath,
  };
}

async function applyAndPersistMutations(
  projectPath: string,
  state: ArchitectState,
  rawResponse: string,
  options: ArchitectCommandOptions
): Promise<number> {
  const targetState = options.dryRun ? structuredClone(state) : state;
  const applications = await applyMutationsToState(targetState, rawResponse, {
    dryRun: options.dryRun,
  });

  if (!options.dryRun) {
    for (const key of Object.keys(targetState) as (keyof ArchitectState)[]) {
      state[key] = targetState[key];
    }
    await saveArchitectState(projectPath, state);
  }

  return applications.length;
}

async function logMutations(
  projectPath: string,
  rawResponse: string,
  changeId: string | undefined,
  prefix: 'init' | 'refine' | 'sync'
): Promise<string | undefined> {
  if (!rawResponse.trim()) return undefined;

  const dir =
    changeId && changeId.trim().length > 0
      ? path.join(
          projectPath,
          'openspec',
          'changes',
          changeId.trim(),
          'architect'
        )
      : path.join(projectPath, ARCHITECT_DIR, 'logs');

  await FileSystemUtils.createDirectory(dir);
  const fileName = `${prefix}-${Date.now()}.xml`;
  const filePath = path.join(dir, fileName);
  await FileSystemUtils.writeFile(filePath, rawResponse.trim() + '\n');
  return path.relative(projectPath, filePath);
}

async function loadPrompt(
  projectPath: string,
  fileName: string
): Promise<string> {
  const prompt = await maybeLoadPrompt(projectPath, fileName);
  if (!prompt) {
    throw new Error(
      `缺少架构提示词：openspec/architect/prompts/${fileName}。请运行 "openspec update" 以恢复文件。`
    );
  }
  return prompt;
}

async function maybeLoadPrompt(
  projectPath: string,
  fileName: string
): Promise<string | undefined> {
  const promptPath = path.join(
    projectPath,
    ARCHITECT_DIR,
    ARCHITECT_PROMPT_DIR,
    fileName
  );
  try {
    const content = await fs.readFile(promptPath, 'utf-8');
    return content.trim();
  } catch {
    return undefined;
  }
}

async function callArchitectModel(
  messages: ChatMessage[],
  spinner?: Ora
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

  if (!apiKey) {
    throw new Error(
      '未检测到 OPENAI_API_KEY 环境变量，无法调用大模型生成架构设计。'
    );
  }

  const body = {
    model,
    temperature: 0.2,
    messages,
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `调用模型失败（HTTP ${response.status}）：${text.slice(0, 400)}`
    );
  }

  const payload = (await response.json()) as any;
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('模型未返回有效内容。');
  }

  return content.trim();
}
