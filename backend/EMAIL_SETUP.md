# Email Routes Setup

## Important: JSX Support Required

The email routes use JSX templates which require `tsx` to run. **You MUST use `npm run dev` or `npm start`** (not plain `node`).

## Quick Setup

1. **Install dependencies** (if not already done):
   ```bash
   cd backend
   npm install
   ```

2. **Start the server** (this uses `tsx` which handles JSX):
   ```bash
   npm run dev
   ```
   
   OR for production:
   ```bash
   npm start
   ```

3. **Verify routes are working**:
   - Check server console for: `✅ Email routes registered`
   - Test: `GET http://localhost:5000/api/emails` should return route info

## Routes Available

- `POST /api/emails/contact` - Contact form
- `POST /api/emails/inquiry` - Virtual office inquiry  
- `POST /api/emails/schedule` - Meeting schedule request

## Environment Setup

**Required: Add RESEND_API_KEY to backend/.env**

1. Get your Resend API key:
   - Go to https://resend.com/api-keys
   - Sign up or log in
   - Create a new API key
   - Copy the key (starts with `re_`)

2. Add to `backend/.env`:
   ```bash
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

3. Restart the backend server after adding the key

## Troubleshooting

**If you see "Email service is not configured" errors:**
- ✅ Check that `RESEND_API_KEY` is in `backend/.env` (not commented out)
- ✅ Make sure there are no spaces around the `=` sign
- ✅ Restart the backend server after adding/updating the key
- ✅ Check server console on startup for "✅ Resend initialized successfully"

**If you see "Route not found" errors:**
- ✅ Make sure you're using `npm run dev` or `npm start` (uses tsx)
- ❌ Do NOT use `node server.js` directly (won't handle JSX)
- ✅ Check server console for route registration messages
- ✅ Verify `tsx` is installed: `npm list tsx`

**If routes fail to load:**
- Check for import errors in server console
- Verify `RESEND_API_KEY` is set in `backend/.env`
- Check that all dependencies are installed: `npm install`
