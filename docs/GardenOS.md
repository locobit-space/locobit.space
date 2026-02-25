You are a senior enterprise architect and full-stack engineer.

Build a production-grade Smart Garden Mesh Operating System (GardenOS)
using:

- Nuxt 3 (script setup, strict TypeScript)
- TailwindCSS
- useState management with nuxt native useState
- nostr-tools
- Dexie (IndexedDB)
- Nuxt PWA
- Web Workers for background processing
- Zod for runtime validation
- Modular domain-driven architecture

This system must be:

- Offline-first
- Event-sourced
- Multi-relay compatible
- Secure
- Scalable
- Role-based access controlled
- Automation-capable

========================================
SYSTEM ARCHITECTURE
========================================

GardenOS is built on Nostr as event backbone.

All system state must derive from Nostr events.

Event kinds:

30010 → Telemetry
30011 → Irrigation command
30012 → Alert
30013 → Worker report
30014 → Automation rule
30015 → Zone config
30016 → System audit log

All events must:
- be validated with Zod
- be signed
- be stored locally in IndexedDB
- be replayable to rebuild state

========================================
ENTERPRISE FEATURES
========================================

1) Multi-Relay Architecture
- Connect to multiple relays
- Local relay (priority)
- Remote backup relay
- Failover handling
- Relay health monitoring

2) Domain Modules

Modules must be isolated:

/domains
  telemetry/
  irrigation/
  alerts/
  workers/
  zones/
  automation/
  audit/

Each domain has:
- types.ts
- schema.ts (Zod)
- service.ts
- store.ts
- composables.ts

3) Role-Based Access Control (RBAC)

Roles:
- Owner
- Admin
- Worker
- Viewer

Permissions enforced before publishing events.

4) Automation Engine

- Runs in Web Worker
- Watches telemetry events
- Executes rule events (kind 30014)

Example rule:
IF soil < 35 AND temperature > 30
THEN irrigation_on for 10 minutes

Automation must:
- Be deterministic
- Log execution (kind 30016)
- Prevent infinite loops

5) Irrigation Control

- Manual
- Scheduled
- Rule-based

Must support:
- Multi-zone activation
- Duration control
- Conflict resolution

6) Realtime Dashboard

Dashboard must include:

- Zone health grid
- Soil moisture gauge
- Water tank level
- Battery status
- Node online/offline detection
- Relay connectivity indicator

7) Mesh Monitoring

Show:
- Node last seen
- Signal quality
- Battery level
- Packet loss (if available)

8) Historical Analytics

- Store telemetry locally
- Aggregate 24h / 7d / 30d
- Predict water needs (placeholder AI module)

9) Audit Log System

All critical actions:
- Irrigation
- Rule execution
- Config changes
Must publish audit event (kind 30016)

10) PWA Requirements

- Installable
- Works fully offline
- Sync when reconnecting
- Background data refresh
- Push notification for alerts

========================================
SECURITY REQUIREMENTS
========================================

- Private keys never stored in plain text
- Support NIP-07 browser extension
- Support NIP-46 remote signer
- Validate all incoming event content
- Reject malformed telemetry
- Implement replay protection

========================================
STATE MODEL
========================================

Use Event Sourcing:

GardenState = reduce(events[])

Do not rely on traditional REST backend.

State rebuild must work after clearing memory.

========================================
UI REQUIREMENTS
========================================

Design:

- Dark theme default
- Minimalist
- Enterprise dashboard aesthetic
- Responsive grid
- Animated status indicators
- Health color system (Green / Yellow / Red)

Layout:

Header:
- Garden name
- Relay status
- Active user role

Main:
- Zone overview
- Live telemetry
- Irrigation controls
- Charts

Side:
- Alerts feed
- Mesh health
- Automation status

========================================
FOLDER STRUCTURE
========================================

/core
  nostr/
  eventBus/
  validation/

/domains
  telemetry/
  irrigation/
  alerts/
  workers/
  zones/
  automation/
  audit/

/composables
  useRelay.ts
  useAuth.ts
  useEventStream.ts

/workers
  automation.worker.ts

/plugins
  nostr.client.ts

========================================
DELIVERABLES
========================================

Generate:

1) Full folder structure
2) Zod schemas for all event types
3) Example telemetry reducer
4) Example automation engine
5) Multi-relay connector logic
6) RBAC enforcement example
7) Example dashboard page
8) IndexedDB schema using Dexie
9) Web Worker example
10) Example irrigation publish flow
11) Example audit logging system
12) Comments explaining architecture decisions