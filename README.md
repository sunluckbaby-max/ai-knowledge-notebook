# AI 知识笔记本

一个独立的移动端优先 PWA，用于记录计算机、AI、科研、工具使用和技术学习内容。

## 功能

- 手动创建、编辑、删除笔记
- 标题、正文、分类、标签、创建时间、更新时间
- OCR 截图转笔记，基于 Tesseract.js
- 默认分类：计算机、AI、科研、工具、其他
- 按标题、正文、分类、标签搜索
- 按分类和标签筛选
- localStorage 本地浏览器存储，无登录、无后端
- PWA manifest、service worker、移动端主屏幕体验

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## Vercel

该项目已包含 `vercel.json`，可作为独立 Vite 项目部署到 Vercel。
