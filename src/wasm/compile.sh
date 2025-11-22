#!/bin/bash

# Compile script for Resistance Distance WebAssembly module
# This script compiles the C++ code to WASM using Emscripten

echo "Compiling Resistance Distance algorithms to WebAssembly..."

# Check if emcc is available
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten not found. Please install Emscripten first."
    echo "Visit: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Compile with Emscripten
emcc resistance.cpp \
    -o ../../public/resistance.js \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS='["_pushVSp", "_abwalkVSp", "_malloc", "_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "setValue", "getValue"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='createResistanceModule' \
    -O3 \
    --no-entry

echo "Compilation complete!"
echo "Output files:"
echo "  - ../../public/resistance.js"
echo "  - ../../public/resistance.wasm"
