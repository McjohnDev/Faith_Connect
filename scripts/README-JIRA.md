# Jira Ticket Creation Script

This script creates all FaithConnect sprint tickets in Jira automatically.

## Prerequisites

1. **Jira API Token**
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Create a new API token
   - Copy the token

2. **Jira Project**
   - Ensure you have a Jira project (e.g., `FC`)
   - Note the project key

3. **Node.js**
   - Ensure Node.js is installed (v14+)

## Setup

1. **Copy the config template:**
   ```bash
   cp jira-config.json.template jira-config.json
   ```

2. **Edit `jira-config.json`:**
   ```json
   {
     "JIRA_BASE_URL": "https://mcjohndev743.atlassian.net",
     "JIRA_EMAIL": "your-email@example.com",
     "JIRA_API_TOKEN": "your-api-token-here",
     "JIRA_ORG_ID": "your-org-id-here",
     "JIRA_PROJECT_KEY": "FC",
     "JIRA_AUTH_METHOD": "bearer"
   }
   ```

   **Authentication Methods:**
   - **Bearer Token** (recommended): Set `JIRA_AUTH_METHOD: "bearer"` and provide `JIRA_API_TOKEN`
   - **Basic Auth**: Set `JIRA_AUTH_METHOD: "basic"` and provide both `JIRA_EMAIL` and `JIRA_API_TOKEN`

3. **Run the script:**
   ```bash
   node scripts/create-jira-tickets.js
   ```

## What It Creates

The script creates **30 tickets** across 6 sprints:

- **Sprint 1:** 6 tickets (Auth, Meetings, WebSocket, Music, Screen Share, Observability)
- **Sprint 2:** 5 tickets (UI, Network, Recording, Notifications, Testing)
- **Sprint 3:** 5 tickets (Feed, Chat, Offline, E2EE, Reporting)
- **Sprint 4:** 5 tickets (Creator, Uploads, Marketplace, Payments, Dashboard)
- **Sprint 5:** 4 tickets (Reporting, AI Scans, Audit, Appeals)
- **Sprint 6:** 5 tickets (E2E Tests, Performance, Accessibility, Localization)

## Ticket Structure

Each ticket includes:
- **Title:** Clear, actionable summary
- **Description:** Detailed requirements and acceptance criteria
- **Priority:** P0 (Highest) or P1 (High)
- **Labels:** sprint-X, component, feature tags
- **Component:** Auth, Meetings, Feed, Chat, Creator, Moderation, QA, DevOps, Mobile, Payments, Notifications

## Output

After running, you'll get:
- Console output with created ticket keys and URLs
- `jira-tickets-created.json` with full results

## Troubleshooting

**Error: "Jira API error: 401"**
- Check your email and API token
- Ensure the API token is active

**Error: "Project not found"**
- Verify the project key in `jira-config.json`
- Ensure you have permission to create issues in the project

**Error: "Component not found"**
- Components are optional (commented out in script)
- If your project uses components, uncomment the component assignment code

## Next Steps

After tickets are created:
1. Review tickets in Jira
2. Assign owners
3. Create sprints/boards in Jira
4. Link tickets to sprints
5. Set up epics if needed

