## Why

Recommend（`pages/award/award`）目前只能填写被推荐人姓名，信息量不足，无法支撑后续跟进与撮合。需要将「推荐给平台」的流程升级为完整的求职者档案采集，并把数据统一写入 `JobSeeker`，与现有 Bmob 表结构对齐。

## What Changes

- 在推荐页表单中新增字段：**学历**（下拉单选）、**联系方式**、**求职意向**、**期待薪资范围**、**自我介绍**、**其他补充**。
- 页面加载或登录态可用时，**默认预填**：推荐人或被推荐侧的「姓名」「联系方式」（与当前登录用户信息一致——见设计中的字段语义澄清）。
- 用户点击「确定」后，将表单数据 **保存到 Bmob 表 `JobSeeker`**（与原有 `recoName`/用户关联逻辑兼容或按需扩展字段）。

## Capabilities

### New Capabilities

- `award-recommend`: 招聘小程序「推荐求职者」页的表单能力、默认值规则，以及写入 `JobSeeker` 的领域行为。

### Modified Capabilities

- （无）`openspec/specs/` 下仅有项目级 `context.md`，尚无按能力拆分的存量 spec。

## Impact

- **前端**：`pages/award/award` 的 `.js`/`.wxml`/`.wxss`，可能涉及 `award.json` 配置（下拉、表单布局）。
- **后端 / 数据**：Bmob **`JobSeeker`** 表需新增或可映射的字段（学历、联系方式、意向、薪资区间、自述、备注等）；需与控制台 Class 字段一致或通过代码动态写入（视 Bmob 配置而定）。
- **依赖**：继续使用 `wx.Bmob`/`Bmob.Query("JobSeeker")`；沿用登录后 `Storage`/`_User` 读取用户信息以预填。
