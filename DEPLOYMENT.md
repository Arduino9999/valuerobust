# Deploying to Vercel

This guide explains how to deploy your Value Finder app to Vercel.

## Prerequisites

1. Install Vercel CLI globally (optional but recommended):
   ```bash
   npm install -g vercel
   ```

2. Have a Vercel account (sign up at https://vercel.com)

## Environment Variables

You need to configure the following environment variables in your Vercel project:

### Required Variables:
- `RAPIDAPI_KEY` - Your RapidAPI key for eBay Average Selling Price API
- `GEMINI_API_KEY` - Your Google Gemini API key

### Optional Variables:
- `RAPIDAPI_HOST` - Default: `ebay-average-selling-price.p.rapidapi.com`
- `GEMINI_MODEL` - Default: `gemini-1.5-flash-latest`
- `VITE_API_BASE` - Set to empty string `""` for production (API routes on same domain)

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. Navigate to your project directory:
   ```bash
   cd C:\sw\Truth\value2
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy to production:
   ```bash
   vercel --prod
   ```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time) or **Y** (subsequent deployments)
   - Project name? Accept default or enter custom name
   - In which directory is your code located? **.**

5. Set environment variables via CLI or Dashboard:
   ```bash
   vercel env add RAPIDAPI_KEY
   vercel env add GEMINI_API_KEY
   vercel env add VITE_API_BASE
   ```
   Enter the values when prompted. For `VITE_API_BASE`, enter an empty string.

6. Redeploy after adding environment variables:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new

2. Import your Git repository (GitHub, GitLab, or Bitbucket)
   - If your code isn't in Git yet, initialize a repository:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin <your-repo-url>
     git push -u origin main
     ```

3. Configure your project:
   - Framework Preset: **Other**
   - Root Directory: **.**
   - Build Command: Will use settings from vercel.json
   - Output Directory: Will use settings from vercel.json

4. Add Environment Variables:
   - Click "Environment Variables"
   - Add each variable:
     - `RAPIDAPI_KEY`: Your RapidAPI key
     - `GEMINI_API_KEY`: Your Gemini API key
     - `RAPIDAPI_HOST`: `ebay-average-selling-price.p.rapidapi.com`
     - `GEMINI_MODEL`: `gemini-1.5-flash-latest`
     - `VITE_API_BASE`: (leave empty)

5. Click **Deploy**

## Project Structure

The deployment configuration includes:

- `/api/*` - Serverless functions for backend API
  - `/api/healthz.js` - Health check endpoint
  - `/api/identify.js` - Image identification endpoint
  - `/api/sold.js` - eBay sold items search endpoint

- `/ui/*` - React frontend (built with Vite)
  - Built output served as static files from `ui/dist`

- `vercel.json` - Vercel configuration
  - Routes `/api/*` to serverless functions
  - Routes all other requests to frontend

## Post-Deployment

1. Your app will be available at `https://your-project-name.vercel.app`

2. Test the following endpoints:
   - Health check: `https://your-project-name.vercel.app/api/healthz`
   - Frontend: `https://your-project-name.vercel.app`

3. Check deployment logs in Vercel Dashboard if you encounter issues

## Troubleshooting

### Build Failures
- Check Vercel build logs for specific errors
- Ensure all dependencies are in package.json
- Verify environment variables are set correctly

### API Errors
- Check Function logs in Vercel Dashboard
- Verify API keys are correct and have proper permissions
- Check CORS settings if needed

### Frontend Not Loading
- Verify the build completed successfully
- Check that `VITE_API_BASE` is set correctly (empty for production)
- Clear browser cache and try again

## Local Development

Continue using your existing development workflow:

```bash
npm run dev
```

This runs both the Express server (on port 4000) and Vite dev server (on port 5173).

## Updates and Redeployments

### Via CLI:
```bash
vercel --prod
```

### Via Git:
If connected to Git repository, pushing to your main branch will automatically trigger a deployment.

## Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Follow DNS configuration instructions
