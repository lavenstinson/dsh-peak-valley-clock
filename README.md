# DeepSeek峰谷用量（dsh-peak-valley-usage）

DeepSeek Harness（DSH）UI 插件：在**标题栏最左侧**显示一枚随 **DeepSeek API 峰谷计价时段**切换的头像（峰时「大肥鱼」、谷时「梁圣」），旁边分两行显示**今日 Token 用量**与**账户余额**。

![icon](icon.svg)

## 功能

- 🐳 头像随峰谷时段切换（悬停可查看当前时段说明）
- 📊 两行数据：今日 Token 用量（按当天会话日志中的 assistant usage 汇总）、账户当前余额
- 📍 固定在标题栏最左侧、会话名称之前
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
