#!/bin/bash

# Deployment script for bitspace-pos application
# Creates zips, uploads to server, and auto-extracts

set -e  # Exit on error

# Trap errors and exit to prevent terminal from closing immediately
cleanup_on_error() {
    exit_code=$?
    if [ $exit_code -ne 0 ]; then
        echo ""
        echo "❌ Error occurred! (Exit code: $exit_code)"
        echo "Check the output above for details."
        echo ""
        read -p "Press Enter to close..."
    fi
}

trap cleanup_on_error EXIT ERR

# Load environment variables from .env file
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "   Please create a .env file with APP_SERVER, APP_PORT, and APP_REMOTE_PATH variables."
    echo "   (Or use legacy SERVER, PORT, REMOTE_PATH variables)"
    exit 1
fi

echo "📋 Loading configuration from .env file..."
# Try to load APP_* variables first, fall back to legacy variables
export $(grep -v '^#' .env | grep -E '^(APP_|SERVER|PORT|REMOTE_PATH)' | xargs)

# Use APP_* variables if available, otherwise use legacy variables
SERVER="${APP_SERVER:-${SERVER}}"
PORT="${APP_PORT:-${PORT}}"
REMOTE_PATH="${APP_REMOTE_PATH:-${REMOTE_PATH}}"

# Validate required variables
if [ -z "$SERVER" ] || [ -z "$PORT" ] || [ -z "$REMOTE_PATH" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "   Please ensure SERVER, PORT, and REMOTE_PATH are set in .env"
    exit 1
fi

# Options
AUTO_EXTRACT=true       # Auto-extract on server
CLEANUP_REMOTE_ZIPS=true  # Remove zip files from server after extraction
CLEANUP_LOCAL_ZIPS=true   # Remove local zip files after upload

echo "🚀 Starting app deployment process..."
echo "📍 Target: ${SERVER}:${REMOTE_PATH}"
echo ""

# Step 1: Run yarn build
echo ""
echo "⚙️  Running yarn build with production config..."
cp .env.production .env.build.backup
NODE_ENV=production yarn build
echo "✓ Build complete"

# Validate required directories exist
echo ""
echo "🔍 Checking required directories..."
missing_dirs=0
for dir in .nuxt .output; do
    if [ ! -d "$dir" ]; then
        echo "  ✗ Missing: $dir"
        missing_dirs=$((missing_dirs + 1))
    else
        echo "  ✓ Found: $dir"
    fi
done

if [ $missing_dirs -gt 0 ]; then
    echo ""
    echo "❌ Error: Missing required directories after build."
    echo "   Check the output above for errors."
    exit 1
fi

# Step 2: Create zip files (excluding macOS metadata)
echo ""
echo "📦 Creating zip files..."
echo "  → Zipping .nuxt folder..."
zip -r -X -q nuxt.zip .nuxt
echo "  → Zipping .output folder..."
zip -r -X -q output.zip .output
echo "✓ Zip files created"

# Step 3: Upload to server
echo ""
echo "⬆️  Uploading to ${SERVER}..."
scp -P "${PORT}" -q nuxt.zip output.zip "${SERVER}:${REMOTE_PATH}/"
echo "  → Uploading .env.production..."
scp -P "${PORT}" -q .env.production "${SERVER}:${REMOTE_PATH}/.env"
echo "✓ Upload complete"

# Step 4: Extract on server (if enabled)
if [ "$AUTO_EXTRACT" = true ]; then
    echo ""
    echo "📂 Extracting files on server..."
    ssh -p "${PORT}" "${SERVER}" "cd ${REMOTE_PATH} && \
        unzip -o -q nuxt.zip && \
        unzip -o -q output.zip && \
        cp .env .output/.env && \
        rm -rf __MACOSX"
    echo "✓ Files extracted"

    # Step 5: Restart PM2 process
    echo ""
    echo "🔄 Configuring nostr bitos PM2 process..."
    # Check if process runs (restart), otherwise start it
    ssh -p "${PORT}" "${SERVER}" "cd ${REMOTE_PATH} && (pm2 restart bitos || pm2 start \"yarn preview -p 9009\" --name \"bitos\")"
    echo "✓ PM2 process running"

    # Cleanup remote zip files (if enabled)
    if [ "$CLEANUP_REMOTE_ZIPS" = true ]; then
        echo ""
        echo "🧹 Cleaning up remote zip files..."
        ssh -p "${PORT}" "${SERVER}" "cd ${REMOTE_PATH} && rm -f nuxt.zip output.zip"
        echo "✓ Remote cleanup complete"
    fi
fi

# Step 6: Cleanup local zip files (if enabled)
if [ "$CLEANUP_LOCAL_ZIPS" = true ]; then
    echo ""
    echo "🧹 Cleaning up local zip files..."
    rm -f nuxt.zip output.zip
    echo "✓ Local cleanup complete"
fi

echo ""
echo "✅ Deployment complete!"
echo "📍 Deployed to: ${SERVER}:${REMOTE_PATH}/"
echo ""
read -p "Press Enter to close..."
