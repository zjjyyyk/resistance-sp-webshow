# Resistance Distance WASM Compilation

本目录包含电阻距离算法的 C++/WebAssembly 实现。

## 文件说明

- `resistance.cpp` - C++ 源代码，包含 Push_v_sp 和 Abwalk_v_sp 算法
- `compile.sh` - Emscripten 编译脚本

## 编译要求

1. 安装 Emscripten SDK
   ```bash
   # 克隆 emsdk
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   
   # 安装最新版本
   ./emsdk install latest
   ./emsdk activate latest
   
   # 设置环境变量
   source ./emsdk_env.sh
   ```

2. 验证安装
   ```bash
   emcc --version
   ```

## 编译步骤

### 在 WSL 中编译

```bash
# 进入 wasm 目录
cd /mnt/c/Users/zjj/Desktop/resistance-sp-webshow/src/wasm

# 运行编译脚本
bash compile.sh
```

### 输出文件

编译成功后会在 `public/` 目录生成:
- `resistance.js` - JavaScript 加载器
- `resistance.wasm` - WebAssembly 二进制文件

## 算法说明

### Push_v_sp

Push-based 算法，使用残差阈值 `rmax` 控制精度。

**参数:**
- `n` - 节点数
- `m` - 边数
- `edgeSources` - 边的源节点数组
- `edgeTargets` - 边的目标节点数组
- `s` - 源节点
- `t` - 目标节点
- `v` - 地标节点
- `rmax` - 残差阈值

### Abwalk_v_sp

基于 v-吸收随机游走的算法。

**参数:**
- `n` - 节点数
- `m` - 边数
- `edgeSources` - 边的源节点数组
- `edgeTargets` - 边的目标节点数组
- `s` - 源节点
- `t` - 目标节点
- `v` - 地标节点
- `times` - 随机游走次数
- `seed` - 随机种子

## 与原代码的区别

原 `.hpp` 文件中的算法会自动选择度数最大的节点作为 landmark v。在这个 WASM 版本中:

1. **v 参数外部化**: v 节点作为参数传入，不再内部自动选择
2. **简化依赖**: 移除了对外部库的依赖，使用标准 C++ 库
3. **接口标准化**: 使用统一的参数接口，便于 JavaScript 调用

## 使用示例

```javascript
// 加载 WASM 模块（在 worker 中）
const Module = await loadWASM();

// 调用 Push_v_sp
const result = Module._pushVSp(
  nodes,          // n
  edges.length,   // m
  edgeSourcesPtr, // int* (WASM 内存指针)
  edgeTargetsPtr, // int* (WASM 内存指针)
  s,              // 源节点
  t,              // 目标节点
  v,              // 地标节点
  rmax            // 残差阈值
);
```

## 注意事项

1. **内存管理**: 使用 `Module._malloc` 分配内存，使用后必须 `Module._free` 释放
2. **数据类型**: 确保 JavaScript 数值类型与 C++ 一致（int32 vs double）
3. **边的方向**: 输入的边已经是双向的（无向图），无需重复添加

## 调试

如果编译失败，检查:
- Emscripten 是否正确安装和激活
- 路径是否正确
- 权限是否足够

查看详细错误信息:
```bash
bash compile.sh 2>&1 | tee compile.log
```
