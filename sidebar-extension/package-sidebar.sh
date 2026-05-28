#!/bin/bash
# package-sidebar.sh — Creates a clean ZIP for the injected sidebar extension

DIR="$(dirname "$0")"
cd "$DIR" || exit 1

OUTPUT_ZIP="hip-health-injected-sidebar-v1.0.zip"

rm -f "$OUTPUT_ZIP"

zip -r "$OUTPUT_ZIP" manifest.json background.js content.js \
  -x "*.DS_Store" \
  -x "Thumbs.db"

echo "---------------------------------------------"
echo "Sidebar Extension packaged successfully!"
echo "Package File: $DIR/$OUTPUT_ZIP"
echo "Package Size: $(du -h "$OUTPUT_ZIP" | cut -f1)"
echo "---------------------------------------------"
