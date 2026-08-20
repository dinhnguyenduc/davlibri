#!/bin/bash

# DAVLibri Deployment Guide
# Automated deployment scripts for Vercel (Frontend) and Render (Backend)

echo "🚀 DAVLibri Deployment Helper"
echo "=============================="

# Frontend Deployment (Vercel)
echo ""
echo "📱 Frontend Deployment (Vercel)"
echo "--------------------------------"
echo "Prerequisites:"
echo "1. Install Vercel CLI: npm i -g vercel"
echo "2. Login: vercel login"
echo "3. Link project: vercel link"
echo ""
echo "Deployment Steps:"
echo "cd client"
echo "npm run build"
echo "vercel --prod"
echo ""

# Backend Deployment (Render)
echo "🔧 Backend Deployment (Render)"
echo "------------------------------"
echo "Prerequisites:"
echo "1. Create account at https://render.com"
echo "2. Connect GitHub repository"
echo "3. Create new Web Service"
echo ""
echo "Environment Variables (Set in Render Dashboard):"
echo "  - MONGO_URI: MongoDB Atlas connection string"
echo "  - GEMINI_API_KEY: Google Gemini API key"
echo "  - JWT_SECRET: JWT secret key"
echo "  - CLOUDINARY_NAME: Cloudinary account name"
echo "  - CLOUDINARY_API_KEY: Cloudinary API key"
echo "  - CLOUDINARY_API_SECRET: Cloudinary API secret"
echo "  - VNP_SECRET_KEY: VNPay secret key"
echo "  - REACT_APP_API_URL: Backend API URL (e.g., https://your-app.onrender.com)"
echo ""
echo "Deployment Steps:"
echo "1. Push code to GitHub"
echo "2. Render auto-deploys from main branch"
echo "3. Check Logs tab for deployment status"
echo ""

# Database
echo "🗄️  Database Setup (MongoDB Atlas)"
echo "-----------------------------------"
echo "1. Go to https://www.mongodb.com/cloud/atlas"
echo "2. Create cluster in Southeast Asia (sg) region"
echo "3. Create database user"
echo "4. Get connection string"
echo "5. Update MONGO_URI in environment variables"
echo ""

# Testing
echo "✅ Pre-deployment Testing"
echo "------------------------"
echo "cd server"
echo "npm run test:vnpay          # Test VNPay integration"
echo "npm run benchmark           # Performance benchmark"
echo "npm run test:hybrid         # Hybrid search test"
echo ""

# Post-deployment
echo "🎯 Post-deployment Verification"
echo "-------------------------------"
echo "1. Check API health: curl https://your-api.onrender.com/api/health"
echo "2. Test chatbot: POST /api/chatbot/ask"
echo "3. Test search: GET /api/books/search?q=test"
echo "4. Monitor logs: Render Dashboard > Logs"
echo ""

echo "📚 Documentation"
echo "----------------"
echo "- API Docs: https://your-api.onrender.com/api/docs"
echo "- Github: https://github.com/your-username/davlibri"
echo "- Environment Template: .env.example"
echo ""
