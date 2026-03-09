# Patient Management Platform — Implementation Plan

## Overview
A premium feature for private occupational therapists to manage their entire patient workflow
in one place: scheduling, session documentation, goal tracking, invoicing, and an optional
patient/parent portal. Positioned as the core premium selling point of the platform.

**Status:** Planning complete — implementation pending completion of Epic 5 & 6.

---

## Design Decisions

### Data isolation
Every API route is scoped to `therapistId` from the authenticated session.
No cross-therapist data access is possible by design. Tested in CI.

### Encryption
- Transport: HTTPS/TLS enforced at Cloudflare + App Runner layer
- At rest: MongoDB Atlas AES-256 encryption (default)
- Field-level: AES-256-GCM in application layer for sensitive text fields
  (session notes, assessments, diagnoses). Key stored in AWS Secrets Manager.

### Israeli legal compliance
| Requirement | Law | Implementation |
|---|---|---|
| Health data privacy | חוק הגנת הפרטיות 1981 + תקנות אבטחת מידע 2017 | Encryption, consent audit trail, data export |
| Patient rights / access | חוק זכויות החולה 1996 | Per-patient PDF export of all records |
| Record retention | Standard medical practice | Soft-delete only; `retentionDeleteAfter` field blocks hard deletes |
| Minor consent | חוק זכויות החולה | Parent consents for under-18; at 18 patient takes over |
| VAT invoicing | חוק מע"מ | Platform generates חשבונית מס with therapist's עוסק מורשה number |
| Data residency | Privacy Protection Regulations | AWS eu-west-1 (Ireland) — Israel has EU adequacy ✅ |
| Notification opt-in | חוק התקשורת 2008 | Explicit opt-in per channel before any messages sent |
| Platform liability | Data processor role | ToS: therapist is data controller, platform is data processor |

### Compliance CI tests (`src/__tests__/compliance.test.ts`)
- AWS region must be `eu-west-1`
- Every patient record must have `retentionDeleteAfter` set
- Patient creation must require `consentGiven: true`
- API must reject hard-delete within retention window
- Session notes in DB must be encrypted (not plain text)
- Patient API routes must be 403 for wrong therapist

### Patient/parent portal
- No forced signup — therapist invites by email → magic-link read-only view
- Optional account creation for: self-scheduling, online forms, document access
- Parent account → one or more child profiles (one parent, many patients)
- Direct adult patient account → single profile
- At age 18, child record transitions to patient self-management

---

## Database Models

### Patient
```ts
{
  therapistId: ObjectId,           // data isolation
  type: 'direct' | 'child',        // adult patient vs child
  firstName: string,
  lastName: string,
  dateOfBirth: Date,
  gender: 'male' | 'female' | 'other' | 'unspecified',

  // Child patients only
  parentInfo?: {
    firstName, lastName, phone, email,
    relationship: 'mother' | 'father' | 'guardian',
    notificationPrefs: { email, sms, whatsapp },
  },

  // Direct adult patients only
  contactInfo?: {
    phone, email,
    notificationPrefs: { email, sms, whatsapp },
  },

  referralSource?: string,
  diagnosisNotes?: string,          // ENCRYPTED
  insurance?: 'clalit' | 'maccabi' | 'meuhedet' | 'leumit' | 'none',
  hmoAuthNumber?: string,
  hmoSessionsAuthorized?: number,

  portalUserId?: ObjectId,          // if they created a portal account
  portalInviteToken?: string,       // magic link token

  // Legal / consent
  consentGiven: boolean,
  consentDate: Date,
  consentSignedBy: string,          // name of person who consented

  // Retention (records cannot be hard-deleted before this date)
  lastTreatmentDate?: Date,
  retentionDeleteAfter: Date,       // max(lastTreatment + 7yr, dob + 18yr + 7yr)

  status: 'active' | 'inactive' | 'archived',
  createdAt, updatedAt,
}
```

### Session (treatment note)
```ts
{
  therapistId: ObjectId,
  patientId: ObjectId,
  appointmentId?: ObjectId,
  date: Date,
  duration: number,                 // minutes

  notes: {
    subjective?: string,            // ENCRYPTED — what patient/parent reports
    objective?: string,             // ENCRYPTED — measurable observations
    assessment?: string,            // ENCRYPTED — clinical interpretation
    plan?: string,                  // ENCRYPTED — next steps
    freeText?: string,              // ENCRYPTED — alternative to SOAP
  },

  goalsAddressed: ObjectId[],
  fee?: number,
  invoiceId?: ObjectId,

  // AI assistance
  aiDraftUsed: boolean,

  status: 'draft' | 'signed',
  signedAt?: Date,
  createdAt, updatedAt,
}
```

### Goal
```ts
{
  therapistId: ObjectId,
  patientId: ObjectId,
  title: string,
  description: string,
  targetDate?: Date,
  progressEntries: [{ date, sessionId, rating: 1-5, note }],
  status: 'active' | 'achieved' | 'discontinued' | 'modified',
  achievedDate?: Date,
  createdAt, updatedAt,
}
```

### Appointment
```ts
{
  therapistId: ObjectId,
  patientId: ObjectId,
  startTime: Date,
  endTime: Date,
  duration: number,
  type: 'in-person' | 'telehealth' | 'home-visit',
  location?: string,
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show',
  bookedBy: 'therapist' | 'patient',
  remindersSent: [{ channel, sentAt, status }],
  cancelledBy?: 'therapist' | 'patient',
  cancellationReason?: string,
  fee?: number,
  createdAt, updatedAt,
}
```

### TherapistAvailability
```ts
{
  therapistId: ObjectId,
  weeklySchedule: [{
    dayOfWeek: 0-6,
    startTime: string,   // "09:00"
    endTime: string,     // "17:00"
    sessionDuration: number,
    breakBetween: number,
  }],
  exceptions: [{ date, type: 'unavailable'|'special_hours', startTime?, endTime?, reason? }],
  bookingWindowDays: number,     // how far ahead patients can book
  minNoticeHours: number,        // minimum hours before patient can book/cancel
  updatedAt,
}
```

### Invoice (חשבונית מס)
```ts
{
  therapistId: ObjectId,
  patientId: ObjectId,
  invoiceNumber: string,           // sequential per therapist (e.g. "2026-0042")
  issueDate: Date,
  dueDate?: Date,

  // Therapist business details (copied at issue time)
  therapistName, therapistLicense,
  businessNumber: string,          // מס' עוסק מורשה
  vatNumber?: string,
  therapistAddress?: string,

  // Patient details (copied at issue time)
  patientName, patientAddress?: string,

  lineItems: [{ description, quantity, unitPrice, sessionIds }],
  subtotal: number,
  vatRate: number,                 // 0 or 0.18
  vatAmount: number,
  total: number,

  type: 'invoice' | 'receipt' | 'invoice_receipt', // חשבונית / קבלה / חשבונית מס קבלה
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
  paidAt?: Date,
  paidAmount?: number,
  pdfUrl?: string,                 // S3 URL
  createdAt, updatedAt,
}
```

### Notification
```ts
{
  recipientId: ObjectId,           // therapist userId or portalUserId
  recipientType: 'therapist' | 'patient' | 'parent',
  type: 'appointment_reminder' | 'appointment_confirmed' | 'appointment_cancelled' |
        'invoice_sent' | 'report_shared' | 'goal_achieved' | 'new_booking' | 'note_due',
  title: string,
  body: string,
  relatedEntity?: { type, id },
  channels: ('email' | 'sms' | 'whatsapp' | 'in-app')[],
  status: 'pending' | 'sent' | 'read',
  readAt?: Date,
  createdAt,
}
```

### PortalUser (patient/parent portal account)
```ts
{
  therapistId: ObjectId,
  patientId: ObjectId,
  email: string,
  passwordHash?: string,
  role: 'patient' | 'parent',
  notificationPrefs: { email, sms, whatsapp, phone? },
  consentGiven: boolean,
  consentDate: Date,
  lastLoginAt?: Date,
  createdAt,
}
```

---

## Routes

### Therapist dashboard (authenticated, therapist role)
```
/dashboard/patients                     Patient list + search + stats
/dashboard/patients/new                 Add patient (with consent flow)
/dashboard/patients/[id]                Patient detail hub (overview, timeline)
/dashboard/patients/[id]/sessions/new   Write session note (SOAP + AI draft)
/dashboard/patients/[id]/sessions/[sid] View/edit session note
/dashboard/patients/[id]/goals          Goals list + add + progress updates
/dashboard/patients/[id]/reports        Generate + download progress report PDF
/dashboard/schedule                     Calendar + set availability + exceptions
/dashboard/billing                      Invoices list + stats
/dashboard/billing/new                  Create חשבונית מס
/dashboard/billing/[id]                 Invoice detail + download PDF
/dashboard/overview                     Cross-patient analytics dashboard
```

### API (all scoped to authenticated therapist)
```
GET/POST   /api/patients
GET/PUT/DELETE /api/patients/[id]
GET        /api/patients/[id]/export        Full patient record PDF

GET/POST   /api/appointments
GET/PUT    /api/appointments/[id]
GET        /api/appointments/slots?date=    Available slots for booking

GET/POST   /api/sessions
GET/PUT    /api/sessions/[id]

GET/POST   /api/goals
GET/PUT    /api/goals/[id]
POST       /api/goals/[id]/progress

GET/POST   /api/invoices
GET/PUT    /api/invoices/[id]
POST       /api/invoices/[id]/pdf

GET        /api/notifications
PUT        /api/notifications/[id]/read
PUT        /api/notifications/read-all

POST       /api/ai/draft-note             Session context → Claude → draft note
POST       /api/ai/draft-report           Session history → Claude → draft progress report

GET/PUT    /api/availability
```

### Patient/parent portal
```
/portal                     Landing (magic link or login)
/portal/login               Optional account creation
/portal/schedule            Book appointment from therapist's available slots
/portal/appointments        Upcoming + past appointments
/portal/documents           Documents therapist has shared
```

---

## AI Integration (Claude API)

### Draft session note
- Input: therapist provides bullet points of what happened in the session
- Output: full SOAP note draft
- Therapist reviews, edits, and signs

### Draft progress report
- Input: patient goals + last N session notes
- Output: structured progress report narrative (Hebrew or English)
- Therapist reviews and generates PDF

### Draft evaluation report (Phase 2)
- Input: intake questionnaire + assessment results + clinical observations
- Output: full evaluation report draft

---

## Implementation Phases

### Phase 1 — Core (ship first)
1. Compliance tests + encryption utility
2. All DB models
3. TherapistAvailability setup + public slots API
4. Patient management CRUD + consent flow + data export
5. Appointment scheduling (therapist + patient booking)
6. Session notes (SOAP form, encrypted, signed)
7. Goal tracking + per-session progress
8. Invoice generation — חשבונית מס PDF (Israeli format, VAT)
9. In-app notification system
10. AI note/report drafting (Claude API)

### Phase 2 — Enrichment
11. Patient/parent portal (magic link + optional account)
12. External reminders (email via Resend, SMS/WhatsApp via Twilio)
13. Progress report PDF generation
14. Per-patient + cross-practice analytics dashboards
15. Onboarding flow: therapist sets up business details (for invoices), availability, notification prefs

### Phase 3 — Future consideration
- HMO reimbursement workflow (Maccabi/Clalit authorization tracking + summary generation)
- Home program builder (structured activities + PDF for parents)

---

## Marketing / Landing Page

Once Phase 1 ships, add to homepage:
- New "For Therapists" expanded section showing the full workspace
- Feature highlights with screenshots: AI note drafting, calendar, invoicing
- Comparison table: "Without Therapio" (WhatsApp chaos, Word docs, manual invoices)
  vs "With Therapio" (everything in one place)
- "Save 3+ hours per week on documentation" stat
- "Try free for 30 days" premium CTA

---

## Testing Requirements

- Unit tests: encryption/decryption utility, invoice number generation, retention date calculation
- Integration tests: all API routes (auth, data isolation, consent enforcement, retention lock)
- Compliance tests: AWS region, encryption at rest, retention policy, cross-therapist access blocked
- Component tests: session note form, invoice form, calendar/scheduling UI
