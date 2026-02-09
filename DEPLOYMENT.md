# 🚀 Quick Deployment Guide

## Prerequisites
- ✅ Code is error-free and builds successfully
- ✅ GitHub account
- ✅ MongoDB Atlas account (free tier)
- ✅ Vercel account (free tier)

## Quick Start (15 minutes)

### 1. MongoDB Atlas Setup
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create FREE M0 cluster
3. Add database user with password
4. Allow access from anywhere (0.0.0.0/0)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/student_engagement_db
   ```

### 2. Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/student-engagement-app.git
git push -u origin main
```

### 4. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your repository
4. Add environment variables:
   - `DATABASE_URL`: Your MongoDB connection string
   - `JWT_SECRET`: Your generated secret
   - `NODE_ENV`: `production`
5. Click "Deploy"

### 5. Test
Visit your deployed URL (e.g., `https://your-app.vercel.app`) and test:
- User registration
- Login
- Create project
- Add tasks
- Submit feedback

## Detailed Guide
See [full deployment guide](../../../.gemini/antigravity/brain/af69f6f6-cc74-40cd-91f7-10a2c4f72b51/deployment_guide.md) for:
- Troubleshooting
- Custom domains
- Monitoring
- Best practices
- Security tips

## Support
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- MongoDB Atlas: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)

🎉 **Your app will be live in ~15 minutes!**
