import { PrismaClient, UserRole, Severity, TicketStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Organizations
  const dap = await prisma.organization.upsert({
    where: { slug: 'dap' },
    update: {},
    create: { name: 'Development Academy of the Philippines', slug: 'dap', domain: 'dap.edu.ph', isActive: true }
  })
  const pco = await prisma.organization.upsert({
    where: { slug: 'pco' },
    update: {},
    create: { name: 'Presidential Communications Office', slug: 'pco', domain: 'pco.gov.ph', isActive: true }
  })
  const internal = await prisma.organization.upsert({
    where: { slug: 'internal' },
    update: {},
    create: { name: 'Quanby IT Solutions', slug: 'internal', domain: 'quanbyit.com', isActive: true }
  })

  // SLA Defaults
  const slaDefaults = [
    { severity: Severity.CRITICAL, responseMinutes: 60, resolutionMinutes: 1440, is24x7: true },
    { severity: Severity.HIGH, responseMinutes: 240, resolutionMinutes: 2400, is24x7: false },
    { severity: Severity.MEDIUM, responseMinutes: 480, resolutionMinutes: 14400, is24x7: false },
    { severity: Severity.LOW, responseMinutes: 480, resolutionMinutes: 28800, is24x7: false },
  ]
  // Create SLA configs for each org
  const allOrgs = [dap, pco, internal]
  for (const org of allOrgs) {
    for (const sla of slaDefaults) {
      await prisma.slaConfig.upsert({
        where: { organizationId_severity: { organizationId: org.id, severity: sla.severity } },
        update: {},
        create: { ...sla, organizationId: org.id }
      })
    }
  }

  // Users
  const adminHash = await bcrypt.hash('Admin@2026!', 10)
  const agentHash = await bcrypt.hash('Agent@2026!', 10)
  const clientHash = await bcrypt.hash('Client@2026!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'michael@quanbyai.com' },
    update: {},
    create: { email: 'michael@quanbyai.com', name: 'Michael Cruz', passwordHash: adminHash, role: UserRole.ADMIN, organizationId: internal.id }
  })
  const agent1 = await prisma.user.upsert({
    where: { email: 'anna.reyes@quanbyit.com' },
    update: {},
    create: { email: 'anna.reyes@quanbyit.com', name: 'Anna Reyes', passwordHash: agentHash, role: UserRole.AGENT, organizationId: internal.id }
  })
  const agent2 = await prisma.user.upsert({
    where: { email: 'juan.dela.cruz@quanbyit.com' },
    update: {},
    create: { email: 'juan.dela.cruz@quanbyit.com', name: 'Juan Dela Cruz', passwordHash: agentHash, role: UserRole.AGENT, organizationId: internal.id }
  })
  const manager = await prisma.user.upsert({
    where: { email: 'maria.santos@quanbyit.com' },
    update: {},
    create: { email: 'maria.santos@quanbyit.com', name: 'Maria Santos', passwordHash: agentHash, role: UserRole.MANAGER, organizationId: internal.id }
  })
  const client1 = await prisma.user.upsert({
    where: { email: 'jose.ramos@dap.edu.ph' },
    update: {},
    create: { email: 'jose.ramos@dap.edu.ph', name: 'Jose Ramos', passwordHash: clientHash, role: UserRole.CLIENT, organizationId: dap.id }
  })
  const client2 = await prisma.user.upsert({
    where: { email: 'lisa.mendoza@pco.gov.ph' },
    update: {},
    create: { email: 'lisa.mendoza@pco.gov.ph', name: 'Lisa Mendoza', passwordHash: clientHash, role: UserRole.CLIENT, organizationId: pco.id }
  })

  const now = new Date()
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000)
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000)

  // Sample Tickets
  const tickets = [
    {
      ticketNumber: 'QS-2026-0001',
      title: 'Cannot access HRIS Module after system update',
      description: 'After the latest system update deployed on May 10, users in our HR department are unable to login to the HRIS module. Error message: "Session token invalid". This is affecting all 45 HR staff and blocking payroll processing.',
      status: TicketStatus.IN_PROGRESS,
      severity: Severity.CRITICAL,
      category: 'System Access',
      organizationId: dap.id,
      submittedById: client1.id,
      assignedToId: agent1.id,
      slaDeadlineResponse: hoursAgo(2),
      slaDeadlineResolution: hoursFromNow(8),
      firstResponseAt: hoursAgo(3),
      slaBreached: false,
    },
    {
      ticketNumber: 'QS-2026-0002',
      title: 'Performance Dashboard loading slowly',
      description: 'The KPI dashboard takes over 30 seconds to load during peak hours (9AM-11AM). Users are experiencing timeouts. This affects daily reporting for management.',
      status: TicketStatus.OPEN,
      severity: Severity.HIGH,
      category: 'Performance',
      organizationId: pco.id,
      submittedById: client2.id,
      assignedToId: agent2.id,
      slaDeadlineResponse: hoursFromNow(2),
      slaDeadlineResolution: hoursFromNow(48),
      slaBreached: false,
    },
    {
      ticketNumber: 'QS-2026-0003',
      title: 'PDF export feature not working',
      description: 'When clicking "Export to PDF" in the reports module, the download never starts. No error message is shown. Tested on Chrome and Firefox.',
      status: TicketStatus.PENDING_CLIENT,
      severity: Severity.MEDIUM,
      category: 'Bug Report',
      organizationId: dap.id,
      submittedById: client1.id,
      assignedToId: agent1.id,
      slaDeadlineResponse: hoursAgo(24),
      slaDeadlineResolution: hoursFromNow(72),
      firstResponseAt: hoursAgo(20),
      slaPausedAt: hoursAgo(5),
      slaBreached: false,
    },
    {
      ticketNumber: 'QS-2026-0004',
      title: 'Request to add new user account for onboarding batch',
      description: 'We have 12 new employees starting June 1. Please create accounts for them in the system. I will send the list via email.',
      status: TicketStatus.RESOLVED,
      severity: Severity.LOW,
      category: 'Account Management',
      organizationId: pco.id,
      submittedById: client2.id,
      assignedToId: agent2.id,
      slaDeadlineResponse: hoursAgo(48),
      slaDeadlineResolution: hoursAgo(24),
      firstResponseAt: hoursAgo(47),
      resolvedAt: hoursAgo(24),
      slaBreached: false,
    },
    {
      ticketNumber: 'QS-2026-0005',
      title: 'SLA breach - Database backup job failure',
      description: 'Automated nightly backup job has been failing for 3 consecutive days. Alert was triggered but not escalated. Backup files for May 10, 11, 12 are missing.',
      status: TicketStatus.IN_PROGRESS,
      severity: Severity.CRITICAL,
      category: 'Infrastructure',
      organizationId: internal.id,
      submittedById: admin.id,
      assignedToId: agent1.id,
      slaDeadlineResponse: hoursAgo(5),
      slaDeadlineResolution: hoursAgo(2),
      firstResponseAt: hoursAgo(4),
      slaBreached: true,
    },
  ]

  const createdTickets: any[] = []
  for (const t of tickets) {
    const existing = await prisma.ticket.findUnique({ where: { ticketNumber: t.ticketNumber } })
    if (!existing) {
      const ticket = await prisma.ticket.create({ data: t as any })
      createdTickets.push(ticket)
    } else {
      createdTickets.push(existing)
    }
  }

  // Replies for ticket 1
  const t1 = createdTickets[0]
  const existing1 = await prisma.ticketReply.findFirst({ where: { ticketId: t1.id, authorId: agent1.id } })
  if (!existing1) {
    await prisma.ticketReply.create({
      data: {
        ticketId: t1.id,
        authorId: agent1.id,
        content: 'Hi Jose, I have received your ticket and I am investigating the session token issue. This appears to be related to the JWT secret rotation in the latest update. I will have an update within 30 minutes.',
        isInternal: false,
      }
    })
    await prisma.ticketReply.create({
      data: {
        ticketId: t1.id,
        authorId: agent1.id,
        content: 'INTERNAL NOTE: Confirmed JWT_SECRET mismatch after deployment. Need to update environment variable on prod server and restart the application. Coordinating with DevOps.',
        isInternal: true,
      }
    })
    await prisma.ticketReply.create({
      data: {
        ticketId: t1.id,
        authorId: client1.id,
        content: 'Thank you Anna. Please expedite — payroll cutoff is today at 5PM.',
        isInternal: false,
      }
    })
    // History
    await prisma.ticketHistory.create({
      data: { ticketId: t1.id, userId: admin.id, action: 'STATUS_CHANGE', oldValue: 'OPEN', newValue: 'IN_PROGRESS' }
    })
    await prisma.ticketHistory.create({
      data: { ticketId: t1.id, userId: admin.id, action: 'ASSIGNED', oldValue: null, newValue: agent1.name }
    })
  }

  // Knowledge Articles
  const articles = [
    {
      title: 'How to Reset Your Password',
      content: '## Password Reset Instructions\n\n1. Go to the login page at support.quanbyit.com\n2. Click "Forgot Password"\n3. Enter your registered email address\n4. Check your email for the reset link (valid for 30 minutes)\n5. Click the link and enter your new password\n\n**Password Requirements:**\n- Minimum 8 characters\n- At least one uppercase letter\n- At least one number\n- At least one special character\n\nIf you do not receive the email within 5 minutes, check your spam folder or contact your administrator.',
      category: 'Account & Access',
      slug: 'how-to-reset-password',
    },
    {
      title: 'How to Submit a Support Ticket',
      content: '## Submitting a Support Ticket\n\nTo get the fastest resolution for your issue:\n\n1. **Login** to the support portal\n2. Click **New Ticket** in the navigation\n3. **Select Severity** appropriately:\n   - **Critical**: System down, blocking all users\n   - **High**: Major feature broken, significant impact\n   - **Medium**: Feature degraded, workaround available\n   - **Low**: Minor issue or enhancement request\n4. **Write a clear title** (e.g., "Cannot export reports to PDF")\n5. **Describe the issue** including:\n   - Steps to reproduce\n   - Expected vs actual behavior\n   - Browser/OS used\n   - Number of users affected\n6. **Attach screenshots** if available\n7. Click **Submit**\n\nYou will receive an email confirmation with your ticket number (format: QS-YYYY-NNNN).',
      category: 'Getting Started',
      slug: 'how-to-submit-ticket',
    },
    {
      title: 'Understanding SLA Response Times',
      content: '## SLA Response Time Commitments\n\nOur team is committed to the following response and resolution times based on your TOR:\n\n| Severity | First Response | Resolution |\n|----------|---------------|------------|\n| Critical | 1 hour (24/7) | 24-48 hours |\n| High | 4 business hours | 3-5 business days |\n| Medium | 8 business hours | Next minor release |\n| Low | 1 business day | Next major release |\n\n**Business Hours:** 9:00 AM – 5:00 PM, Monday–Friday (PHT)\n\n**What pauses the SLA timer?**\nWhen a ticket status is set to "Pending Client" (waiting for your response or information), the SLA timer is automatically paused. It resumes when the ticket is updated.\n\n**SLA Breach Notifications:**\nAt 75% of the SLA window, a warning notification is sent. At 100%, the ticket is flagged as breached and escalated to the manager.',
      category: 'Policies & SLA',
      slug: 'understanding-sla',
    },
    {
      title: 'Common Login Issues and Solutions',
      content: '## Login Troubleshooting Guide\n\n### "Invalid credentials" error\n- Double-check your email address\n- Ensure Caps Lock is off\n- Try resetting your password\n\n### "Account locked" error\n- After 5 failed attempts, accounts are locked for 15 minutes\n- Contact your administrator for immediate unlock\n\n### "Session expired" message\n- Sessions expire after 8 hours of inactivity\n- Simply log in again\n\n### Browser compatibility\n- Recommended: Chrome 110+, Firefox 110+, Edge 110+\n- Clear browser cache and cookies if experiencing issues\n- Disable browser extensions (ad blockers may interfere)\n\n### Two-Factor Authentication issues\n- Ensure your device time is synchronized\n- Use the backup codes provided during setup\n- Contact admin to reset 2FA if codes are unavailable',
      category: 'Account & Access',
      slug: 'login-issues',
    },
    {
      title: 'How to Add Users to Your Organization',
      content: '## User Management Guide\n\n*This guide is for Organization Administrators.*\n\n### Adding a New User\n1. Go to **Admin → User Management**\n2. Click **Add User**\n3. Enter the user\'s full name and email\n4. Select their **role**:\n   - **Client User**: Can submit and view tickets\n   - **Support Agent**: Can manage and respond to tickets\n   - **Manager**: Full ticket access plus reports\n5. Click **Save** — an invitation email will be sent\n\n### Deactivating a User\n1. Find the user in the list\n2. Click the action menu (⋮)\n3. Select **Deactivate**\n\nDeactivated users cannot login but their ticket history is preserved.\n\n### Password Policy\nAll users must change their temporary password on first login.',
      category: 'Administration',
      slug: 'user-management',
    },
  ]

  for (const article of articles) {
    const existing = await prisma.knowledgeArticle.findUnique({ where: { slug: article.slug } })
    if (!existing) {
      await prisma.knowledgeArticle.create({ data: article })
    }
  }

  console.log('✅ Seed complete!')
  console.log('\nDemo users:')
  console.log('  Admin:   michael@quanbyai.com / Admin@2026!')
  console.log('  Manager: maria.santos@quanbyit.com / Agent@2026!')
  console.log('  Agent:   anna.reyes@quanbyit.com / Agent@2026!')
  console.log('  Agent:   juan.dela.cruz@quanbyit.com / Agent@2026!')
  console.log('  Client:  jose.ramos@dap.edu.ph / Client@2026!')
  console.log('  Client:  lisa.mendoza@pco.gov.ph / Client@2026!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
