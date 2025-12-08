# ▲ Deploy Frontend to Vercel

## Quick Steps

### 1. Go to Vercel
- Visit https://vercel.com
- Sign up/login with GitHub
- Click "Add New Project"

### 2. Import Repository
- Select: `yous2911/diamond-app`
- **Root Directory**: `frontend`
- Framework: **Create React App** (auto-detected)

### 3. Configure Build
- Build Command: `npm run build`
- Output Directory: `build`
- Install Command: `npm install`

### 4. Add Environment Variable
In Vercel → Settings → Environment Variables:

```
REACT_APP_API_URL=https://your-railway-backend.up.railway.app/api
```

**Replace with your actual Railway backend URL!**

### 5. Deploy
- Click "Deploy"
- Wait 2-3 minutes
- Get your URL: `https://diamond-app.vercel.app`

---

## ✅ Done! Frontend is live!

## 🔗 After Both Are Deployed

1. **Update Railway CORS:**
   - Go to Railway → Variables
   - Set `CORS_ORIGIN` to your Vercel URL
   - Service restarts automatically

2. **Test:**
   - Visit your Vercel URL
   - Try logging in
   - Should work! 🎉

---

## 🎊 Show Your Baby!

Your app is now live and you can share it with anyone!





