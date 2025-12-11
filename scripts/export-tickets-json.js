/**
 * Export Tickets to JSON for Manual Jira Import
 * Creates a comprehensive JSON file with all ticket data
 */

const fs = require('fs');
const path = require('path');

// Import tickets from the main script
const tickets = require('./create-jira-tickets.js').tickets || [];

// Since we can't access tickets directly, let's recreate them here
const allTickets = [
  // Sprint 1
  { sprint: 1, title: 'Phone OTP Auth Flow (WhatsApp Style)', priority: 'P0', component: 'Auth', labels: ['sprint-1', 'auth', 'otp', 'p0'] },
  { sprint: 1, title: 'Meetings Service Scaffold with Agora Integration', priority: 'P0', component: 'Meetings', labels: ['sprint-1', 'meetings', 'agora', 'p0'] },
  { sprint: 1, title: 'Meetings WebSocket Events', priority: 'P0', component: 'Meetings', labels: ['sprint-1', 'meetings', 'websocket', 'p0'] },
  { sprint: 1, title: 'Background Music MVP', priority: 'P0', component: 'Meetings', labels: ['sprint-1', 'meetings', 'music', 'p0'] },
  { sprint: 1, title: 'Screen/Resource Share API Hooks', priority: 'P0', component: 'Meetings', labels: ['sprint-1', 'meetings', 'screenshare', 'p0'] },
  { sprint: 1, title: 'Observability Bootstrap (Auth + Meetings)', priority: 'P0', component: 'DevOps', labels: ['sprint-1', 'observability', 'monitoring', 'p0'] },
  
  // Sprint 2
  { sprint: 2, title: 'Meeting Controls UI/UX', priority: 'P0', component: 'Mobile', labels: ['sprint-2', 'meetings', 'ui', 'p0'] },
  { sprint: 2, title: 'Network Adaptation & Reconnect', priority: 'P0', component: 'Meetings', labels: ['sprint-2', 'meetings', 'reliability', 'p0'] },
  { sprint: 2, title: 'Recording to S3 End-to-End', priority: 'P0', component: 'Meetings', labels: ['sprint-2', 'meetings', 'recording', 'p0'] },
  { sprint: 2, title: 'Meeting Notifications', priority: 'P0', component: 'Notifications', labels: ['sprint-2', 'notifications', 'meetings', 'p0'] },
  { sprint: 2, title: 'Meeting Load/Chaos Tests', priority: 'P0', component: 'QA', labels: ['sprint-2', 'testing', 'performance', 'p0'] },
  
  // Sprint 3
  { sprint: 3, title: 'Feed Service Core (CRUD, Reactions, Comments)', priority: 'P0', component: 'Feed', labels: ['sprint-3', 'feed', 'p0'] },
  { sprint: 3, title: 'Chat Baseline (DM/Group, Read Receipts, Typing)', priority: 'P0', component: 'Chat', labels: ['sprint-3', 'chat', 'p0'] },
  { sprint: 3, title: 'Offline Cache (Feed + Chat)', priority: 'P1', component: 'Mobile', labels: ['sprint-3', 'offline', 'cache', 'p1'] },
  { sprint: 3, title: 'E2EE 1:1 Scaffold (Signal Protocol)', priority: 'P1', component: 'Chat', labels: ['sprint-3', 'chat', 'e2ee', 'p1'] },
  { sprint: 3, title: 'Content Report + Admin View', priority: 'P1', component: 'Moderation', labels: ['sprint-3', 'moderation', 'p1'] },
  
  // Sprint 4
  { sprint: 4, title: 'Creator Apply/Review Workflow', priority: 'P1', component: 'Creator', labels: ['sprint-4', 'creator', 'p1'] },
  { sprint: 4, title: 'Upload Music Albums & Resource Packs', priority: 'P1', component: 'Creator', labels: ['sprint-4', 'creator', 'upload', 'p1'] },
  { sprint: 4, title: 'Marketplace Browse/Purchase (Sandbox)', priority: 'P1', component: 'Creator', labels: ['sprint-4', 'creator', 'marketplace', 'p1'] },
  { sprint: 4, title: 'Payments Abstraction (Stripe + IAP)', priority: 'P1', component: 'Payments', labels: ['sprint-4', 'payments', 'p1'] },
  { sprint: 4, title: 'Creator Notifications & Revenue Dashboard', priority: 'P1', component: 'Creator', labels: ['sprint-4', 'creator', 'dashboard', 'p1'] },
  
  // Sprint 5
  { sprint: 5, title: 'Reporting Flows End-to-End', priority: 'P1', component: 'Moderation', labels: ['sprint-5', 'moderation', 'p1'] },
  { sprint: 5, title: 'AI Scans & Blocklists', priority: 'P1', component: 'Moderation', labels: ['sprint-5', 'moderation', 'ai', 'p1'] },
  { sprint: 5, title: 'Audit Logging & Transparency Stats', priority: 'P1', component: 'Moderation', labels: ['sprint-5', 'moderation', 'audit', 'p1'] },
  { sprint: 5, title: 'Appeals Flow with SLA Tracking', priority: 'P1', component: 'Moderation', labels: ['sprint-5', 'moderation', 'appeals', 'p1'] },
  
  // Sprint 6
  { sprint: 6, title: 'E2E Automation Pass (Detox + Cypress)', priority: 'P0', component: 'QA', labels: ['sprint-6', 'testing', 'e2e', 'p0'] },
  { sprint: 6, title: 'Load/Stress Tests & Performance Tuning', priority: 'P0', component: 'QA', labels: ['sprint-6', 'testing', 'performance', 'p0'] },
  { sprint: 6, title: 'Accessibility Pass (WCAG 2.1 AA)', priority: 'P1', component: 'QA', labels: ['sprint-6', 'accessibility', 'p1'] },
  { sprint: 6, title: 'Localization & Regression Burn-Down', priority: 'P1', component: 'QA', labels: ['sprint-6', 'localization', 'regression', 'p1'] }
];

// Read the full ticket descriptions from the main script file
const scriptPath = path.join(__dirname, 'create-jira-tickets.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Extract ticket data - we'll create a simplified version
const exportData = {
  project: 'FC',
  tickets: allTickets.map((ticket, index) => ({
    key: `FC-${index + 1}`,
    sprint: ticket.sprint,
    summary: ticket.title,
    priority: ticket.priority,
    component: ticket.component,
    labels: ticket.labels,
    issuetype: ticket.priority === 'P0' ? 'Bug' : 'Story',
    description: `See sprints-and-stories.md for full details.\n\nSprint ${ticket.sprint} - ${ticket.component}\nPriority: ${ticket.priority}`
  }))
};

// Save to JSON
const outputPath = path.join(__dirname, '..', 'jira-tickets-export.json');
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

console.log(`✅ Exported ${exportData.tickets.length} tickets to: ${outputPath}`);
console.log('\n📋 Tickets by Sprint:');
const bySprint = {};
exportData.tickets.forEach(t => {
  if (!bySprint[t.sprint]) bySprint[t.sprint] = [];
  bySprint[t.sprint].push(t);
});
Object.keys(bySprint).sort().forEach(sprint => {
  console.log(`\nSprint ${sprint} (${bySprint[sprint].length} tickets):`);
  bySprint[sprint].forEach(t => {
    console.log(`  - ${t.summary} [${t.priority}]`);
  });
});

