# Jira Connection Troubleshooting

## Current Issue: Connection Timeout

The script is timing out when trying to connect to Jira. This is typically a network/firewall issue.

## Solutions

### 1. Use Basic Auth (Recommended)

Jira Cloud API requires **Basic Auth** (email + API token), not Bearer tokens.

**Update `jira-config.json`:**
```json
{
  "JIRA_BASE_URL": "https://mcjohndev743.atlassian.net",
  "JIRA_EMAIL": "your-email@example.com",
  "JIRA_API_TOKEN": "ATCTT3xFfGN0...",
  "JIRA_ORG_ID": "75d07b8b-8e2c-4730-b72e-21fd5ea895e5",
  "JIRA_PROJECT_KEY": "FC",
  "JIRA_AUTH_METHOD": "basic"
}
```

**Get your email:**
- The email associated with your Atlassian account
- Same email you use to log into Jira

### 2. Network/Firewall Issues

If you're behind a corporate firewall:

**Option A: Use a VPN**
- Connect to VPN and try again

**Option B: Configure Proxy**
- If you need a proxy, update the script to use proxy settings

**Option C: Try from Different Network**
- Try from home network or mobile hotspot

### 3. Test Connection First

Run the test script:
```bash
node scripts/test-jira-connection.js
```

This will show:
- ✅ If connection works
- ❌ Specific error (auth, network, etc.)

### 4. Verify API Token

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Verify your token is active
3. Create a new token if needed

### 5. Check Jira URL

Verify the Jira URL is correct:
- Should be: `https://mcjohndev743.atlassian.net`
- Try accessing it in a browser first

## Next Steps

1. **Add your email** to `jira-config.json` and set `JIRA_AUTH_METHOD: "basic"`
2. **Run test**: `node scripts/test-jira-connection.js`
3. **If test passes**, run: `node scripts/create-jira-tickets.js`

## Alternative: Manual Creation

If network issues persist, you can:
1. Export ticket data to JSON
2. Use Jira's bulk import feature
3. Or create tickets manually using the ticket list in `sprints-and-stories.md`

