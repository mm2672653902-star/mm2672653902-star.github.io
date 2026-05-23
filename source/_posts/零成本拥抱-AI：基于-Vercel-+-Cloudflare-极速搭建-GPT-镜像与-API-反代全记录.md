---
title: 零成本拥抱 AI：基于 Vercel + Cloudflare 极速搭建 GPT 镜像与 API 反代全记录
date: 2026-05-23 13:52:38
author: Mao
tags: [AI工具, 镜像, 反向代理]
categories: 技术总结
---
> 零成本拥抱 AI：基于 Vercel + Cloudflare 极速搭建 GPT 镜像网站与 API 反代全记录

## 前言

身处 AI 爆发的时代，大语言模型（LLM）已经成为了工程师、学生和职场人的生产力标配。然而，网络门槛、官方 API 的连接限制以及昂贵的跨国账单，常常让国内的开发者和普通用户望而却步。

为了解决这个问题，我决定利用手头闲置的域名 `maoxijia.top`，打造一套专属于自己的 AI 基础设施。今天，我利用 Google 开源/推荐的高性能反向代理方案（Antigravity 架构思想），配合前端托管神器 **Vercel** 以及网络优化大师 **Cloudflare (CF)**，成功部署了两个平台：
1. **AI 镜像网站：** `ai.maoxijia.top`（提供给用户直接交互的网页端）
2. **API 反代网站：** `api.maoxijia.top`（提供给开发环境、第三方客户端直接调用的安全接口）

这套方案最大的优势在于：**完全免费、无需购买海外服务器、自带全球 CDN 加速、且能有效防御恶意攻击**。本文将毫无保留地把搭建全过程分享出来，希望能帮到有相同需求的朋友。

---

## 一、 核心架构与工具链介绍

在正式动手前，我们需要明白这套架构是如何运作的。简单来说，它由以下几个“乐高积木”搭建而成：

*   **Antigravity 核心方案**：基于高性能反代逻辑，专门处理复杂的请求重写、Header 伪装以及多账号轮询，确保国内请求能稳定顺畅地送达 OpenAI 等海外服务器。
*   **Vercel**：全球顶级的 Serverless（无服务器）托管平台。我们不需要购买 VPS，直接将代码托管在 GitHub，Vercel 会自动监听并完成自动化部署（CI/CD），并提供强大的 Edge Functions（边缘函数）来运行反代逻辑。
*   **Cloudflare**：全球网络安全与加速巨头。在这里它充当两个角色：一是 **DNS 域名解析与防护**，隐藏 Vercel 的真实分配 IP，防止网站被 DDoS 攻击；二是 **网络优化**，通过其全球边缘节点，大幅缩短国内访问的反响时间。

架构链路图大致如下：
`用户请求 -> Cloudflare (安全防护/CDN) -> Vercel Edge (运行 Antigravity 逻辑) -> OpenAI API 终点`

---

## 二、 准备工作

开始之前，请确保你已经准备好以下工具和账号：
1. **GitHub 账号**：用于克隆和托管反代及镜像网站的源码。
2. **Vercel 账号**：直接使用 GitHub 账号登录即可。
3. **Cloudflare 账号**：用于接管你的域名 DNS。
4. **一个顶级域名**：本教程以我自己的 `maoxijia.top` 为例。
5. **OpenAI API Key**：既然是搭建反代，你手里需要有一个官方的 API Key（用于测试或填入镜像后台）。

---

## 三、 实战演练：api.maoxijia.top（API 反代网站）部署

我们先来搭建底层骨架——API 反代。它的作用是把官方的 `api.openai.com` 映射到我们自己的 `api.maoxijia.top`，让国内的 Python 脚本或各类软件（如 ChatBox、NextChat）能无缝调用。

### 步骤 1：获取及配置 Antigravity 代码

1. 登录你的 GitHub 账号。
2. 寻找或创建基于 Vercel Edge Functions 的 Antigravity 反代仓库。
3. 在项目的 `index.js` 或 `api/v1.js` 核心路由中，确保其实现了以下逻辑：
   * 拦截所有发往 `api.maoxijia.top` 的请求。
   * 修改请求头（Headers），剥离可能导致阻断的特征，将 `Host` 修改为 `api.openai.com`。
   * 保持流式传输（Stream/SSE），这是 ChatGPT 逐字蹦出效果的关键。

### 步骤 2：导入 Vercel 并配置环境变量

1. 打开 [Vercel 官网](https://vercel.com/)，点击 **Add New -> Project**。
2. 导入你刚刚准备好的 GitHub 反代项目仓库。
3. 在 **Environment Variables（环境变量）** 中，可以根据项目要求配置关键变量：
   * 例如，如果你想做访问权限控制，可以设置 `AUTH_SECRET_KEY`。
   * 如果想内置官方 Key，可设置 `OPENAI_API_KEY`（建议留空，让客户端自行输入）。
4. 点击 **Deploy**。等待大约 30 秒，Vercel 就会为你分配一个以 `.vercel.app` 结尾的免费默认域名。

---

## 四、 实战演练：ai.maoxijia.top（AI 镜像网站）部署

有了稳定的 API 接口，接下来我们部署前端交互界面。这里我们通常采用市面上成熟的开源项目（如 ChatGPT-Next-Web 或 Lobe-Chat），它们拥有极佳的 UI 体验。

### 步骤 1：克隆前端项目

在 GitHub 上 Fork 优秀的网页端项目到你自己的仓库。

### 步骤 2：在 Vercel 中进行二次部署

1. 同样在 Vercel 中新建项目，选择刚才 Fork 的前端网页仓库。
2. **至关重要的一步**：在配置环境变量时，找到 `BASE_URL` 或 `OPENAI_PROXY_URL`。
3. **将该变量的值填写为我们刚刚搭建好的反代地址**：`https://api.maoxijia.top`。
   > **注意**：绝对不要填官方地址，必须填你自己的反代 API，这样前端网页才能在国内网络下正常向后端发送请求。
4. 点击 **Deploy**，完成前端镜像网站的上线。

---

## 五、 关键一环：Cloudflare 域名解析与 Vercel 自定义域名绑定

目前，Vercel 默认分配的 `.vercel.app` 域名在国内部分地区遭遇了 DNS 污染，无法直接访问。因此，我们必须绑定自己的顶级域名 `maoxijia.top`，并通过 Cloudflare 进行中转加速。

### 1. 将域名解析权移交给 Cloudflare
1. 登录你的域名注册商后台（如阿里云、腾讯云或 Namecheap）。
2. 将修改 DNS 服务器（Name Servers）为 Cloudflare 提供的地址（例如：`alex.ns.cloudflare.com` 和 `mira.ns.cloudflare.com`）。
3. 等待 DNS 生效。

### 2. 在 Vercel 中绑定自定义域名
1. 进入 Vercel 中 API 反代的项目后台，点击 **Settings -> Domains**。
2. 输入 `api.maoxijia.top`，点击 Add。此时 Vercel 会提示你一条 `CNAME` 记录或 `A` 记录的信息。
3. 同样的方式，进入前端镜像网站的项目后台，在 Domains 中添加 `ai.maoxijia.top`。

### 3. 在 Cloudflare 中配置 DNS 记录

回到 Cloudflare 控制台，进入 `maoxijia.top` 的管理页面，添加以下两条关键解析：

| 类型 (Type) | 名称 (Name) | 目标地址 (Content) | 代理状态 (Proxy status) |
| :--- | :--- | :--- | :--- |
| **CNAME** | `api` | `cname.vercel-dns.com` | **已开启 (Proxied 黄色小云朵)** |
| **CNAME** | `ai` | `cname.vercel-dns.com` | **已开启 (Proxied 黄色小云朵)** |

> **独家避坑指南：** 
> 很多人在这里会遇到“重定向次数过多（Too many redirects）”的错误。这是因为 Cloudflare 与 Vercel 之间的 SSL 握手协议冲突导致。
> **解决方案：** 在 Cloudflare 的左侧菜单中点击 **SSL/TLS**，将加密模式从默认的“灵活 (Flexible)”修改为 **“完全 (Full)”** 或 **“严格 (Strict)”**。

---

## 六、 性能优化与安全性加固

到这一步，你的网站应该已经可以顺利打开了。但作为一个合格的站点所有者，我们还需要利用 Cloudflare 的强大功能对网站进行调优。

### 1. 开启 Web 缓存与边缘加速
由于 AI 镜像站的许多前端资源（JavaScript、CSS、字体文件）是固定不变的，我们可以在 Cloudflare 的 **Caching (缓存)** 选项中，将浏览器缓存过期时间设置为 1天以上。这样，当国内用户访问 `ai.maoxijia.top` 时，静态资源会直接从就近的 Cloudflare 国内周边边缘节点（如香港、东京、新加坡）加载，实现毫秒级开屏。

### 2. 配置 WAF 防护墙，防止 API 被盗刷
API 额度就是真金白银。为了防止恶意爬虫或者别人直接抓取你的 `api.maoxijia.top` 进行滥用，建议在 Cloudflare 的 **Security -> WAF (Web 应用程序防火墙)** 中建立一条规则：
*   **速率限制 (Rate Limiting)**：限制单个 IP 每分钟的请求次数（例如：每分钟最多 60 次请求）。超过该频率则封禁该 IP 一小时。
*   **挑战机制**：对非正常浏览器特征的请求，强制弹出 Cloudflare Turnstile 验证码，拦截自动化刷量脚本。

---

## 七、 总结与展望

通过今天的一番折腾，我们用极其优雅的姿势完成了 `ai.maoxijia.top` 和 `api.maoxijia.top` 的协同部署。回看整个方案：

*   **零成本**：服务器托管在 Vercel，网络安全交给 Cloudflare，我们除了域名续费，没有掏一分钱。
*   **高可用**：得益于 Antigravity 的优秀底层和 Vercel Edge Functions 的分布式特性，即便单点出现波动，也能自动漂移恢复。
*   **双向赋能**：镜像站方便了身边没有技术背景的朋友直接使用 AI；反代站则解放了我们自己的开发环境，随时随地一行代码调用大模型。

未来，我计划在这套架构的基础上，进一步引入 **Cloudflare Workers KV** 来做全自动的 API Key 轮询与额度监控，甚至加入用户登录注册系统，将其打造成一个小型微型的 SaaS 平台。

如果你在跟随本文搭建的过程中遇到了任何阻碍，比如 Vercel 报错、Cloudflare 证书不匹配等问题，欢迎在评论区留言交流，我们一起避坑！

---

### 🎯 站点速递
*   **Web 交互端：** [https://ai.maoxijia.top](https://ai.maoxijia.top)
*   **API 接入点：** `https://api.maoxijia.top`

*版权声明：本文为博主原创文章，转载请注明出处。*
