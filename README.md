# Hydro

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/hydro-dev/hydro/build.yml?branch=master)
![hydrooj](https://img.shields.io/npm/dm/hydrooj)
![npm](https://img.shields.io/npm/v/hydrooj?label=hydrooj)
![node-current](https://img.shields.io/node/v/hydrooj)
![GitHub contributors](https://img.shields.io/github/contributors/hydro-dev/Hydro)
![GitHub commit activity](https://img.shields.io/github/commit-activity/y/hydro-dev/Hydro)

Hydro 是一个高效的信息学在线测评系统。特点：易于部署（且提供安装脚本），轻量，功能强大且易于扩展。  
我们提供了一套在线服务供用户直接使用或是体验系统功能而无需自行部署安装。  
详情前往 [https://hydro.ac](https://hydro.ac) 查看 [操作指引](https://hydro.ac/discuss/6172ceeed850d38c79ae18f9)  


一键部署脚本（兼容多数主流 Linux 发行版，推荐使用 Ubuntu 22.04，详见下方文档）：

```sh
LANG=zh . <(curl https://hydro.ac/setup.sh)
```

[中文文档](https://hydro.js.org/)  

[English](./README-EN.md)  

如果觉得本项目对你有帮助，不妨点一下右上角的 star 哦（）  
项目的开发与维护需要资金，欢迎[进行捐助](https://pay.undefined.moe) 。  
Hydro 提供收费的功能定制服务，如您需要可与我们联系。  
相关文档若说明的不够详细，请提交 Pull Request 或联系开发组说明。  
bug 和功能建议请在 Issues 提出。  

[在 Gitpod 打开测试环境](https://gitpod.io/#https://github.com/hydro-dev/Hydro)  

## 联系我们

QQ [3402182471](https://wpa.qq.com/msgrd?v=3&uin=3402182471&site=qq&menu=yes)  
Hydro 用户群：1085853538  
Telegram 群 [@hydrodev](https://t.me/hydrodev)
Telegram [@webpack_exports_undefined](https://t.me/webpack_exports_undefined)  

<details>
<summary><h2>更新日志（点击展开）</h2></summary>

### Hydro 4.4.5 / UI 4.43.0
- core: 修复比赛基于 ID 搜索题目的功能
- judge: 修复 testlib 错误信息显示异常的问题
- sandbox: 提高默认 stdio 限制
- core: 修复讨论历史记录异常的问题
- core: 优化每日任务的运行速度
- core: 用户详情页支持显示用户近期参加的比赛/作业
- judge: 将 Bash 添加到预设语言列表
- vjudge: 在 cli 模式下跳过加载
- lsp: 修复了自动补全的提示，可能需要手动更新后生效
- judge: 优化 diff 输出
- install: 默认使用 mongodb uri 作为数据库连接方式
- ui: 在用户背景加载失败时 fallback 到默认背景
- 文件路径更改为大小写敏感。
- 在前端插件中支持使用 `import { ... } from '@hydrooj/ui-default'` 引入内置库。
- `ctx.inject('Notification')` 支持插入多行文本。

### 4.4.3
- core: 优化了比赛计分板页面的性能
- core: 导入用户时支持指定用户所属小组和学校
- core&ui: 其他漏洞修复和性能优化
- 添加了 `UserModel.getListForRender(domainId, uids)` 方法。
- 添加 `IHandler.response.pjax` 属性。

### 4.4.0
- core: 移除了 Problem.assign
- core: 修复了比赛结束后，若题目仍处于隐藏状态，无法查看代码的问题
- ui: 修复了 IE 浏览器端页脚的显示
- judge: 修复 lemon checker 异常退出导致题目计分为 0 的问题
- ui: 优化管理端的 Firefox 兼容性警告
- ui: 优化 fps 题目导入后的显示
- ui: 修复 IE 浏览器显示语言识别的问题
- install: 检测已安装的宝塔环境并抛出不兼容警告
- ui: 优化部分错误提示
- migrate: 性能优化
- vjudge: 修复 Codeforces 提交记录爬取异常的问题
- `ProblemModel.getList()` 移除了 group 参数，后续参数前移
- `cordis` 升级至 2.6

### 4.3.2
- 修复评测详情页面在特定情况下不会即时更新的问题
- 将 testlib spj 的错误返回至用户侧
- 修复题目文件无法从管理员侧预览的问题

### 4.3.1
- 终止对 NodeJS <14 的支持
- ui: api: 更新了 API Workbench
- judge: 移除环境变量中 \r，添加 Python Packages 说明
- ui: 修改了部分推荐链接
- prom-client: 记录 EventEmitter 信息
- core: contest: 支持导出比赛信息为 Ghost 格式
- core: contest: 优化比赛中提交量和通过量的计算
- core: contest: 封榜时显示 Pending 提交
- judge: 修复客观题未设置答案导致评测跳过的问题
- core: 优化 CsrfTokenError 和 DomainNotFoundError 回显
- core: server: 捕获 WebSocket 错误
- core: validator: 修复可以发送空站内消息的问题
- 其他漏洞修复和性能优化
- 在题目详情页中，Scratchpad.store 可从 Window 上公开访问

### 4.3.0
- 安装时自动安装 Caddy 配置反向代理监听 80 端口。
- 支持使用 `hydrooj install <src>` 和 `hydrooj uninstall <name>` 快速管理插件。
- 在 管理域 -> 编辑域资料 处添加了语言选择的自动补全。
- 支持在 OI 赛制下查看自己已提交的代码。
- import-qduoj：支持导入 SPJ 题目。
- fps-importer：适配 FPS 文件 1.4 版本。
- 其他漏洞修复和体验优化。
- 支持使用 `ctx.i18n.load(lang, Record<string, string>)` 加载翻译文件。
- 支持 `ctx.withHandlerClass(name, callback)` 获取类原型。
- prom-client: 支持自定义 ConnectionHandler 上报分类。
- 将 Handler.ctx 移动至 Handler.context，新的 Handler.ctx 为 PluginContext。

</details>

## 开源许可

本项目基于 AGPL-3.0-or-later 开源。  
在您部署 Hydro 时，需要保留底部的 `Powered by Hydro` 字样，其中的 `Hydro` 字样需指向 `hydro.js.org/本仓库/fork` 之一的链接。  
若您对源码做出修改/扩展，同样需要以 AGPL-3.0-or-later 开源，您可以以 `Powered by Hydro, Modified by xxx` 格式在页脚注明。  
鉴于 Mirai 处的 [不和谐事件](https://github.com/mamoe/mirai/issues/850) 对此项目做如下声明：

- 项目开源不代表开发者有义务为您提供服务。  
- 您的发言不应该具有攻击性或是不友善倾向。  
- 在提问前请先阅读《提问的智慧》。  
- 若有必要，开发者有权对您停止任何技术支持。  
- 开发组会 **尽可能** 保证用户可以进行平滑升级，但无法保证不在新版本引入影响使用的漏洞，且内部实现可能会在不发布任何通知的情况下进行重命名/修改/删除。  

如果您对以上条目感到不适，建议您停止使用本项目。

## 鸣谢

排名不分先后，按照链接字典序  

- [Github](https://github.com/) 为 Hydro 提供了代码托管与自动构建。  
- [criyle](https://github.com/criyle) 提供评测沙箱实现。  
- [Vijos](https://github.com/vijos/vj4) 为 Hydro 提供了UI框架。  
