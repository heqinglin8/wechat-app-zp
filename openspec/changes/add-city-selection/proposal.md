## Why

当前小程序面向多城市招聘与求职业务，但缺少全局城市选择、城市缓存和按城市隔离内容的能力。新增城市能力后，用户可以明确当前业务城市，发布、留言和浏览结果也能保持在同一城市范围内。

## What Changes

- 在小程序首页左上角展示当前选中城市，默认城市为 `广东省 / 广州市 / 天河区`，展示文本为 `广州`，超过 4 个中文时省略。
- 使用微信小程序 `picker mode="region"` 选择省、市、区/县，并读取省码、市码、区码。
- 仅开放 `广州`、`佛山`、`韶关`、`深圳`、`东莞`、`珠海`；选择未开放城市确认后提示“暂时还没有开放当前城市业务”，不切换、不缓存。
- 将选中城市缓存到本地，下次进入小程序继续有效。
- 发布岗位 `JobInfo` 时默认带上当前省市区和省市区码，发布页展示城市信息但不允许修改，并提示只能发布本城市的信息。
- 发布求职 `JobSeeker` 时默认带上当前省市区和省市区码，发布页展示城市信息但不允许修改，并提示只能发布本城市的信息。
- 发送留言时默认带上当前省市区和省市区码；留言表写入 `displayCityName`，留言列表直接使用 `displayCityName` 展示城市名。
- 首页、今日招聘、今日求职按当前 `cityCode` 过滤数据。
- 搜索结果按当前城市和原关键词共同过滤，即 `cityCode == 当前城市 cityCode` 且 (`title` 模糊匹配搜索关键词 OR `jobDescription` 模糊匹配搜索关键词 OR `companyName` 模糊匹配搜索关键词)。
- 生成实现后需要提醒如何在 Bmob 控制台新增表字段、如何手动补历史数据默认城市字段；不实现迁移脚本或运行时补数据逻辑。

## Capabilities

### New Capabilities

- `city-selection`: 覆盖全局城市选择、开放城市校验、本地缓存、发布岗位城市写入、留言城市写入，以及职位/求职列表和搜索结果的城市过滤。

### Modified Capabilities

- `award-recommend`: 发布求职 `JobSeeker` 时必须写入当前城市信息，并在推荐/求职发布页展示只读城市提示。

## Impact

- 页面：`pages/index/index`、`pages/today/today`、`pages/todayjobseek/todayjobseek`、`pages/searchresult/searchresult`、`pages/publishjob/publishjob`、`pages/pubilshJobSeek/pubilshJobSeek`。
- 留言：`utils/messageBoard.js` 和 `components/message-board` 的发布与展示逻辑。
- 全局状态：`app.js` / `app.globalData`，以及本地缓存键。
- 数据模型：Bmob `JobInfo`、`JobSeeker` 需要新增省市区名称和编码字段；`MessageBoardMessage` 需要新增省市区名称、编码和 `displayCityName` 字段。
- 数据库更新提醒：历史 `JobInfo` / `JobSeeker` 若缺少城市字段，按城市过滤后将不可见，需要在 Bmob 控制台手动补默认 `广东省 / 广州市 / 天河区` 字段。
