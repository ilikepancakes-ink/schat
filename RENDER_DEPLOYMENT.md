# Deploying SchoolChat to Render

This guide will help you deploy SchoolChat to Render.com, a modern cloud platform that's perfect for Next.js applications.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **Supabase Project**: Set up your database at [supabase.com](https://supabase.com)
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Prepare Your Supabase Database

1. Create a new Supabase project
2. Go to the SQL Editor and run the database schema:

```sql
-- Copy the contents from database/schema.sql and run it
-- This creates the users, messages, and other required tables
```

3. Note down these values from your Supabase project settings:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon/Public Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Service Role Key (SUPABASE_SERVICE_ROLE_KEY)

## Step 2: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   - **Name**: `schoolchat` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Start with "Starter" (free tier)

3. **Set Environment Variables**:
   Add these environment variables in the Render dashboard:

   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-key-32-chars-minimum
   ENCRYPTION_KEY=your_32_character_encryption_key_here
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
   ```

   **Important**: 
   - Generate a strong JWT_SECRET (32+ characters)
   - Generate a strong ENCRYPTION_KEY (exactly 32 characters)
   - Replace `your-app-name` with your actual Render service name

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

### Option B: Using render.yaml (Infrastructure as Code)

1. The repository includes a `render.yaml` file for automatic deployment
2. In your Render dashboard, create a new "Blueprint" and connect your repository
3. Render will read the `render.yaml` and set up the service automatically
4. You'll still need to manually set the Supabase environment variables

## Step 3: Configure Your Application

1. **Update CORS Settings in Supabase**:
   - Go to your Supabase project settings
   - Navigate to API → CORS
   - Add your Render URL: `https://your-app-name.onrender.com`

2. **Test the Deployment**:
   - Visit your Render URL
   - Check the health endpoint: `https://your-app-name.onrender.com/api/health`
   - Register a test user account

3. **Create Admin User**:
   - Register a user account through the web interface
   - Go to your Supabase dashboard → Table Editor → users
   - Find your user and set `is_admin` to `true`
   - The user will now have admin privileges

## Step 4: Production Configuration

### Security Settings

1. **Environment Variables Security**:
   - Never commit real secrets to your repository
   - Use Render's environment variable management
   - Rotate secrets regularly

2. **Supabase Security**:
   - Enable Row Level Security (RLS) on all tables
   - Configure proper CORS settings
   - Set up database backups

3. **Application Security**:
   - The app includes built-in rate limiting
   - All inputs are validated and sanitized
   - Messages are encrypted before storage

### Performance Optimization

1. **Render Plan**:
   - Start with the free "Starter" plan
   - Upgrade to "Standard" for better performance and no sleep mode
   - Consider "Pro" for high-traffic applications

2. **Database Performance**:
   - Monitor your Supabase usage
   - Consider upgrading Supabase plan for better performance
   - Set up database indexes for better query performance

## Step 5: Monitoring and Maintenance

### Health Monitoring

- Use the built-in health check: `/api/health`
- Monitor application logs in Render dashboard
- Set up alerts for downtime or errors

### Updates and Maintenance

1. **Automatic Deployments**:
   - Render automatically deploys when you push to your main branch
   - You can disable auto-deploy if you prefer manual deployments

2. **Database Migrations**:
   - Run any database changes through Supabase SQL editor
   - Test changes in a staging environment first

3. **Security Updates**:
   - Keep dependencies updated: `npm audit fix`
   - Monitor for security advisories
   - Update Node.js version as needed

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Environment Variable Issues**:
   - Double-check all environment variables are set
   - Ensure no typos in variable names
   - Check that Supabase keys are correct

3. **Database Connection Issues**:
   - Verify Supabase URL and keys
   - Check CORS settings in Supabase
   - Ensure database schema is properly set up

4. **Application Errors**:
   - Check application logs in Render
   - Use the health endpoint to diagnose issues
   - Verify all required tables exist in Supabase

### Getting Help

- Check Render documentation: [render.com/docs](https://render.com/docs)
- Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Application health check: `https://your-app.onrender.com/api/health`

## Cost Considerations

### Render Pricing
- **Starter Plan**: Free (with limitations - app sleeps after inactivity)
- **Standard Plan**: $7/month (no sleep, better performance)
- **Pro Plan**: $25/month (high performance, priority support)

### Supabase Pricing
- **Free Tier**: Good for development and small applications
- **Pro Plan**: $25/month (better performance, more storage)

### Total Monthly Cost
- **Development**: Free (Render Starter + Supabase Free)
- **Production**: $7-32/month (depending on plans chosen)

## Next Steps

1. Deploy your application following this guide
2. Test all functionality thoroughly
3. Set up monitoring and alerts
4. Plan for scaling as your user base grows
5. Consider setting up a staging environment for testing changes

Your SchoolChat application should now be running securely on Render with all features working, including real-time messaging, admin controls, and message encryption!
