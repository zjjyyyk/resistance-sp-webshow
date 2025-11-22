# Resistance Distance 算法性能对比工具

[English](./README.en.md) | 简体中文

🚀 **[在线演示](https://zjjyyyk.github.io/resistance-sp-webshow/)**

## 💡 这是什么？

一个基于 Web 的工具，用于**实时可视化和对比不同 Resistance Distance 算法实现的性能**。

### 🎯 核心理念

**将 C++ 算法编译成 WebAssembly，直接在浏览器中运行高性能算法！**

通过 Emscripten 将 C++ 代码转换为 WASM，我们让网页端也能享受接近原生的计算速度。不需要后端服务器，全部计算在你的浏览器中完成！

- **JavaScript vs WebAssembly (C++)** - 亲眼见证速度差异
- **多种算法实现** - 支持 Push_v_sp 和 Abwalk_v_sp 算法
- **真实数据集** - 在实际网络上测试（DBLP、Enron、天体物理引用网络）
- **20 种人工图生成器** - 生成各种图结构
- **交互式参数** - 调整 rmax、times 以及 s, t, v 节点选择
- **图可视化** - 对于节点数 ≤100 的图，提供交互式可视化

## 🎯 快速开始

1. 访问[在线网站](https://zjjyyyk.github.io/resistance-sp-webshow/)
2. 选择一个数据集（预设、人工生成或上传自定义文件）
3. 选择源节点 (s)、目标节点 (t) 和地标节点 (v)
4. 选择一个算法
5. 点击 "Compute Resistance Distance"
6. 对比执行时间和结果！

## 📊 功能特性

- ⚡ **性能指标** - 执行时间追踪
- 📈 **误差分析** - 绝对误差和相对误差度量
- 🎨 **可视化对比** - 并排显示结果
- 📤 **自定义数据集** - 上传你自己的图（边列表格式）
- 🎲 **20 种图生成器** - 生成各种人工图结构
- 🔄 **无向图** - 专门用于电阻距离计算
- 🖼️ **图可视化** - 对于小型图（≤100 节点），使用 Cytoscape.js 进行实时可视化

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + 自定义组件
- **计算**: WebAssembly (Emscripten) + Web Workers
- **算法**: C++ (WASM) 和 JavaScript 实现
- **可视化**: Cytoscape.js

---

为在浏览器中探索电阻距离算法性能而生 🚀
