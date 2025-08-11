#!/bin/bash
# Build script for Render deployment

echo "Starting Render build process..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/ node_modules/.cache

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application first
echo "Building application..."
npm run build

# Test the build
echo "Testing build..."
node -e "import('./dist/index.js').then(() => console.log('Build test passed')).catch(e => { console.error('Build test failed:', e.message); process.exit(1); })"

# Run database migration if DATABASE_URL is available
if [ ! -z "$DATABASE_URL" ]; then
  echo "Running database migration..."
  npm run db:push
else
  echo "No DATABASE_URL found, skipping migration"
fi

echo "Build process completed successfully!"