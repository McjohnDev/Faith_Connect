# Quick Setup: Create Jira Tickets

## Step 1: Get Your Jira API Token

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **"Create API token"**
3. Give it a name (e.g., "FaithConnect Ticket Creator")
4. Copy the token (you'll only see it once!)

## Step 2: Configure

```bash
# Copy the template
cp jira-config.json.template jira-config.json

# Edit with your details
# Windows: notepad jira-config.json
# Mac/Linux: nano jira-config.json
```

Fill in:
- `JIRA_EMAIL`: Your Atlassian account email
- `JIRA_API_TOKEN`: The token you just created
- `JIRA_PROJECT_KEY`: Your Jira project key (e.g., "FC")

## Step 3: Run

```bash
node scripts/create-jira-tickets.js
```

## What You'll See

The script will:
1. Create 30 tickets across 6 sprints
2. Show progress in real-time
3. Display ticket keys and URLs
4. Save results to `jira-tickets-created.json`

## Example Output

```
🚀 Starting Jira ticket creation...

📋 Project: FC
🌐 Base URL: https://mcjohndev743.atlassian.net

Creating: Phone OTP Auth Flow (WhatsApp Style)...
✅ Created: FC-1 - Phone OTP Auth Flow (WhatsApp Style)
   https://mcjohndev743.atlassian.net/browse/FC-1

...

📊 SUMMARY
============================================================
✅ Created: 30
❌ Failed: 0
```

## Next Steps After Creation

1. **Review tickets** in Jira
2. **Create Sprints** in Jira (Sprint 1-6)
3. **Assign tickets** to sprints
4. **Assign owners** to tickets
5. **Set up board** if needed

## Troubleshooting

**401 Unauthorized?**
- Double-check email and API token
- Make sure token is active

**Project not found?**
- Verify project key matches your Jira project
- Ensure you have "Create Issues" permission

**Need help?**
- Check `scripts/README-JIRA.md` for detailed docs

