#!/bin/bash

echo "🚀 Building AGG MVP for production..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build

echo "✅ Build complete!"
echo "📁 Frontend files are in: frontend/dist/"
echo "🔧 Backend is ready in: backend/"
echo ""
echo "📋 Next steps:"
echo "1. Deploy backend to Render.com"
echo "2. Deploy frontend/dist to Netlify or Vercel"
echo "3. Update API URLs in production environment"