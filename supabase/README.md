# Supabase Configuration for Email Forwarding

This directory contains Supabase Edge Functions for custom email sending with professional templates.

## Setup Instructions

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link to Your Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Your project ref is: `quintjtreswyjxxogcjt`

### 4. Set Environment Variables
```bash
# Set secrets for the Edge Function
supabase secrets set RESEND_API_KEY=your_actual_resend_api_key_here
supabase secrets set APP_URL=http://localhost:3000
```

### 5. Deploy the Edge Function
```bash
supabase functions deploy send-verification-email
```

### 6. Test the Function
```bash
supabase functions invoke send-verification-email --data '{"email":"test@example.com","token":"test-token","type":"verification"}'
```

## Email Templates

The Edge Function includes two professional email templates:

1. **Email Verification** - Sent during user registration
2. **Password Reset** - Sent when users request password reset

Both templates feature:
- GSPA branding and colors
- Responsive design
- Security notices
- Clear call-to-action buttons
- Fallback text links

## Environment Variables Required

### In Supabase Secrets (for Edge Functions):
- `RESEND_API_KEY` - Your Resend API key
- `APP_URL` - Your application URL (http://localhost:3000 for development)

### In Your .env.local (for Next.js app):
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for Edge Functions

## How It Works

1. User registers → `sendVerificationEmail()` called
2. Function invokes Supabase Edge Function `send-verification-email`
3. Edge Function generates HTML email with custom template
4. Email sent via Resend API
5. User receives professional branded email

## Troubleshooting

### Function Not Found
- Make sure the function is deployed: `supabase functions list`
- Check function logs: `supabase functions logs send-verification-email`

### Email Not Sending
- Verify RESEND_API_KEY is set correctly
- Check Resend dashboard for API key validity
- Ensure domain is verified in Resend (for production)

### CORS Issues
- Edge Functions automatically handle CORS
- Make sure your Supabase URL is correct

## Production Deployment

For production:

1. **Verify Domain in Resend:**
   - Add your domain to Resend
   - Add DNS records as instructed

2. **Update Environment Variables:**
   - Set `APP_URL` to your production domain
   - Ensure all secrets are set in Supabase dashboard

3. **Redeploy Function:**
   ```bash
   supabase functions deploy send-verification-email --project-ref your-prod-project-ref
   ```

## File Structure

```
supabase/
├── functions/
│   └── send-verification-email/
│       └── index.ts              # Edge Function code
└── README.md                     # This file
```

## Support

If you encounter issues:
1. Check Supabase function logs
2. Verify all environment variables are set
3. Test with the invoke command above
4. Check Resend dashboard for delivery status