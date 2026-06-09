## Context

`pages/seekerDetail/seekerDetail` 目前直接渲染 `content` 原始字段，页面层级与 `pages/jobDetail/jobDetail` 不一致，且缺少统一兜底文本规则，导致字段为空时出现空白或语义不清。现有 `JobSeeker` 数据已经覆盖本次详情页核心展示需求（标题、意向、学历、联系方式、薪资、摘要、自我介绍、城市、收藏数、图片等），不需要新增后端依赖。

约束与边界：
- 页面需要尽量复用 `jobDetail` 的视觉结构与样式组织方式。
- 仅使用 `JobSeeker` 现有字段，不引入公司域展示。
- 去除 `recoExtra` 相关展示。
- 字段缺失时统一文案为 `xxx未填写`。

## Goals / Non-Goals

**Goals:**
- 将 `seekerDetail` 改造成与 `jobDetail` 一致的信息层级（头图、顶部主信息、分组详情、留言板）。
- 引入 `viewData` 显示映射层，统一处理格式化与兜底逻辑。
- 保持现有互动能力（收藏、留言板、底部操作）不变。

**Non-Goals:**
- 不修改 `JobSeeker` 表结构。
- 不新增公司信息展示区块。
- 不调整消息板组件协议或收藏业务流程。

## Decisions

### Decision 1: 为 `seekerDetail` 增加独立 `viewData` 构建层
- **Choice**: 在 `seekerDetail.js` 中新增与 `jobDetail` 类似的构建函数（如 `buildViewData`），将 `content` 原始字段映射为 UI 专用字段。
- **Why**: 将“取值优先级 + 格式化 + 未填写兜底”集中处理，避免 WXML 复杂条件表达式。
- **Alternative considered**: 在 WXML 中直接写 `||` 和三元表达式；被拒绝，因为可读性差且复用困难。

### Decision 2: 采用“字段中文名 + 未填写”的统一兜底规则
- **Choice**: 为每个展示位定义中文语义键，例如 `学历未填写`、`微信未填写`、`求职方向未填写`。
- **Why**: 与需求一致，且可直接作为验收标准。
- **Alternative considered**: 使用统一 `未填写`；被拒绝，因为用户不清楚缺失的是哪一项。

### Decision 3: 工种与薪资显示遵循 `payType` 优先
- **Choice**: `payType=0` 显示“月结”并按月薪格式渲染；`payType=1` 显示“临时工”并按小时薪资渲染；未知值回退“工种未填写/期望薪资未填写”。
- **Why**: 与现有业务字段保持一致，兼容历史数据不完整场景。
- **Alternative considered**: 仅按 `detPayMin/detPayMax` 显示，不区分工种；被拒绝，因为会丢失语义。

### Decision 4: 去除“其他(recoExtra)”和公司域区块
- **Choice**: 页面不渲染 `recoExtra`，不新增公司卡片或公司字段映射。
- **Why**: 与探索结论一致，保证信息密度和数据真实性。
- **Alternative considered**: 保留空壳区块并显示“公司名未填写”；被拒绝，因为语义噪声高。

## Risks / Trade-offs

- **[风险] 旧数据字段命名不一致导致部分内容不显示** → **缓解**：在映射层定义清晰优先级并提供统一兜底。
- **[风险] 样式迁移影响底部导航与留言板间距** → **缓解**：保留现有底部导航高度基线，按 `jobDetail` 分区逐段替换并视觉回归。
- **[权衡] 增加一层 `viewData` 代码量** → **收益**：显著降低 WXML 复杂度并提升后续维护性。

## Migration Plan

1. 在 `seekerDetail.js` 新增显示映射函数与字段格式化逻辑（不改收藏/留言板流程）。
2. 重构 `seekerDetail.wxml` 为 `jobDetail` 风格分区，并改为绑定 `viewData`。
3. 调整 `seekerDetail.wxss` 以匹配新的分区样式与间距。
4. 手工验证：完整数据、部分缺失数据、历史数据三类样本的兜底文案。
5. 回滚策略：若样式或字段映射异常，可回滚 `seekerDetail` 三文件到本次变更前版本，不影响后端数据。

## Open Questions

- `payType=1` 的薪资展示是否固定使用 `detPayMax`（当前实现倾向如此），还是需要同时显示区间？
- 联系方式区块是否需要将电话与微信拆分为两行固定标签展示（推荐拆分，便于兜底一致性）？
