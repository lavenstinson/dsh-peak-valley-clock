# DeepSeek峰谷时钟（dsh-peak-valley-clock）

DeepSeek Harness（DSH）UI 插件：在对话区域正上方**居中**显示一个白色的 24 小时数字时钟，时钟左侧的头像会跟随 **DeepSeek API 的峰谷计价时段**自动切换——峰时显示「大肥鱼」，谷时显示「梁圣」。

![icon](icon.svg)

## 功能

- 🕐 24 小时制数字时钟（时:分:秒），白色大号等宽数字，每秒与整秒对齐跳动
- 🐳 头像随峰谷时段切换（峰时 / 谷时 徽标同步变化，悬停显示当前时段说明）
- ⏰ 严格按 DeepSeek API 官方定价规则判定峰谷
- 🖼️ 头像图片可自定义；未提供图片时自动回退为内置占位头像

## DeepSeek API 峰谷规则（官方）

依据 [DeepSeek API 官方定价页](https://api-docs.deepseek.com/quick_start/pricing)：

- **峰时（Peak）**：周一至周五（**不含中国法定节假日**）北京时间 **09:00–12:00、14:00–18:00**
- **谷时（Off-peak）**：其余所有时间，**周末与法定节假日全天均为谷时**，谷时价格为峰时的一半

## 安装

本插件是一个 DSH Bundle，在 DSH 的插件管理中通过目录安装（`plugin_manager` → `install_bundle`，目标为仓库根目录），或发布到 npm 后按包名安装。

## 自定义

### 峰谷时段与节假日

编辑 [`client.js`](client.js) 顶部常量：

- `PEAK_WINDOWS`：峰时窗口（分钟数，`9*60` 即 09:00）
- `HOLIDAYS`：工作日放假的日期（`YYYY-MM-DD`），周末无需添加，本来就全谷

### 头像图片

在**插件目录同级的 `图片素材/` 文件夹**放置两张 PNG（文件名需一致，缺省时自动使用内置占位头像）：

| 文件 | 显示时段 |
| --- | --- |
| `图片素材/大肥鱼.png` | 峰时 |
| `图片素材/梁圣.png` | 谷时 |

图片由插件 Host 端通过 `/pvc-assets/` 路由提供，仅允许上述两个固定文件名，无路径穿越风险。

### 时钟外观

字体大小、位置、徽标颜色等样式在 [`client.js`](client.js) 的 `CSS` 常量中调整。

## 目录结构

```
.
├── package.json        # 包清单与 dsh.bundle / dsh.client 声明
├── cordis.patch.yml    # 插件行（id: peak-valley-clock）
├── index.js            # Host 端：头像图片 HTTP 路由
├── client.js           # 客户端：时钟、峰谷判定与头像渲染
├── locale/             # 插件标题与描述（中/英）
└── icon.svg            # 插件图标
```

## License

[MIT](LICENSE)
