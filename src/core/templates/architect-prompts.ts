export interface ArchitectPromptTemplate {
  path: string;
  content: string;
}

const DSL_DEFINITION_PROMPT = String.raw`# 架构DSL结构定义

你是一个经验丰富的 Web 架构师，也是精通多种编程语言与数据格式的语言专家。请按照以下 DSL 规范维护技术设计文档，实现架构设计即代码的目标。

> 提醒：伪代码应保持抽象、简洁，突出关键业务流程；必要时使用注释说明步骤。

## DSL 顶层结构

\`\`\`typescript
export interface TechDesignSnapshotDsl {
  Module: { [key: string]: ModuleItem };
  ModuleRelationDiagram: { [key: string]: ModuleRelationDiagramItem };
  Entity: { [key: string]: EntityItem };
  EntityRelationDiagram: { [key: string]: EntityRelationDiagramItem };
  Enum: { [key: string]: EnumItem };
  HttpEndpoint: { [key: string]: ProcedureItem };
  PublicProcedure: { [key: string]: ProcedureItem };
  PrivateProcedure: { [key: string]: ProcedureItem };
  StateMachine: { [key: string]: StateMachineItem };
  BackendCache: { [key: string]: BackendCacheItem };
  ViewComponent: { [key: string]: ViewComponentItem };
  Page: { [key: string]: PageItem };
}
\`\`\`

- 所有节点 ID 必须唯一，并以文件系统路径形式命名，例如 \`Common.module/Entity/B.entity\`。
- 所有创建自定义结构的节点需归属于某个模块，公共资源归属于 \`Common.module\`。
- Mermaid / TypeScript / 伪代码等长文本字段请放入 \`<![CDATA[ ... ]]>\` 中，避免 XML 解析失败。

## 模块设计

\`\`\`typescript
export interface ModuleItem {
  version: number;
  title: string;
  businessDesc: string;
  techSummary: string;
  dependency: ModuleDependency;
}

export interface ModuleDependency {
  moduleIds: string[];
}
\`\`\`

## 模块关系图（Mermaid）

\`\`\`typescript
export interface ModuleRelationDiagramItem {
  version: number;
  title: string;
  mermaidDsl: string;
}
\`\`\`

## 枚举与实体

\`\`\`typescript
export interface EnumItem {
  version: number;
  title: string;
  businessDesc: string;
  typescript: string;
}

export interface EntityItem {
  version: number;
  title: string;
  businessDesc: string;
  typescript: string;
}
\`\`\`

> 如果实体之间存在关联，可使用注解（如 \`@OneToOne\`、\`@ManyToMany\`）说明。  
> 如需表达依赖关系，可扩展 \`EntityDependency\`，但默认不必填写。

## 实体关系图（E-R）

\`\`\`typescript
export interface EntityRelationDiagramItem {
  version: number;
  title: string;
  mermaidDsl: string;
}
\`\`\`

## 业务流程（接口 / 逻辑过程）

\`\`\`typescript
export interface ProcedureItem {
  version: number;
  title: string;
  businessDesc: string;
  techSummary: string;
  dependency: ProcedureDependency;
  typescript: string;
  ctrlFlowPseudocode: string;
  rulePseudocode: string;
  dataFlowPseudocode?: string;
}

export interface ProcedureDependency {
  procedureIds: string[];
}
\`\`\`

- \`ctrlFlowPseudocode\`：使用 JavaScript 函数体描述控制流。
- \`rulePseudocode\`：用于规则推导，可结合 \`switch\` / \`if-else\` 或逻辑编程语法。
- \`dataFlowPseudocode\`：用于强调重数据加工步骤，可选。

## 状态机

\`\`\`typescript
export interface StateMachineItem {
  version: number;
  title: string;
  pseudocode: string;
  mermaidDsl: string;
}
\`\`\`

## 缓存设计

\`\`\`typescript
export interface BackendCacheItem {
  version: number;
  title: string;
  techSummary: string;
  cacheKey: string;
  cacheValueTypescript: string;
}
\`\`\`

## 前端视图组件 & 页面

\`\`\`typescript
export interface ViewComponentItem {
  version: number;
  title: string;
  businessDesc: string;
  typescript: string;
  dependency: ViewComponentDependency;
}

export interface ViewComponentDependency {
  procedureIds: string[];
  viewComponentIds: string[];
}

export interface PageItem {
  version: number;
  title: string;
  businessDesc: string;
  dependency: PageDependency;
}

export interface PageDependency {
  viewComponentIds: string[];
}
\`\`\`

---

保持 \`version\` 字段递增，任何结构变更都需要在变更日志与最新快照同步更新。`;

const TECH_DESIGN_OUTPUT_SPEC = String.raw`# 架构 DSL 输出规范

当你需要修改架构 DSL，请严格遵守以下输出规范，确保工具链能够正确解析。

## 总体格式

输出顺序遵循：

1. 整体思考与设计思路（可多段落）
2. 若干个「文字说明 + MutationPartial 指令」的组合
3. 最后的整体总结

可用伪代码表示为：

\`\`\`
整体的思考和设计思路
foreach 变更组:
  - 先用文本说明该组变更的目的
  - 输出符合规范的 MutationPartial
整体总结
\`\`\`

## MutationPartial 结构

- 最外层标签固定为 \`<MutationPartial>\`。
- 内部包含 **且仅包含一种** 子 DSL 类型的变更节点。
- 子节点标签名由 DSL 字段名转为中横线单数形式，如：
  - \`Module\` → \`<Module>\`
  - \`ModuleRelationDiagram\` → \`<ModuleRelationDiagram>\`
- 每个子节点必须包含属性：
  - \`id\`：节点唯一标识（使用形如 \`ModuleName.module/Entity/Node.id\` 的格式）
  - \`mutationType\`：\`Create\` | \`Update\` | \`Delete\`
- \`Create/Update\` 必须携带 \`<![CDATA[ ... ]]>\` 包裹的 JSON；\`Delete\` 可省略 body。

### JSON 内容规范

1. 必须是可直接执行的 JavaScript 对象字面量，无省略号或函数调用。
2. 多行字符串只能使用 \`\` \`反引号\`\` 包裹；不要使用未转义的 \`'\` 或 \`\"\`。
3. 无需手动填写 \`version\` 字段，系统会自动维护。
4. 任何 \`title\` 字段必须非空。

### 多重变更

- 同一个节点若出现多次变更条目，以最后一次为准。
- 多种 DSL 类别的变更请拆分为多个 \`<MutationPartial>\`。
- 同一 \`<MutationPartial>\` 内不得重复出现多个相同类别节点。

## 输出示例

模块创建：

\`\`\`xml
<MutationPartial>
  <Module mutationType="Create" id="Approval.module">
  <![CDATA[
    {
      "title": "审批模块",
      "businessDesc": "负责审批流程相关业务能力。",
      "techSummary": "管理审批单、任务分发与状态流转。",
      "dependency": {
        "moduleIds": [
          "Common.module"
        ]
      }
    }
  ]]>
  </Module>
</MutationPartial>
\`\`\`

枚举删除：

\`\`\`xml
<MutationPartial>
  <Enum mutationType="Delete" id="Common.module/LegacyStatus.enum" />
</MutationPartial>
\`\`\`

HTTP 接口更新：

\`\`\`xml
<MutationPartial>
  <HttpEndpoint mutationType="Update" id="Approval.module/Submit.endpoint.proc">
  <![CDATA[
    {
      "title": "提交审批申请",
      "businessDesc": "用户提交审批单并触发流程启动。",
      "techSummary": "校验输入、写入数据库、触发流程引擎。",
      "dependency": {
        "procedureIds": [
          "Common.module/Notify.public.proc"
        ]
      },
      "typescript": \`interface SubmitRequest { ... }\`,
      "ctrlFlowPseudocode": \`function submitApproval(request) { /* ... */ }\`,
      "rulePseudocode": \`// 规则说明\`,
      "dataFlowPseudocode": \`// 可选的数据流说明\`
    }
  ]]>
  </HttpEndpoint>
</MutationPartial>
\`\`\`

> 注意：每个 \`<MutationPartial>\` 内只能出现一个 DSL 类别。例如模块 + 过程混合属于无效输出。`;

const BACKEND_SAMPLE_PROMPT = String.raw`# 架构 DSL 后端示例（业务与逻辑层）

以下示例展示如何拆解后端模块、实体、逻辑过程以及模块关系图。可根据业务实际调整。

## 模块拆解示例

\`\`\`xml
<MutationPartial>
  <Module mutationType="Create" id="Common.module">
  <![CDATA[
    {
      "title": "公共模块",
      "businessDesc": "存放公共枚举、实体、工具逻辑等可共享资源。",
      "techSummary": "封装跨域复用能力，避免业务模块重复实现。",
      "dependency": {
        "moduleIds": []
      }
    }
  ]]>
  </Module>
</MutationPartial>

<MutationPartial>
  <Module mutationType="Create" id="ApprovalProcess.module">
  <![CDATA[
    {
      "title": "审批流程模块",
      "businessDesc": "负责审批流程发起、推进、拒绝等核心业务动作。",
      "techSummary": "整合流程引擎、任务分配与状态跟踪逻辑。",
      "dependency": {
        "moduleIds": [
          "Common.module"
        ]
      }
    }
  ]]>
  </Module>
</MutationPartial>
\`\`\`

## 枚举与实体示例

\`\`\`xml
<MutationPartial>
  <Enum mutationType="Create" id="Common.module/TaskStatus.enum">
  <![CDATA[
    {
      "title": "任务状态枚举",
      "businessDesc": "标识任务生命周期的关键状态。",
      "typescript": \`export enum TaskStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected'
}\`
    }
  ]]>
  </Enum>
</MutationPartial>

<MutationPartial>
  <Entity mutationType="Create" id="ApprovalProcess.module/Process.entity">
  <![CDATA[
    {
      "title": "审批流程实例",
      "businessDesc": "承载单次审批流程的核心数据。",
      "typescript": \`class ApprovalProcess {
  id: string;
  title: string;
  status: TaskStatus;
  @OneToMany({ relationKey: 'Process__to__Step' })
  steps: ApprovalStep[];
}\`
    }
  ]]>
  </Entity>
</MutationPartial>
\`\`\`

## HTTP 接口示例

\`\`\`xml
<MutationPartial>
  <HttpEndpoint mutationType="Create" id="ApprovalProcess.module/Start.endpoint.proc">
  <![CDATA[
    {
      "title": "发起审批流程",
      "businessDesc": "接收审批请求并启动流程，创建初始任务。",
      "techSummary": "1. 参数校验；2. 创建流程数据；3. 通知首个审批人。",
      "dependency": {
        "procedureIds": []
      },
      "typescript": \`interface StartApprovalRequest {
  applicantId: string;
  formData: Record<string, any>;
}\`,
      "ctrlFlowPseudocode": \`function startApproval(request) {
  validateRequest(request);
  const process = createApprovalProcess(request);
  notifyFirstApprover(process);
  return process.id;
}\`,
      "rulePseudocode": \`// 根据表单字段决定审批链路\`
    }
  ]]>
  </HttpEndpoint>
</MutationPartial>
\`\`\`

## 模块关系图示例

\`\`\`xml
<MutationPartial>
  <ModuleRelationDiagram mutationType="Create" id="ModuleRelation-ApprovalOverview.diagram">
  <![CDATA[
    {
      "title": "审批流程模块关系图",
      "mermaidDsl": \`flowchart TD
  Common[公共模块]
  Approval[审批流程模块]
  Notification[通知模块]

  Approval --> Common
  Approval --> Notification\`
    }
  ]]>
  </ModuleRelationDiagram>
</MutationPartial>
\`\`\`

使用以上示例可以快速创建设计稿，但仍需结合实际业务进行精炼、命名与描述。`;

const FRONTEND_SAMPLE_PROMPT = String.raw`# 架构 DSL 前端示例（视图与页面）

以下示例展示如何为前端视图组件与页面生成 DSL 变更。请遵循 ID 命名约定：

- 可复用业务组件以 \`.view\` 结尾。
- 页面以 \`.page\` 结尾。
- 深度最多两层业务组件，避免拆分基础 UI 组件。

## 视图组件示例

\`\`\`xml
<MutationPartial>
  <ViewComponent mutationType="Create" id="TicketBooking.view">
  <![CDATA[
    {
      "title": "差旅订票组件",
      "businessDesc": "在审批通过后，指导用户完成差旅订票流程。",
      "typescript": \`interface IProps {
  applicantName: string;
  travelPlan: TravelPlan;
}

interface IExposes {
  validateForm: () => boolean;
  reset: () => void;
}

interface IEmits {
  (event: 'submit', payload: BookingResult): void;
  (event: 'cancel'): void;
}\`,
      "dependency": {
        "procedureIds": [
          "ApprovalProcess.module/PrepareTrip.public.proc"
        ],
        "viewComponentIds": []
      }
    }
  ]]>
  </ViewComponent>
</MutationPartial>
\`\`\`

## 页面示例

\`\`\`xml
<MutationPartial>
  <Page mutationType="Create" id="TravelBooking.page">
  <![CDATA[
    {
      "title": "差旅审批后的订票页面",
      "businessDesc": "承接审批流程，将订票、行程确认与费用提示集中展示。",
      "dependency": {
        "viewComponentIds": [
          "TicketBooking.view",
          "ProcessStatusTree.view"
        ]
      }
    }
  ]]>
  </Page>
</MutationPartial>
\`\`\`

## 组件拆解说明

1. **组件职责**：描述组件的业务目标、交互入口与输出结果。
2. **TypeScript 定义**：包括 props/expose/emits，帮助实现者快速了解接口契约。
3. **依赖声明**：通过 \`dependency.viewComponentIds\` 表达组件组合关系；页面依赖组件 ID。

保持组件层级精简，聚焦业务语义而非通用 UI。`;

export const ARCHITECT_PROMPT_TEMPLATES: ArchitectPromptTemplate[] = [
  {
    path: 'architect/prompts/DSL结构定义.md',
    content: DSL_DEFINITION_PROMPT
  },
  {
    path: 'architect/prompts/DSL输出规范.md',
    content: TECH_DESIGN_OUTPUT_SPEC
  },
  {
    path: 'architect/prompts/后端设计示例.md',
    content: BACKEND_SAMPLE_PROMPT
  },
  {
    path: 'architect/prompts/前端设计示例.md',
    content: FRONTEND_SAMPLE_PROMPT
  }
];
