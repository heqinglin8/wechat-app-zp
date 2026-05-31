# Bmob 城市字段更新提醒

本变更不包含迁移脚本、云函数迁移或运行时自动补历史数据逻辑。上线前需要在 Bmob 控制台手动完成字段和历史数据更新。

## JobInfo

新增字段：

- `provinceName` String，例如 `广东省`
- `cityName` String，例如 `广州市`
- `districtName` String，例如 `天河区`
- `provinceCode` String，例如 `440000`
- `cityCode` String，例如 `440100`
- `districtCode` String，例如 `440106`
- `cityDisplayName` String，例如 `广州`

历史数据需要补默认值：

- `provinceName = 广东省`
- `cityName = 广州市`
- `districtName = 天河区`
- `provinceCode = 440000`
- `cityCode = 440100`
- `districtCode = 440106`
- `cityDisplayName = 广州`

## JobSeeker

新增字段：

- `provinceName` String，例如 `广东省`
- `cityName` String，例如 `广州市`
- `districtName` String，例如 `天河区`
- `provinceCode` String，例如 `440000`
- `cityCode` String，例如 `440100`
- `districtCode` String，例如 `440106`
- `cityDisplayName` String，例如 `广州`

历史数据需要补默认值：

- `provinceName = 广东省`
- `cityName = 广州市`
- `districtName = 天河区`
- `provinceCode = 440000`
- `cityCode = 440100`
- `districtCode = 440106`
- `cityDisplayName = 广州`

## MessageBoardMessage

新增字段：

- `provinceName` String，例如 `广东省`
- `cityName` String，例如 `广州市`
- `districtName` String，例如 `天河区`
- `provinceCode` String，例如 `440000`
- `cityCode` String，例如 `440100`
- `districtCode` String，例如 `440106`
- `displayCityName` String，例如 `广州`

留言历史数据不影响职位/求职列表过滤。若需要旧留言展示城市，可手动给旧 `MessageBoardMessage` 补 `displayCityName`。
