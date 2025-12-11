# Jira API Key Information

## API Key Details

**Key Name:** `dev`  
**User:** Mcjohn Dev  
**Email:** mcjohndev743@gmail.com  
**Organization ID:** 75d07b8b-8e2c-4730-b72e-21fd5ea895e5  
**Created:** 2025-12-10T11:00:53.960357Z  
**Expires:** 2026-01-10T11:00:22Z  
**Last Used:** No date found (new key)

## Configuration

This is a **development API key** for the FaithConnect Jira instance.

### Current Setup

- **Base URL:** https://mcjohndev743.atlassian.net
- **Project Key:** FC
- **Auth Method:** Basic Auth (email + API token)
- **Email:** mcjohndev743@gmail.com

## Authentication

For Jira Cloud API, use **Basic Authentication**:
- Username: Email address
- Password: API token

Format: `Basic base64(email:token)`

## API Key Management

- **Location:** https://id.atlassian.com/manage-profile/security/api-tokens
- **Key Type:** Personal Access Token
- **Scope:** Full access to Jira instance
- **Expiry:** 2026-01-10 (renew before expiry)

## Notes

- This is a development key - create separate keys for staging/production
- Key expires on 2026-01-10 - renew before then
- Never commit the actual API token to git
- Store securely in `jira-config.json` (already in .gitignore)

## Troubleshooting

If connection fails:
1. Verify key hasn't expired
2. Check key has proper permissions
3. Ensure email matches Jira account
4. Try regenerating key if issues persist

