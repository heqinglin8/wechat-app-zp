# city-selection Specification

## Purpose
TBD - created by archiving change add-city-selection. Update Purpose after archive.
## Requirements
### Requirement: 当前城市初始化与展示
系统 SHALL 维护一个全局当前城市，并在小程序首页左上角展示当前城市名。

#### Scenario: 首次进入小程序使用默认城市
- **WHEN** 本地没有已缓存的当前城市
- **THEN** 系统 SHALL 使用 `广东省 / 广州市 / 天河区` 作为当前城市，并将首页左上角展示文本显示为 `广州`

#### Scenario: 使用缓存城市
- **WHEN** 本地存在有效的已缓存当前城市
- **THEN** 系统 SHALL 使用缓存中的省、市、区/县和编码作为当前城市

#### Scenario: 左上角城市名超长省略
- **WHEN** 当前城市展示名超过 4 个中文字符
- **THEN** 系统 SHALL 在左上角最多展示 4 个中文字符并用省略号表示超出内容

#### Scenario: 首页展示城市选择入口
- **WHEN** 用户进入首页
- **THEN** 首页 SHALL 在左上角展示当前城市名并提供微信城市选择入口

#### Scenario: 首页城市选择入口点击区域
- **WHEN** 用户进入首页
- **THEN** 首页左上角城市选择入口 SHALL 使用扩大后的稳定点击宽度
- **AND** 城市名文本仍 SHALL 最多展示 4 个中文并省略超出内容

### Requirement: 微信城市选择
系统 SHALL 使用微信小程序省市区选择组件选择城市，并保存省、市、区/县及对应编码。

#### Scenario: 选择开放城市
- **WHEN** 用户通过微信 `picker mode="region"` 选择 `广州`、`佛山`、`韶关`、`深圳`、`东莞` 或 `珠海` 下的任意区/县并确认
- **THEN** 系统 SHALL 将选择结果归一化为包含 `provinceName`、`cityName`、`districtName`、`provinceCode`、`cityCode`、`districtCode`、`cityDisplayName` 的当前城市对象

#### Scenario: 缓存开放城市
- **WHEN** 用户确认选择开放城市
- **THEN** 系统 SHALL 更新全局当前城市并将该城市对象缓存到本地

#### Scenario: 拒绝未开放城市
- **WHEN** 用户通过微信城市选择组件确认一个未开放城市
- **THEN** 系统 SHALL 提示“仅有广州、深圳、佛山、韶关、东莞、珠海开放业务，申请开放请微信咨询”，并且 SHALL NOT 更新当前城市或本地缓存

### Requirement: 发布岗位写入当前城市
系统 SHALL 在发布岗位 `JobInfo` 时默认写入当前城市信息，具体到区/县。

#### Scenario: 岗位发布页展示只读城市
- **WHEN** 用户打开 `pages/publishjob/publishjob`
- **THEN** 页面 SHALL 展示当前省、市、区/县信息，并提示只能发布本城市的信息

#### Scenario: 岗位发布页不允许修改城市
- **WHEN** 用户在岗位发布页填写岗位信息
- **THEN** 页面 SHALL NOT 提供表单内城市修改入口

#### Scenario: 提交岗位写入城市字段
- **WHEN** 用户提交岗位信息且校验通过
- **THEN** 系统 SHALL 写入 `JobInfo`，并包含当前城市的省、市、区/县名称和省码、市码、区码

### Requirement: 留言写入当前城市并使用 displayCityName 展示
系统 SHALL 在发送留言或回复时写入当前城市完整信息和 `displayCityName`，并在留言列表中直接使用 `displayCityName` 展示城市名。

#### Scenario: 发送主留言写入城市字段
- **WHEN** 用户发送主留言且发布校验通过
- **THEN** 系统 SHALL 写入 `MessageBoardMessage`，并包含当前城市的省、市、区/县名称、省码、市码、区码和 `displayCityName`

#### Scenario: 发送回复写入城市字段
- **WHEN** 用户发送回复且发布校验通过
- **THEN** 系统 SHALL 写入 `MessageBoardMessage`，并包含当前城市的省、市、区/县名称、省码、市码、区码和 `displayCityName`

#### Scenario: 留言列表使用 displayCityName 展示城市
- **WHEN** 系统展示留言或回复的发布位置
- **THEN** 留言列表 SHALL 直接使用 `displayCityName` 展示城市名，不展示省名和区/县名

### Requirement: 首页职位按当前城市过滤
系统 SHALL 在首页职位列表中只展示当前城市的岗位。

#### Scenario: 首页首次加载职位
- **WHEN** 首页加载 `JobInfo` 列表
- **THEN** 系统 SHALL 查询 `cityCode` 等于当前城市 `cityCode` 的岗位，并保留现有排序和分页规则

#### Scenario: 首页切换职位分类
- **WHEN** 用户在首页切换职位分类 tab
- **THEN** 系统 SHALL 清空旧列表，并按当前城市 `cityCode` 和分类条件重新查询岗位

#### Scenario: 首页加载更多职位
- **WHEN** 用户在首页触底加载更多
- **THEN** 系统 SHALL 继续按当前城市 `cityCode` 查询下一页岗位，且 SHALL NOT 混入其他城市岗位

#### Scenario: 首页职位为空
- **WHEN** 首页按当前城市和当前分类查询 `JobInfo` 结果为 0
- **THEN** 系统 SHALL 在列表区域展示“暂无信息”和“重新刷新”按钮
- **AND** 用户点击“重新刷新”后系统 SHALL 按当前城市和当前分类重新查询岗位

### Requirement: 今日招聘按当前城市过滤
系统 SHALL 在今日招聘列表中只展示当前城市的岗位。

#### Scenario: 今日招聘加载职位
- **WHEN** `pages/today/today` 加载或刷新 `JobInfo` 列表
- **THEN** 系统 SHALL 查询 `cityCode` 等于当前城市 `cityCode` 的岗位，并保留现有排序、分类和分页规则

#### Scenario: 当前城市变化后刷新今日招聘
- **WHEN** 用户切换当前城市后进入或返回今日招聘页
- **THEN** 系统 SHALL 使用新的当前城市清空并重新加载职位列表

#### Scenario: 今日招聘职位为空
- **WHEN** `pages/today/today` 按当前城市和当前分类查询 `JobInfo` 结果为 0
- **THEN** 系统 SHALL 在列表区域展示“暂无信息”和“重新刷新”按钮
- **AND** 用户点击“重新刷新”后系统 SHALL 按当前城市和当前分类重新查询岗位

### Requirement: 今日求职按当前城市过滤
系统 SHALL 在今日求职列表中只展示当前城市的求职信息。

#### Scenario: 今日求职加载求职信息
- **WHEN** `pages/todayjobseek/todayjobseek` 加载或刷新 `JobSeeker` 列表
- **THEN** 系统 SHALL 查询 `cityCode` 等于当前城市 `cityCode` 的求职信息，并保留现有排序、分类和分页规则

#### Scenario: 当前城市变化后刷新今日求职
- **WHEN** 用户切换当前城市后进入或返回今日求职页
- **THEN** 系统 SHALL 使用新的当前城市清空并重新加载求职列表

#### Scenario: 今日求职信息为空
- **WHEN** `pages/todayjobseek/todayjobseek` 按当前城市和当前分类查询 `JobSeeker` 结果为 0
- **THEN** 系统 SHALL 在列表区域展示“暂无信息”和“重新刷新”按钮
- **AND** 用户点击“重新刷新”后系统 SHALL 按当前城市和当前分类重新查询求职信息

### Requirement: 搜索结果按当前城市和关键词模糊过滤
系统 SHALL 在搜索结果中同时使用当前城市和原搜索关键词过滤岗位与求职信息，关键词匹配 SHALL 使用模糊匹配。岗位匹配 SHALL 覆盖岗位标题、岗位描述和公司名；求职信息匹配 SHALL 覆盖标题和求职意向。

#### Scenario: 搜索当前城市岗位
- **WHEN** 用户提交搜索关键词并进入搜索结果页
- **THEN** 系统 SHALL 查询 `JobInfo.cityCode` 等于当前城市 `cityCode` 且 (`JobInfo.title` 包含搜索关键词 OR `JobInfo.jobDescription` 包含搜索关键词 OR `JobInfo.companyName` 包含搜索关键词) 的岗位

#### Scenario: 搜索当前城市求职信息
- **WHEN** 用户提交搜索关键词并进入搜索结果页
- **THEN** 系统 SHALL 查询 `JobSeeker.cityCode` 等于当前城市 `cityCode` 且 (`JobSeeker.title` 包含搜索关键词 OR `JobSeeker.recoJobIntent` 包含搜索关键词) 的求职信息

#### Scenario: 搜索不展示其他城市岗位
- **WHEN** 其他城市存在 `title`、`jobDescription` 或 `companyName` 包含搜索关键词的岗位
- **THEN** 搜索结果 SHALL NOT 展示这些其他城市岗位

#### Scenario: 搜索不展示其他城市求职信息
- **WHEN** 其他城市存在 `title` 或 `recoJobIntent` 包含搜索关键词的求职信息
- **THEN** 搜索结果 SHALL NOT 展示这些其他城市求职信息

#### Scenario: 标题模糊命中
- **WHEN** 当前城市存在 `title` 包含搜索关键词的岗位
- **THEN** 搜索结果 SHALL 展示该岗位

#### Scenario: 岗位描述模糊命中
- **WHEN** 当前城市存在 `jobDescription` 包含搜索关键词的岗位
- **THEN** 搜索结果 SHALL 展示该岗位

#### Scenario: 公司名模糊命中
- **WHEN** 当前城市存在 `companyName` 包含搜索关键词的岗位
- **THEN** 搜索结果 SHALL 展示该岗位

#### Scenario: 求职意向模糊命中
- **WHEN** 当前城市存在 `recoJobIntent` 包含搜索关键词的求职信息
- **THEN** 搜索结果 SHALL 展示该求职信息

#### Scenario: 混合结果区分样式
- **WHEN** 搜索结果同时包含 `JobInfo` 和 `JobSeeker`
- **THEN** 系统 SHALL 在同一个搜索结果列表中混合展示两类结果
- **AND** `JobInfo` 和 `JobSeeker` SHALL 使用不同样式的 item
- **AND** 点击 `JobInfo` 结果 SHALL 跳转岗位详情，点击 `JobSeeker` 结果 SHALL 跳转求职详情

### Requirement: Bmob 数据库更新提醒
系统 SHALL 在实现完成说明中告知 Bmob 表字段修改和历史数据手动补齐方式，但 SHALL NOT 实现迁移脚本或运行时补数据逻辑。

#### Scenario: 交付实现说明
- **WHEN** 城市选择功能代码实现完成
- **THEN** 交付说明 SHALL 列出 `JobInfo`、`JobSeeker`、`MessageBoardMessage` 需要新增的城市字段，以及历史 `JobInfo`、`JobSeeker` 在 Bmob 控制台手动补默认广州天河数据的方法

#### Scenario: 不实现迁移逻辑
- **WHEN** 实现城市选择功能
- **THEN** 系统 SHALL NOT 增加迁移脚本、云函数迁移或运行时自动补历史数据逻辑

