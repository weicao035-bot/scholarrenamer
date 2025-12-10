
# 用 Gemini 3 打造属于自己的 PDF 文献自动命名助手

作为一个文献分享类博主，我经常要做的琐事之一，就是给下载到本地的一堆文献重新命名。
只有命名规范了，未来才能快速地找到所需的资料。
但手动改名确实既费时又费力。

<img width="1251" height="513" alt="image" src="https://github.com/user-attachments/assets/3afd7b2b-963c-4fb9-97f7-cddd8f1409c0" />

> 注：命名上面文献至少花了半个小时，并且有时候格式还不统一。
> 后续想要在命名中加入期刊和作者信息又很麻烦。

---

## 为什么要自动化？

Nature 团队之前就给过一个科研建议：

> 当你发现自己每周在重复某项枯燥任务上花超过一小时，就应该考虑把它自动化。

文献命名无疑就是这样的任务。

---

## 现有工具的局限

网上其实已经有一些工具可以自动读取 PDF 信息，比如 **Zotero**、**Mendeley** 等也能完成部分自动命名。
但它们仍然有一些限制：

* 上手门槛不够低 —— 有些需要写 Python 或其他语句，或者至少懂一点基本语法；
* 个性化不足 —— 命名规则、顺序很难自由设置，不够直观和灵活；
* 语言处理能力较弱 —— 很多工具只能读取英文文献，无法提取中文信息，也不能翻译标题。

---

## 我的解决方案：Gemini 3 文献命名助手

于是，我决定用 **Gemini 3** 做一个更符合我工作流的“小工具”：
一个可以批量处理文献、并且支持高度个性化命名规则的 PDF 自动命名助手。

---

### 1. 命名规则的个性化设置

这是整个工具的核心。
我要求 Gemini 3 把常见需求都整理成了可选模块，比如：

* 年份
* 期刊名
* 第一作者
* 标题（可选：英文 or 自动翻译成中文）
* 自定义分隔符

你可以随意调整顺序，也可以实时预览命名结果。

---

### 2. 支持批量上传 PDF（不限数量）

<img width="1280" height="1014" alt="image" src="https://github.com/user-attachments/assets/067742ca-895b-4472-a2e0-ec7bf5210330" />

---

### 3. 自动调用 AI，快速完成批量命名

上传后，工具会自动调用 AI 提取文献的所有信息，
然后按照你设定的命名格式进行命名。

我实测下来——**17 份文件能在 30 秒内完成！**

<img width="1616" height="164" alt="image" src="https://github.com/user-attachments/assets/7fad30b6-73c0-4749-8172-56906c97135f" />

命名完成后的下载方式也很灵活：

* 一键 `Download ZIP`：把所有重命名后的 PDF 打包下载
* 单个下载：可细粒度地选择

如果上传后才发现命名规则需要修改，也不用重新上传文件——
只要重新选择模块，系统会自动生成新的命名结果。

<img width="1280" height="1100" alt="image" src="https://github.com/user-attachments/assets/49c6f5a0-3c01-438f-8e3f-f62167ba09f2" />

---

## 使用体验

目前我对用 Gemini 3 辅助开发的这个小工具还是很满意的：

* 节省了大量逐个命名的时间
* 对文献批量重命名很友好
* 命名逻辑完全可个性化，适配不同人的工作流
* 界面直观、代码小白友好

我会在试用几天后再做优化，如果读者朋友们有需要，也可以分享给大家！

---

## 我的提示词（Prompt）

以下是我在开发时使用的提示词，可供参考：

```text
我需要你开发一个工具：能够自动读取用户上传的文献 PDF，
并从中提取年份、作者、标题和期刊名（英文）。
文件重命名格式应为“年份-第一作者-标题”。
标题部分需要提供可选项：
可以选择使用英文标题，或者将英文标题自动翻译为中文标题，
并允许用户自由排序这些命名选项。
最终，该工具需要支持批量上传 PDF、
对所有处理后的文件进行统一重命名、
并提供一键打包下载的功能。
```

---

## 如何在本地部署

### 步骤一：准备环境 (Prerequisites)

首先下载 Node.js
👉 [https://nodejs.org/zh-cn/download](https://nodejs.org/zh-cn/download)

* **Node.js 是什么？**
  你可以把它理解成一个运行 JavaScript 代码的引擎。
  这个程序是用 JavaScript（或 TypeScript）写的，所以需要 Node.js 才能运行。

* **如何检查是否安装成功？**

```bash
node -v
```

如果显示版本号（如 `v18.17.1`），说明安装成功。
否则，请前往 Node.js 官网下载并安装。

---

### 步骤二：安装依赖 (Install dependencies)

将下载后的文件夹放在桌面，然后在终端输入以下命令，让系统指向该文件夹：

```bash
cd ~/Desktop/scholarrenamer
```

随后输入：

```bash
npm install
```

* **npm install 是什么？**
  `npm` 是 Node.js 自带的包管理器，可理解为“应用商店”。
  这个命令会根据 `package.json` 里的配置，自动下载程序运行所需的依赖。

成功示例如下：

<img width="1280" height="433" alt="image" src="https://github.com/user-attachments/assets/2e41a83c-929c-4a43-adf6-15c74c29a512" />

---

### 步骤三：设置 API 密钥 (Set the GEMINI_API_KEY)

程序需要一个“通行证”才能与 Google 的 Gemini AI 模型通信。

1. 找到 `.env.local` 文件（项目根目录下）
2. 用文本编辑器打开该文件，并添加或修改以下内容：

```bash
GEMINI_API_KEY=在这里填上你的Gemini API密钥
```

* **在哪里获取密钥？**
  前往 [Google AI Studio](https://aistudio.google.com/) 获取你的个人 Gemini API Key。

---

### 步骤四：运行程序 (Run the app)

完成以上所有步骤后，在终端输入：

```bash
npm run dev
```

* **npm run dev 是什么？**
  这是执行 `package.json` 文件中定义的 `dev` 脚本，用于启动本地服务器。
  执行后，你会看到类似以下输出：

```
Local: http://localhost:3000
```

复制该链接到浏览器中，即可运行你的 AI 应用！

<img width="638" height="168" alt="image" src="https://github.com/user-attachments/assets/b354ae04-9cd0-4074-9360-f1b59367947e" />

---

