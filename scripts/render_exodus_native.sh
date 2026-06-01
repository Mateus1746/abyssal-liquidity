#!/bin/bash

# Render Exodus Native Script
# Migrates project to Nexus high-performance Rust-based rendering system
# Uses binary pipe to nexus_renderizador to eliminate disk I/O

set -e

# Setup paths
PROJECT_ROOT="$(pwd)"
EXPORTS_DIR="$PROJECT_ROOT/exports"
NEXUS_BIN_PATH="/home/mateus/.gemini/projetos/nexus_renderizador/target/release/nexus_renderizador"

# Fallback if the path doesn't exist (e.g. standard installation)
if [ ! -f "$NEXUS_BIN_PATH" ]; then
    NEXUS_BIN_PATH="nexus_renderizador"
fi

# Ensure exports directory exists
mkdir -p "$EXPORTS_DIR"

echo "======================================================"
echo " Starting Nexus-Exodus Native Render Pipeline"
echo "======================================================"
echo "Output Directory: $EXPORTS_DIR"
echo "Renderer Binary: $NEXUS_BIN_PATH"
echo "Backend: WGPU (Rust GPU Compiler)"
echo "Text Renderer: Glyphon"
echo "Mode: Binary Pipe (No Disk I/O)"
echo "======================================================"

# Send scene data via binary pipe directly to the renderer
# This eliminates intermediate disk I/O
cat << 'EOF' | "$NEXUS_BIN_PATH" \
    --mode native \
    --backend wgpu \
    --text-system glyphon \
    --output-dir "$EXPORTS_DIR" \
    --pipe-input true \
    --optimize-gpu
{
    "scene": "nexus-exodus",
    "resolution": {
        "width": 3840,
        "height": 2160
    },
    "fps": 60,
    "quality": "ultra",
    "engine": "rust-gpu"
}
EOF

if [ $? -eq 0 ]; then
    echo "======================================================"
    echo " Render Completed Successfully!"
    echo " Artifacts saved directly to: $EXPORTS_DIR"
    echo "======================================================"
else
    echo "======================================================"
    echo " Warning: Render pipeline exited with non-zero status"
    echo " Note: In standard environments without nexus_renderizador,"
    echo " this is expected."
    echo "======================================================"
fi
