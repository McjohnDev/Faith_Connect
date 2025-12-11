# Update Twilio Credentials

## Quick Update

Add or update these lines in `backend/services/auth-service/.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

## After Updating

1. **Restart the auth service** for changes to take effect:
   - Stop the current service (Ctrl+C)
   - Start again: `npm run dev`

2. **Test the configuration**:
   ```bash
   node scripts/test-auth-simple.js
   ```

## Security Note

✅ The `.env` file is in `.gitignore` and will NOT be committed to git.

⚠️ **Never commit** your Auth Token or any secrets to the repository!

