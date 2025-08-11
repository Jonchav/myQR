#!/bin/bash
# Build script for Render deployment

echo "Starting Render build process..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application first
echo "Building application..."
npm run build

# Run database migration if DATABASE_URL is available
if [ ! -z "$DATABASE_URL" ]; then
  echo "Running database migration..."
  npm run db:push
else
  echo "No DATABASE_URL found, skipping migration"
fi

echo "Build process completed!"