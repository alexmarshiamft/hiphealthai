#!/bin/bash
# deploy-extension.sh — Automates Chrome Web Store API V2 upload & publication
#
# IMPORTANT: The first upload of an extension MUST be performed manually in the 
# Chrome Web Store Developer Dashboard to register the extension ID and configurations.
# Subsequent version updates can be automated using this script.

EXTENSION_DIR="$(dirname "$0")"
ZIP_FILE="$EXTENSION_DIR/hip-health-autofill-v1.0.zip"

# Check if zip package exists
if [ ! -f "$ZIP_FILE" ]; then
  echo "Error: Zip package not found at $ZIP_FILE."
  echo "Please run './chrome-extension/package-extension.sh' first to compile the extension."
  exit 1
fi

# Required Configuration variables (Store these in your environment or CI/CD secrets)
# Do NOT hardcode secrets in this file to avoid exposure risks.
if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ] || [ -z "$REFRESH_TOKEN" ] || [ -z "$PUBLISHER_ID" ] || [ -z "$EXTENSION_ID" ]; then
  echo "=========================================================================="
  echo "             HIP HEALTH CHROME WEB STORE DEPLOYMENT SETUP"
  echo "=========================================================================="
  echo "This script automates uploads using the modern Chrome Web Store API (V2)."
  echo "To authenticate, you must set these environment variables:"
  echo ""
  echo "  export CLIENT_ID=\"your_oauth_client_id\""
  echo "  export CLIENT_SECRET=\"your_oauth_client_secret\""
  echo "  export REFRESH_TOKEN=\"your_oauth_refresh_token\""
  echo "  export PUBLISHER_ID=\"your_developer_dashboard_publisher_id\""
  echo "  export EXTENSION_ID=\"kpiiejkgojmbkdmfglbmcojjinbgenfo\""
  echo ""
  echo "Alternatively, you can grant dashboard access to a Google Cloud Service Account"
  echo "under the Developer Dashboard 'Account' settings and authorize using service keys."
  echo "=========================================================================="
  exit 1
fi

echo "Authenticating and fetching access token..."
TOKEN_RESPONSE=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "grant_type=refresh_token")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token": "[^"]*' | grep -o '[^"]*$')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Error: Failed to obtain OAuth2 access token. Please verify your credentials."
  echo "OAuth Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "Access token obtained successfully."
echo "Step 1: Uploading ZIP package to the Web Store (V2 API)..."

UPLOAD_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "x-goog-api-version: 2" \
     -X POST \
     -T "$ZIP_FILE" \
     "https://chromewebstore.googleapis.com/upload/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:upload")

echo "Upload Response: $UPLOAD_RESPONSE"

if [[ "$UPLOAD_RESPONSE" == *"uploadState\": \"SUCCESS"* ]]; then
  echo "✅ Package uploaded successfully as a new draft!"
  
  echo "Step 2: Submitting draft version for review..."
  PUBLISH_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
       -H "x-goog-api-version: 2" \
       -H "Content-Length: 0" \
       -X POST \
       "https://chromewebstore.googleapis.com/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:publish")
       
  echo "Publish Response: $PUBLISH_RESPONSE"
  echo "🎉 Extension submitted for compliance review successfully!"
else
  echo "❌ Upload failed. Please inspect the API response above."
  exit 1
fi
