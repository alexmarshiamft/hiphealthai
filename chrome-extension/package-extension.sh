#!/bin/bash
# package-extension.sh — Creates a clean ZIP for Chrome Web Store submission

EXTENSION_DIR="$(dirname "$0")"
VERSION=$(node -p "require('$EXTENSION_DIR/manifest.json').version")
OUTPUT_ZIP="hip-health-autofill-v${VERSION}.zip"

echo "Navigating to extension directory: $EXTENSION_DIR"
cd "$EXTENSION_DIR" || exit 1

# Remove any old builds or leftover packages
rm -f "$OUTPUT_ZIP"

# Create a clean ZIP with only required Manifest V3 assets
zip -r "$OUTPUT_ZIP" manifest.json background.js content.js popup.html popup.js \
  -x "*.DS_Store" \
  -x "Thumbs.db"

echo "---------------------------------------------"
echo "Packaged extension successfully!"
echo "Package File: $EXTENSION_DIR/$OUTPUT_ZIP"
echo "Package Size: $(du -h "$OUTPUT_ZIP" | cut -f1)"
echo "---------------------------------------------"
