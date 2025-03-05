#!/bin/bash

# 设置错误时退出
set -e

# 检查输入文件
if [ -z "$1" ]; then
    echo "请提供1024x1024的PNG图标文件"
    echo "用法: ./make-icns.sh icon_1024x1024.png"
    exit 1
fi

# 检查文件是否存在
if [ ! -f "$1" ]; then
    echo "错误: 文件 '$1' 不存在"
    exit 1
fi

# 检查是否为PNG文件
if [[ ! $(file -b --mime-type "$1") == "image/png" ]]; then
    echo "错误: 文件必须是PNG格式"
    exit 1
fi

# 获取图片尺寸
width=$(sips -g pixelWidth "$1" | tail -n1 | awk '{print $2}')
height=$(sips -g pixelHeight "$1" | tail -n1 | awk '{print $2}')

# 检查图片尺寸
if [ "$width" -ne 1024 ] || [ "$height" -ne 1024 ]; then
    echo "错误: 图片尺寸必须是 1024x1024 像素"
    echo "当前尺寸: ${width}x${height}"
    exit 1
fi

# 确保resources/icons目录存在
mkdir -p resources/icons

echo "开始生成图标..."

# 创建临时iconset目录
mkdir icon.iconset

# 生成不同尺寸的图标
echo "正在生成不同尺寸的图标..."
sips -z 16 16     "$1" --out icon.iconset/icon_16x16.png
sips -z 32 32     "$1" --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     "$1" --out icon.iconset/icon_32x32.png
sips -z 64 64     "$1" --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   "$1" --out icon.iconset/icon_128x128.png
sips -z 256 256   "$1" --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   "$1" --out icon.iconset/icon_256x256.png
sips -z 512 512   "$1" --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   "$1" --out icon.iconset/icon_512x512.png
sips -z 1024 1024 "$1" --out icon.iconset/icon_512x512@2x.png

echo "正在转换为icns格式..."
# 转换为icns文件
iconutil -c icns icon.iconset

# 检查是否成功生成icns文件
if [ ! -f "icon.icns" ]; then
    echo "错误: 生成icns文件失败"
    rm -rf icon.iconset
    exit 1
fi

# 移动生成的icns文件到resources/icons目录
mv icon.icns resources/icons/

# 清理临时文件
rm -rf icon.iconset

echo "✅ 成功生成图标文件: resources/icons/icon.icns"
echo "提示: 请确保图标清晰可见，没有模糊或变形" 