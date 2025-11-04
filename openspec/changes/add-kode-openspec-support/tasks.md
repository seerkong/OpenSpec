## 1. Kode CLI 内建指令
- [x] 1.1 添加 `/openspec:proposal`、`/openspec:apply`、`/openspec:archive`、`/openspec:validate` 命令定义，复用 OpenSpec 提供的守护原则与步骤文案
- [x] 1.2 扩展统一补全系统，确保 Tab 时能建议上述命令并正确填充参数占位
- [x] 1.3 为 `/openspec:validate` 实现本地 CLI 调用与 stdout/stderr 呈现，并处理缺失或失败退出码

## 2. OpenSpec 工具链更新
- [x] 2.1 在 `openspec init`/`update` 输出中加入 Kode 作为受支持工具，说明 slash 命令入口及配置
- [x] 2.2 更新 `openspec/AGENTS.md` 或关联模板，提示代理如何在 Kode 内触发 Openspec 工作流

## 3. 质量保障
- [x] 3.1 针对新命令添加最小化单元/集成测试（Bun + Vitest），覆盖成功与错误路径
- [x] 3.2 更新两个仓库的 README/文档，说明 Kode 与 OpenSpec 集成步骤
- [ ] 3.3 运行 `bun test` 与 `pnpm test`，确保现有用例通过（受沙箱限制无法安装依赖，命令执行失败）
