# Delhi CM Grievance Dashboard — 7-Day Sprint Roadmap

**Project:** Chief Minister's Grievance & Complaint Management Dashboard  
**Submission Deadline:** June 22, 2026  
**Developer:** Sam Sharma, Chandigarh  
**Sprint Start:** June 15, 2026  

---

## At a Glance

| Metric | Value |
|---|---|
| Days remaining | 7 |
| Deadline | June 22, 2026 |
| Build mode | Solo sprint |
| Stack | FastAPI + PostgreSQL + React + Claude API |

---

## The Three Things That Will Win This

1. **Day 2 — AI Classifier**: Most teams hard-code categories. You'll have Claude read the complaint in natural language and return category + urgency + department in one API call.
2. **Day 4 — Heatmap + Clustering**: Collapsing 50 waterlogging complaints near Dwarka into one "Systemic Hotspot Event" is something judges will remember.
3. **Day 7 — Demo Video**: A 3-minute Loom showing the full citizen-to-CM flow carries more weight than a half-polished codebase with no demo.

---

## Day 1 — June 15 (Today)
### Setup, Schema & Registration
**Phase:** Foundation  
**Goal:** Register, design DB, scaffold project, seed data

### Tasks
- [ ] Fill Hansa AI registration form immediately
- [ ] Set up GitHub repo with React + FastAPI monorepo structure
- [ ] Design PostgreSQL schema: complaints, departments, districts, escalation_log, citizens
- [ ] Seed 300 realistic Delhi complaints across 11 districts with lat/lng coordinates
- [ ] Configure environment: Python 3.11, Node 20, PostgreSQL, Redis (optional)

### Tech Stack
`FastAPI` `PostgreSQL` `React` `Tailwind`

---

## Day 2 — June 16
### Complaint Intake + Claude AI Classifier
**Phase:** Foundation  
**Goal:** Citizen form → Claude API → auto-categorize + urgency score

### Tasks
- [ ] Build citizen complaint submission form (name, phone, district, description, photo upload)
- [ ] POST /complaints FastAPI endpoint with validation
- [ ] Integrate Claude API: send complaint text → get category + urgency score (1–10) + department
- [ ] Store classified complaint in DB with timestamp
- [ ] Test with 20 real-world complaint texts in Hindi/English/Hinglish

### Tech Stack
`Claude API` `FastAPI` `React form` `Pydantic`

---

## Day 3 — June 17
### Admin Dashboard + Status Workflow
**Phase:** Core Build  
**Goal:** CM's cockpit — complaint list, status pipeline, department routing

### Tasks
- [ ] Build admin dashboard layout with sidebar navigation
- [ ] Complaint list table: filter by district, category, priority, status
- [ ] Status workflow UI: Submitted → Assigned → In Progress → Resolved → Closed
- [ ] Department assignment dropdown with SLA timer display
- [ ] Role-based auth: CM Office / Department Officer / Citizen (JWT tokens)

### Tech Stack
`React` `Tailwind` `JWT` `FastAPI`

---

## Day 4 — June 18
### Delhi District Heatmap + Analytics
**Phase:** AI + Maps  
**Goal:** Leaflet.js map with hotspot clustering + Recharts dashboards

### Tasks
- [ ] Integrate Leaflet.js with Delhi ward/district GeoJSON boundary data
- [ ] Plot complaints as heatmap circles (size = volume, color = urgency)
- [ ] Implement spatial clustering: group complaints within 300m radius into hotspot events
- [ ] Build analytics panel: bar chart by category, time-series line chart, district leaderboard
- [ ] SLA escalation engine: auto-flag complaints unresolved past threshold

### Tech Stack
`Leaflet.js` `Recharts` `GeoJSON` `PostGIS / Python math`

---

## Day 5 — June 19
### Citizen Tracking Portal
**Phase:** Citizen Layer  
**Goal:** Unique complaint ID lookup + resolution status + OTP closure

### Tasks
- [ ] Citizen portal page: enter complaint ID → see full status timeline
- [ ] Generate unique complaint ID on submission (e.g. DEL-2026-00432)
- [ ] Status timeline component: each stage with timestamp and officer name
- [ ] OTP-based closure verification: citizen confirms resolution via code
- [ ] Email/SMS simulation (mock for MVP — log to console or show in UI)

### Tech Stack
`React` `FastAPI` `UUID generation` `Mock OTP`

---

## Day 6 — June 20
### CM Executive View + Accountability Metrics
**Phase:** Core Build  
**Goal:** War room dashboard, department scorecards, escalation feed

### Tasks
- [ ] CM executive one-screen view: live KPI cards (total, resolved today, escalated, avg resolution time)
- [ ] Department performance scorecard table with resolution rate % and backlog count
- [ ] Escalation live feed: complaints auto-escalated with reason and time elapsed
- [ ] Top 5 systemic issues widget (most-clustered hotspot events)
- [ ] PDF report generation: weekly summary using html2pdf.js or jsPDF

### Tech Stack
`Recharts` `jsPDF` `React` `FastAPI aggregate queries`

---

## Day 7 — June 21–22
### Polish, Demo Video & Submission
**Phase:** Polish + Ship  
**Goal:** Test everything, record 3-min demo, write README, submit

### Tasks
- [ ] End-to-end flow test: citizen files → AI classifies → CM sees → officer resolves → citizen confirms
- [ ] Fix any broken UI states, loading errors, empty states
- [ ] Deploy: Vercel (frontend) + Railway or Render (FastAPI backend) — free tier
- [ ] Record 3-minute Loom demo: show full flow including heatmap, AI categorization, and CM cockpit
- [ ] Write clean README with architecture diagram, setup steps, and feature list
- [ ] Submit before June 22 midnight with GitHub repo + live demo link + PDF blueprint

### Tech Stack
`Vercel` `Railway` `Loom` `README`

---

## Full Tech Stack Summary

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Tailwind + Recharts | Fast to build, clean UI |
| Backend | FastAPI (Python 3.11) | Auto docs, async, rapid prototyping |
| Database | PostgreSQL | ACID compliant, supports geo queries |
| AI | Claude API (claude-sonnet-4-6) | Complaint classification + urgency scoring |
| Maps | Leaflet.js + Delhi GeoJSON | Lightweight, free, no API key needed |
| Auth | JWT (role-based) | CM Office / Department / Citizen roles |
| Deploy | Vercel + Railway | Free tier, instant, no DevOps |
| Demo | Loom screen recording | Judges watch video before running code |

---

## MVP Success Criteria

- [ ] All 5 core capabilities work end-to-end (Intake, Tracking, Analytics, Transparency, Reporting)
- [ ] AI auto-categorization working on Hindi/English/Hinglish complaints
- [ ] Delhi district heatmap with spatial clustering visible
- [ ] Citizen can track complaint by unique ID
- [ ] CM executive view shows live KPIs and department scorecards
- [ ] 3-minute demo video recorded and ready
- [ ] Deployed to live URL (not just localhost)
- [ ] Submitted before June 22, 2026 midnight

---

## Features to Drop (Not Worth the Time)

| Feature | Why Drop |
|---|---|
| WhatsApp/Telegram webhooks | Needs Meta Business API approval — days of waiting |
| Voice-to-text pipeline | Too complex for 7 days |
| Blockchain tracking | Buzzword, not MVP-worthy |
| PostGIS full setup | Store lat/lng as floats, calculate distance in Python |
| Real SMS/OTP | Mock it — show the flow, don't wire real SMS gateway |
| Predictive forecasting | No historical data exists yet |

---

*Roadmap generated June 15, 2026. Build fast, demo clearly, submit on time.*
