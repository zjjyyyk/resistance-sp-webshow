# Resistance Single-Pair Distance Visualizer - 项目设置指南

## 项目状态总结

### ✅ 已完成的工作

#### 1. 项目基础架构
- ✅ `package.json` - 项目配置和依赖
- ✅ 所有配置文件 (tsconfig.json, vite.config.ts, tailwind.config.js, etc.)
- ✅ `index.html` - 入口HTML文件
- ✅ `public/` - 公共资源目录(数据集、图标等)

#### 2. 类型定义 (`src/types/`)
- ✅ `graph.ts` - 图数据结构,包含20种人工图类型
- ✅ `algorithm.ts` - 算法类型和结果类型
- ✅ `worker.ts` - Web Worker通信协议

#### 3. 工具模块 (`src/utils/`)
- ✅ `logger.ts` - 日志系统
- ✅ `errorMetrics.ts` - 误差计算(绝对误差、相对误差)
- ✅ `graphGenerators.ts` - 20种图生成器完整实现
- ✅ `graphParser.ts` - 图解析器(支持无向图)
- ✅ `dataLoader.ts` - 数据集加载器

#### 4. 基础组件和Hooks
- ✅ `hooks/useToast.ts` - Toast通知Hook
- ✅ `components/Toast.tsx` - Toast组件
- ✅ `index.css` - 全局样式
- ✅ `main.tsx` - 应用入口
- ✅ `App.tsx` - 主应用组件

### 🚧 需要完成的工作

#### 5. React主要组件 (需要创建)
- ⏳ `components/ParameterPanel.tsx` - 参数配置面板
- ⏳ `components/ResultsPanel.tsx` - 结果展示面板
- ⏳ `components/NodeSelector.tsx` - 节点选择器(s, t, v)
- ⏳ `components/SyntheticGraphSelector.tsx` - 人工图生成器选择器

#### 6. 算法实现 (需要创建)
- ⏳ `algorithms/pushVSp.ts` - Push_v_sp JavaScript版本
- ⏳ `algorithms/abwalkVSp.ts` - Abwalk_v_sp JavaScript版本

#### 7. Web Worker (需要创建)
- ⏳ `hooks/useResistanceWorker.ts` - Worker管理Hook
- ⏳ `workers/resistance.worker.ts` - 主Worker文件

#### 8. C++/WASM代码 (需要修改和编译)
- ⏳ 修改 `Push_v_sp.hpp` - 支持外部传入v参数
- ⏳ 修改 `AbWalk_v_sp.hpp` - 支持外部传入v参数
- ⏳ 创建WASM绑定代码
- ⏳ 编写编译脚本

#### 9. 测试 (需要创建)
- ⏳ `utils/__tests__/errorMetrics.test.ts`
- ⏳ `utils/__tests__/graphGenerators.test.ts`
- ⏳ `utils/__tests__/graphParser.test.ts`

#### 10. 文档 (需要完善)
- ⏳ `README.md`
- ⏳ `README.zh.md`

---

## 下一步操作指南

### 步骤 1: 安装依赖

```bash
cd c:\Users\zjj\Desktop\resistance-sp-webshow
npm install
```

### 步骤 2: 创建剩余的React组件

由于代码量很大,我将为您提供所有需要的组件代码。请按以下顺序创建:

1. **NodeSelector组件** - 节点选择器(s, t, v)
2. **SyntheticGraphSelector组件** - 人工图生成器UI
3. **ParameterPanel组件** - 参数面板(整合所有输入)
4. **ResultsPanel组件** - 结果展示面板
5. **useResistanceWorker Hook** - Worker管理
6. **resistance.worker.ts** - Worker实现
7. **算法JavaScript实现** - pushVSp.ts 和 abwalkVSp.ts

### 步骤 3: 测试基本功能

```bash
npm run dev
```

### 步骤 4: C++/WASM编译 (在WSL中)

```bash
# 在WSL中
cd /mnt/c/Users/zjj/Desktop/resistance-sp-webshow/src/wasm
bash compile.sh
```

---

## 关键设计决策

### 与原PageRank项目的主要差异

| 维度 | PageRank项目 | Resistance-SP项目 |
|------|-------------|------------------|
| **图类型** | 有向/无向可选 | 仅无向图 |
| **输入** | 图 | 图 + s + t + v |
| **输出** | 向量(n维) | 标量(单个数值) |
| **误差指标** | L1, L2, Max Relative | Absolute, Relative |
| **参数** | alpha, iterations/walks | rmax/times |
| **数据源** | 3个预设 + 上传 | 3个预设 + 20种生成 + 上传 |

### 保持一致的风格

- ✅ 完全继承原项目的命名规范
- ✅ 使用相同的日志格式
- ✅ 保持相同的组件结构
- ✅ 使用相同的样式系统(Tailwind CSS)
- ✅ 保持相同的错误处理机制

---

## 文件结构

```
resistance-sp-webshow/
├── src/
│   ├── types/
│   │   ├── graph.ts          ✅
│   │   ├── algorithm.ts      ✅
│   │   └── worker.ts         ✅
│   ├── utils/
│   │   ├── logger.ts         ✅
│   │   ├── errorMetrics.ts   ✅
│   │   ├── graphGenerators.ts ✅
│   │   ├── graphParser.ts    ✅
│   │   └── dataLoader.ts     ✅
│   ├── algorithms/
│   │   ├── pushVSp.ts        ⏳
│   │   └── abwalkVSp.ts      ⏳
│   ├── components/
│   │   ├── Toast.tsx         ✅
│   │   ├── NodeSelector.tsx  ⏳
│   │   ├── SyntheticGraphSelector.tsx ⏳
│   │   ├── ParameterPanel.tsx ⏳
│   │   └── ResultsPanel.tsx  ⏳
│   ├── hooks/
│   │   ├── useToast.ts       ✅
│   │   └── useResistanceWorker.ts ⏳
│   ├── workers/
│   │   └── resistance.worker.ts ⏳
│   ├── wasm/
│   │   ├── resistance.cpp    ⏳
│   │   └── compile.sh        ⏳
│   ├── App.tsx               ✅
│   ├── main.tsx              ✅
│   └── index.css             ✅
├── public/
│   ├── datasets/             ✅
│   └── github-icon.svg       ✅
├── package.json              ✅
├── tsconfig.json             ✅
├── vite.config.ts            ✅
├── tailwind.config.js        ✅
└── README.md                 ⏳
```

---

## 已实现的20种图生成器

1. ✅ Planar Graph
2. ✅ Cycle Graph
3. ✅ Path Graph
4. ✅ Complete Bipartite
5. ✅ Star Graph
6. ✅ Matching
7. ✅ Random Tree
8. ✅ Lobster
9. ✅ Caterpillar
10. ✅ Grid
11. ✅ Quadrangulation
12. ✅ Partial k-tree
13. ✅ Wheel
14. ✅ Disk Intersection
15. ✅ Interval Graph
16. ✅ Ladder
17. ✅ Hypercube
18. ✅ Complete
19. ✅ Small Vertex Cover
20. ✅ Small Cutwidth

每个生成器都包含:
- 完整的TypeScript实现
- 参数验证和默认值
- 日志输出
- 与hpp文件逻辑一致

---

## 待办事项清单

### 高优先级
- [ ] 安装npm依赖
- [ ] 创建ParameterPanel组件
- [ ] 创建ResultsPanel组件
- [ ] 创建useResistanceWorker Hook
- [ ] 创建resistance.worker.ts
- [ ] 实现算法JavaScript版本

### 中优先级
- [ ] 修改C++代码支持v参数
- [ ] 编写WASM编译脚本
- [ ] 创建单元测试

### 低优先级
- [ ] 完善README文档
- [ ] 添加更多测试用例
- [ ] 性能优化

---

## 预计完成时间

- **核心功能**: 2-3小时
- **WASM集成**: 1-2小时
- **测试和文档**: 1-2小时
- **总计**: 约4-7小时

---

## 需要您做的事情

1. **立即**: 运行 `npm install` 安装依赖
2. **接下来**: 我将为您创建剩余的所有组件代码
3. **最后**: 在WSL中编译WASM模块

---

**当前进度**: 约40%完成
**下一个里程碑**: 完成所有React组件和Worker实现
