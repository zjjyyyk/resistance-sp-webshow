# Resistance Distance Algorithm Performance Comparison

English | [简体中文](./README.md)

🚀 **[Live Demo](https://zjjyyyk.github.io/resistance-sp-webshow/)**

## 💡 What is this?

A web-based tool for **visualizing and comparing the performance** of different Resistance Distance algorithm implementations in real-time.

### 🎯 Core Concept

**Compile C++ algorithms to WebAssembly and run high-performance computations directly in the browser!**

Using Emscripten to convert C++ code to WASM, we bring near-native performance to the web. No backend servers needed – all computations run in your browser!

- **JavaScript vs WebAssembly (C++)** - See the speed difference firsthand
- **Multiple algorithm implementations** - Push_v_sp and Abwalk_v_sp
- **Real datasets** - Test on actual networks (DBLP, Enron, Astrophysics)
- **20 synthetic graph generators** - Generate various graph structures
- **Interactive parameters** - Adjust rmax, times, and node selections (s, t, v)
- **Graph visualization** - Interactive visualization for graphs with ≤100 nodes

## 🎯 Quick Start

1. Visit the [live website](https://zjjyyyk.github.io/resistance-sp-webshow/)
2. Select a dataset (preset, synthetic, or upload your own)
3. Choose source (s), target (t), and landmark (v) nodes
4. Select an algorithm
5. Click "Compute Resistance Distance"
6. Compare execution times and results!

## 📊 Features

- ⚡ **Performance Metrics** - Execution time tracking
- 📈 **Error Analysis** - Absolute and relative error metrics
- 🎨 **Visual Comparison** - Side-by-side results display
- 📤 **Custom Datasets** - Upload your own graphs (edge list format)
- 🎲 **20 Graph Generators** - Generate various synthetic graphs
- 🔄 **Undirected Graphs** - Specialized for resistance distance computation
- 🖼️ **Graph Visualization** - Interactive visualization with Cytoscape.js for small graphs (≤100 nodes)

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Custom Components
- **Computation**: WebAssembly (Emscripten) + Web Workers
- **Algorithms**: C++ (WASM) and JavaScript implementations
- **Visualization**: Cytoscape.js

---

Built to explore resistance distance algorithm performance in the browser 🚀
