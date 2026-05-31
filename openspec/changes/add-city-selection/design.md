## Context

当前项目是微信原生小程序，页面直接通过 `wx.Bmob` 查询和写入 Bmob 数据。职位列表分布在 `pages/index/index`、`pages/today/today`，求职列表分布在 `pages/todayjobseek/todayjobseek`，搜索结果在 `pages/searchresult/searchresult`，发布岗位和发布求职分别写入 `JobInfo`、`JobSeeker`。留言发布逻辑集中在 `utils/messageBoard.js`。

本变更需要把“当前城市”变成跨页面共享状态：城市相关页面左上角展示、微信城市选择、发布默认带城市、留言默认带城市，以及列表和搜索统一按当前城市过滤。默认城市为 `广东省 / 广州市 / 天河区`，左上角展示 `广州`。

## Goals / Non-Goals

**Goals:**

- 提供一个全局可复用的当前城市模型，并在小程序左上角展示当前城市名。
- 使用微信 `picker mode="region"` 获取省、市、区/县名称和编码。
- 仅允许切换到已开放城市：`广州`、`佛山`、`韶关`、`深圳`、`东莞`、`珠海`。
- 将当前城市缓存到本地，并在下次进入小程序时继续有效。
- 发布 `JobInfo`、`JobSeeker`、`MessageBoardMessage` 时写入省市区名称和编码。
- 首页、今日招聘、今日求职、搜索结果按当前城市过滤。
- 给实现完成后的表字段修改和历史数据补齐提供明确说明。

**Non-Goals:**

- 不建设城市运营后台或动态开放城市配置。
- 不支持跨城市混合展示。
- 不按区/县过滤列表；区/县只用于发布和留言记录的精确定位。
- 不改变现有职位、求职 tab 的排序规则，只在现有查询条件上追加城市条件。
- 搜索结果仅覆盖岗位标题 `title` 和岗位描述 `jobDescription` 的关键词模糊匹配，不扩展到地址、公司、薪资等其他字段。

## Decisions

### 使用共享城市工具作为单一入口

新增共享城市工具，例如 `utils/city.js`，负责：

- 默认城市常量。
- 开放城市常量。
- 本地缓存 key。
- 从缓存读取当前城市。
- 从微信 region picker 的 `value` 和 `code` 归一化城市对象。
- 校验城市是否开放。
- 输出 Bmob 写入字段和查询条件。

这样可以避免在首页、今日招聘、今日求职、搜索、发布页、留言模块中重复维护字段名和默认值。

备选方案是在每个页面各自读取 `wx.getStorageSync` 并拼接字段。这样初期改动少，但容易出现页面间字段不一致，例如有的页面用 `cityName`，有的页面用 `cityDisplayName`，导致查询和写入不稳定。

### 城市对象存储完整省市区，但过滤使用 `cityCode`

当前城市对象使用以下结构：

```js
{
  provinceName: '广东省',
  cityName: '广州市',
  districtName: '天河区',
  provinceCode: '440000',
  cityCode: '440100',
  districtCode: '440106',
  cityDisplayName: '广州'
}
```

写入 Bmob 时保存完整名称和编码。列表过滤和搜索过滤使用 `cityCode`，展示使用 `cityDisplayName` 或去掉“市”的 `cityName`。使用编码过滤可以避免“广州”和“广州市”等展示格式差异影响查询。

备选方案是直接用 `cityName` 过滤。这样更直观，但会受到名称格式和历史数据填法影响，后续维护成本更高。

### 左上角使用微信 region picker，不新建城市列表页

参与城市过滤的主要页面左上角挂载同一个城市选择入口，包括首页、今日招聘、今日求职和搜索结果页。左上角控件通过 `picker mode="region"` 打开微信省市区选择器。确认后读取：

- `e.detail.value[0..2]` 作为省、市、区/县名称。
- `e.detail.code[0..2]` 作为省码、市码、区码。

确认城市后，先校验城市是否开放。未开放时只展示 toast“暂时还没有开放当前城市业务”，不更新页面状态、不写本地缓存。

备选方案是自建城市选择页或使用 Bmob 城市表。当前需求明确“使用微信的选择城市组件”，因此不引入额外页面或数据表。

### 在 `app.globalData` 和本地缓存中同步当前城市

启动时从本地缓存读取当前城市，缺失或非法时使用默认广州天河。切换成功后同时更新：

- `app.globalData.currentCity`
- `wx.setStorageSync(<cityKey>, currentCity)`

页面在 `onLoad` / `onShow` 时读取当前城市，并在城市变化后刷新对应列表。对于 tab 页面，切回页面时应重新读取当前城市，避免城市在首页切换后今日招聘仍使用旧城市。

### 查询在现有条件上追加城市过滤

职位列表：

```text
JobInfo.cityCode == currentCity.cityCode
```

求职列表：

```text
JobSeeker.cityCode == currentCity.cityCode
```

搜索结果：

```text
JobInfo.cityCode == currentCity.cityCode
AND (
  JobInfo.title contains searchValue
  OR JobInfo.jobDescription contains searchValue
)
```

现有排序、分页、tab 条件继续保留。首页、今日招聘和今日求职只追加城市条件；搜索结果同时追加城市条件和关键词模糊匹配条件。最后一页剩余数据查询也必须追加同样城市条件，避免分页尾页把其他城市数据混入。

### 发布页展示只读城市

`pages/publishjob/publishjob` 和 `pages/pubilshJobSeek/pubilshJobSeek` 在表单区域展示当前城市，例如：

```text
发布城市  广东省 广州市 天河区
只能发布本城市的信息
```

发布页不提供修改入口。用户需要改城市时回到左上角全局城市选择。提交时从共享城市工具读取当前城市并写入 Bmob，而不是信任页面展示文本。

### 留言保存完整城市，展示只显示城市名

发布留言或回复时，`MessageBoardMessage` 写入完整城市字段，并将现有 `authorCity` 设置为城市展示名，例如 `广州`。留言列表继续使用 `authorCity` 展示，因此用户只看到城市名，不看到省和区/县。

这兼容当前留言组件的显示结构，同时为后续后台治理或城市分析保留完整区县信息。

## Risks / Trade-offs

- 历史数据没有 `cityCode`，上线过滤后会不可见 → 上线前批量补齐历史 `JobInfo`、`JobSeeker` 的默认城市字段。
- Bmob 查询代码分散，多处分页尾页查询可能漏加城市条件 → 封装 `applyCityFilter(query, city)` 并在所有 `JobInfo` / `JobSeeker` 查询路径使用。
- tab 页面通过 `app.globalData.tabid` 触发加载，城市切换后可能不刷新 → 页面 `onShow` 对比当前城市码，变化时清空列表并重新加载。
- 微信 region picker 返回的城市名带“市”，左上角要求展示城市名且最多 4 个中文 → 统一通过 `cityDisplayName` 生成展示文本，并在样式层使用单行省略。
- 只在客户端限制开放城市可能被绕过 → 当前项目写入本身在客户端完成，本阶段按现有架构实现；后续若有服务端或云函数写入，应在服务端重复校验城市开放状态。
- Bmob 客户端查询若不支持一个查询内同时表达 `cityCode AND (title contains keyword OR jobDescription contains keyword)`，实现可能需要分别查询标题和描述后在客户端按 `objectId` 去重、合并和排序 → 搜索页应封装独立查询函数，避免污染列表分页逻辑。

## Migration Plan

1. 在 Bmob `JobInfo`、`JobSeeker`、`MessageBoardMessage` 增加城市字段。
2. 给历史 `JobInfo` 和 `JobSeeker` 补默认城市：
   - `provinceName = 广东省`
   - `cityName = 广州市`
   - `districtName = 天河区`
   - `provinceCode = 440000`
   - `cityCode = 440100`
   - `districtCode = 440106`
   - `cityDisplayName = 广州`
3. 发布新版小程序后，新增数据自动写入当前城市。
4. 如需回滚代码，保留新增字段不影响旧版本读取；但城市过滤回滚后会恢复跨城市展示。

## Open Questions

- 无。已确认默认区县为 `广东省 / 广州市 / 天河区`；列表按当前城市过滤；搜索条件为 `cityCode == 当前城市 cityCode` 且 (`title` 模糊匹配搜索关键词 OR `jobDescription` 模糊匹配搜索关键词)。
