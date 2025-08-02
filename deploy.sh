#!/bin/bash

# 🚀 ArmyVerse Deployment Script
# This script helps you deploy ArmyVerse to production

echo "🎵 ArmyVerse Deployment Script"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Deploy frontend to Netlify:"
    echo "   - Go to https://netlify.com"
    echo "   - Connect your GitHub repository"
    echo "   - Set build command: npm run build"
    echo "   - Set publish directory: dist"
    echo ""
    echo "2. Deploy backend to Railway:"
    echo "   - Go to https://railway.app"
    echo "   - Connect your GitHub repository"
    echo "   - Set root directory to: backend"
    echo ""
    echo "3. Set up MongoDB Atlas:"
    echo "   - Go to https://cloud.mongodb.com"
    echo "   - Create a free cluster"
    echo "   - Get your connection string"
    echo ""
    echo "4. Configure environment variables:"
    echo "   - See DEPLOYMENT.md for detailed instructions"
    echo ""
    echo "📚 For detailed instructions, see: DEPLOYMENT.md"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi 