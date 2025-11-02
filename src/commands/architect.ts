import { program } from 'commander';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { ensureArchitectWorkspace, loadArchitectState, isArchitectWorkspaceInitial } from '../core/architect/state.js';
import {
  runInitArchitect,
  runRefineArchitect,
  runSyncCodeToArchitect,
} from '../core/architect/ai.js';
import { buildCodeSummary } from '../core/architect/summary.js';

function resolveProjectPath(targetPath: string | undefined): string {
  return path.resolve(targetPath ?? '.');
}

program
  .command('init-architect <docPath>')
  .description(
    '根据需求文档初始化架构模块拆分，生成 MutationPartial 并写入 openspec/architect/。'
  )
  .option('--change <id>', '记录架构变更到指定的 proposal (openspec/changes/<id>/architect/)')
  .option('--dry-run', '仅输出 AI 响应，不写入本地文件')
  .option('--project <path>', '项目根目录，默认当前目录')
  .action(async (docPath: string, options: { change?: string; dryRun?: boolean; project?: string }) => {
    const spinner = ora('准备架构初始化...').start();
    try {
      const projectPath = resolveProjectPath(options.project);
      await ensureArchitectWorkspace(projectPath);
      const state = await loadArchitectState(projectPath);

      const resolvedDocPath = path.resolve(docPath);
      const requirementContent = await fs.readFile(resolvedDocPath, 'utf-8');

      spinner.text = '调用大模型生成模块拆分...';
      const result = await runInitArchitect(
        {
          projectPath,
          requirementContent,
          state,
        },
        {
          projectPath,
          dryRun: options.dryRun,
          changeId: options.change,
          spinner,
        }
      );

      spinner.stop();
      console.log(result.rawResponse);
      console.log();
      console.log(`应用变更 ${result.applied} 项。`);
      if (result.mutationLogPath) {
        console.log(`变更记录：${result.mutationLogPath}`);
      }
      if (options.dryRun) {
        console.log('（dry-run 模式：未写入本地文件）');
      }
    } catch (error: any) {
      spinner.stop();
      console.error(`init-architect 执行失败：${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('refine-architect')
  .description(
    '基于当前架构 DSL 状态和用户提示，补充或优化架构设计。'
  )
  .option('-p, --prompt <text>', '要执行的架构调整说明')
  .option('--change <id>', '记录架构变更到指定的 proposal')
  .option('--dry-run', '仅输出 AI 响应，不写入本地文件')
  .option('--project <path>', '项目根目录，默认当前目录')
  .action(async (options: { prompt?: string; change?: string; dryRun?: boolean; project?: string }) => {
    const spinner = ora('准备架构细化...').start();
    try {
      const projectPath = resolveProjectPath(options.project);
      await ensureArchitectWorkspace(projectPath);
      const state = await loadArchitectState(projectPath);

      const userPrompt = options.prompt?.trim();
      if (!userPrompt) {
        throw new Error('请通过 --prompt 提供要执行的架构调整说明。');
      }

      spinner.text = '调用大模型执行细化...';
      const result = await runRefineArchitect(
        {
          projectPath,
          state,
          userPrompt,
        },
        {
          projectPath,
          dryRun: options.dryRun,
          changeId: options.change,
          spinner,
        }
      );

      spinner.stop();
      console.log(result.rawResponse);
      console.log();
      console.log(`应用变更 ${result.applied} 项。`);
      if (result.mutationLogPath) {
        console.log(`变更记录：${result.mutationLogPath}`);
      }
      if (options.dryRun) {
        console.log('（dry-run 模式：未写入本地文件）');
      }
    } catch (error: any) {
      spinner.stop();
      console.error(`refine-architect 执行失败：${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('sync-code-to-architect')
  .description(
    '扫描代码目录提取摘要，增量同步架构 DSL（首次运行仅生成宏观模块，后续可通过 --prompt 指定细节）。'
  )
  .option('--path <path...>', '需要分析的代码目录（可多次传入），默认尝试 src、app、api')
  .option('--prompt <text>', '补充说明或关注点，用于指导增量更新')
  .option('--change <id>', '记录架构变更到指定的 proposal')
  .option('--dry-run', '仅输出 AI 响应，不写入本地文件')
  .option('--project <path>', '项目根目录，默认当前目录')
  .action(async (options: { path?: string[]; prompt?: string; change?: string; dryRun?: boolean; project?: string }) => {
    const spinner = ora('扫描代码目录...').start();
    try {
      const projectPath = resolveProjectPath(options.project);
      await ensureArchitectWorkspace(projectPath);
      const state = await loadArchitectState(projectPath);

      const summary = await buildCodeSummary({
        projectPath,
        includePaths: options.path,
      });

      spinner.text = '调用大模型生成架构同步...';
      const result = await runSyncCodeToArchitect(
        {
          projectPath,
          state,
          summary,
          userPrompt: options.prompt,
          macroOnly: isArchitectWorkspaceInitial(state),
        },
        {
          projectPath,
          dryRun: options.dryRun,
          changeId: options.change,
          spinner,
        }
      );

      spinner.stop();
      console.log(result.rawResponse);
      console.log();
      console.log(`应用变更 ${result.applied} 项。`);
      if (result.mutationLogPath) {
        console.log(`变更记录：${result.mutationLogPath}`);
      }
      if (options.dryRun) {
        console.log('（dry-run 模式：未写入本地文件）');
      }
    } catch (error: any) {
      spinner.stop();
      console.error(`sync-code-to-architect 执行失败：${error.message}`);
      process.exitCode = 1;
    }
  });
