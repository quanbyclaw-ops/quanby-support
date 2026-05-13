import { NextResponse } from 'next/server'

// TODO: Implement Google OAuth 2.0 flow
// Steps for future implementation:
// 1. Redirect to https://accounts.google.com/o/oauth2/v2/auth with client_id, redirect_uri, scope, state
// 2. Handle callback at /api/auth/google/callback
// 3. Exchange code for tokens via https://oauth2.googleapis.com/token
// 4. Fetch user profile from https://www.googleapis.com/oauth2/v2/userinfo
// 5. Upsert user in DB (match by email, create if new with isActive: true for Google-verified accounts)
// 6. Set auth cookie and redirect to /dashboard
// Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

export async function GET() {
  return NextResponse.redirect(
    new URL('/?error=google_sso_coming_soon', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
  )
}
