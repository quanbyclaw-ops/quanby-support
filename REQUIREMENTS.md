# Quanby Support Ticketing System
## support.quanbyit.com

### Architecture
- **Framework:** Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Database:** PostgreSQL (existing VPS, user: postgres)
- **ORM:** Prisma
- **Auth:** NextAuth.js (credentials + email magic link)
- **Email:** Nodemailer (SMTP)
- **Host:** VPS 187.127.98.142, Port 3003
- **Service:** quanby-support.service (systemd)
- **Nginx:** support.quanbyit.com → localhost:3003
- **SSL:** Cloudflare + existing self-signed cert

### Database: quanby_support

### User Roles
1. **Client User** — Submit tickets, track status, view own history
2. **Support Agent** — View assigned tickets, update status, add notes
3. **Manager** — View all tickets, reassign, SLA reports, manage agents
4. **Admin** — Full access, manage clients/orgs, system config

### SLA Tiers (from DAP TOR-02/03)
| Severity | Response Time | Resolution Time |
|----------|--------------|-----------------|
| Critical | 1 hour (24/7) | 24-48 hours |
| High | 4 business hours | 3-5 business days |
| Medium | 8 business hours | Next minor release |
| Low | 1 business day | Next major release |

### Core Features
1. **Ticket Management**
   - Create ticket (title, description, severity, category, attachments)
   - Auto-assign ticket number (QS-YYYY-NNNN)
   - Status workflow: Open → In Progress → Pending Client → Resolved → Closed
   - Internal notes (agent-only) vs public replies
   - File attachments (screenshots, docs)
   - Ticket history/timeline

2. **SLA Engine**
   - Auto-start SLA timer on ticket creation
   - Track response time (first reply) and resolution time
   - SLA breach warnings (yellow at 75%, red at 100%)
   - Auto-escalation on breach
   - Business hours calculation (9AM-5PM Mon-Fri PHT, except Critical)
   - SLA pause when status = Pending Client

3. **Client Portal**
   - Submit new ticket
   - View own tickets with status
   - Reply to tickets
   - Knowledge base / FAQ

4. **Admin Dashboard**
   - Ticket overview (open, in progress, resolved, breached)
   - SLA compliance percentage
   - Agent workload distribution
   - Response/resolution time averages
   - Filter by client org, severity, status, date

5. **Multi-Tenant**
   - Organizations (DAP, PCO, etc.)
   - Each org sees only their tickets
   - Org-specific SLA configs possible

6. **Notifications**
   - Email on ticket creation, status change, new reply
   - SLA breach alert to manager
   - Daily digest for agents (open tickets summary)

7. **Knowledge Base**
   - FAQ articles organized by category
   - Search functionality
   - Reduce repeat tickets

### Pages
- `/` — Landing page (login/register)
- `/dashboard` — Role-based dashboard
- `/tickets` — Ticket list (filtered by role)
- `/tickets/new` — Create ticket
- `/tickets/[id]` — Ticket detail + conversation
- `/knowledge` — Knowledge base / FAQ
- `/admin/users` — User management
- `/admin/organizations` — Org management
- `/admin/sla` — SLA configuration
- `/admin/reports` — SLA compliance reports
- `/settings` — Profile, password, notifications

### Seed Data
- Orgs: DAP, PCO, Internal
- Users: Admin (michael@quanbyai.com), Agent x2, Client x2
- Sample tickets: 5 across severities
- FAQ articles: 5 common items
