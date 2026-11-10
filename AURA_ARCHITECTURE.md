# AURA MUSIC: SYSTEM ARCHITECTURE & ICT BLUEPRINT
**Platform:** Aura Music — Lightweight, Sub-100ms Low-Latency Music Streaming Platform  
**Academic Reference:** University Course Assignment 1: ICT, Computer Systems & System Architecture Proposal  
**Lead System Architect:** Balgyn Baikozhayev  
**Status:** Phase 1 Initialized  

---

## 1. Executive Summary & Architectural Vision

Aura Music is a modern, high-performance streaming architecture engineered to deliver broadcast-grade, low-latency audio playback (target TTFB < 100ms) with a lightweight, cloud-native footprint. The platform separates critical-path synchronous binary delivery from decoupled, asynchronous event telemetry, ensuring that analytics, user statistics (Aura Unwrapped), and recommendation engines never contend with real-time media streaming pipelines.

```
+-----------------------------------------------------------------------------------+
|                                  AURA MUSIC CLIENT                                |
|   (Next.js 14+ App Router, Tailwind CSS Aura Theme, HTML5 Web Audio Buffer)      |
+--------------------------+-----------------------------------+--------------------+
                           |                                   |
             [Flow A: Synchronous Audio]             [Flow B: Asynchronous Telemetry]
              Direct HTTPS Stream <100ms              Non-Blocking Event ('EndSong')
                           |                                   |
                           v                                   v
             +----------------------------+         +----------------------------+
             |   CDN Edge Storage Cache   |         |   Aura Ingestion Route     |
             |   (Cloudflare / S3 CDN)    |         |   (Next.js Edge / Queue)   |
             +-------------+--------------+         +--------------+-------------+
                           |                                       |
                           v                                       v
             +----------------------------+         +----------------------------+
             |   Audio Object Storage     |         |  PostgreSQL ACID Database  |
             |   (Supabase Storage / S3)  |         |  (aura_listening_events)   |
             +----------------------------+         +--------------+-------------+
                                                                   |
                                                                   v
                                                    +----------------------------+
                                                    |  Batch Aggregation Engine  |
                                                    |  (Aura Unwrapped Top Stats)|
                                                    +----------------------------+
```

---

## 2. The Four Core ICT Pillars

Aura Music is architectured upon four fundamental Information & Communication Technology (ICT) pillars, balancing edge compute responsiveness, network distribution, polyglot storage isolation, and modular microservices.

### Pillar 1: Hardware & Compute Infrastructure
* **Edge Serverless Compute:** Next.js App Router deployed to Vercel/Cloudflare Edge networks for sub-10ms UI rendering, localized routing, and initial request authorization.
* **Containerized Core Compute:** High-throughput microservices running in Docker containers across managed clusters (AWS ECS / GCP Cloud Run / EC2). Dedicated virtual CPUs handle metadata queries, audio encoding/transcoding pipelines (FFmpeg workers), and batch aggregation workloads.
* **Elastic Autoscaling:** Horizontal pod autoscaling (HPA) governed by CPU/memory thresholds and incoming request queue depth.

### Pillar 2: Networks, Edge Protocols & CDNs
* **Global Content Delivery Network (CDN):** Cloudflare / AWS CloudFront distribution layer with edge PoPs (Points of Presence) positioned globally.
* **Low-Latency Transport Protocol:** Modern HTTP/2 and HTTP/3 (QUIC) over TLS 1.3 with 0-RTT connection resumption, minimizing packet retransmissions over lossy mobile networks.
* **Audio Chunk Delivery:** Progressive byte-range requests (`Range: bytes=0-1048576`) enabling instantaneous HTML5 audio buffer fill. Time-to-first-byte (TTFB) is held strictly under 100ms through edge caching of popular tracks.

### Pillar 3: Polyglot Storage Tier
* **Relational ACID Storage (PostgreSQL via Supabase):**
  * Manages catalog metadata (`aura_songs`, `aura_artists`, `aura_playlists`, `aura_playlist_songs`).
  * Enforces relational integrity, foreign key constraints, and transactional consistency for playlist updates and user accounts.
  * Captures immutable telemetry logs (`aura_listening_events`).
* **Distributed Object Storage (Supabase Storage / Amazon S3):**
  * High-availability, geo-redundant storage for immutable audio binaries (`.mp3`, `.aac`, `.m4a`) and high-resolution album artwork (`.webp`, `.jpg`).
  * Enforces public read-only edge distribution via presigned CDN URLs.
* **High-Speed Caching Layer (Redis):**
  * Sub-millisecond key-value cache for hot session tokens, user permission caches, trending song leaderboards, and temporary audio seek-cursor bookmarks.

### Pillar 4: Software Services & Microservice Boundaries
* **Identity & Authentication Service:** OAuth 2.0 / JWT bearer token verification, secure session management, and role-based access control.
* **Catalog & Search Service:** Sub-50ms full-text and semantic search indexing across tracks, artists, genres, and playlists.
* **Audio Streaming Gateway:** Manages CDN presigned URL dispatch, bitrate negotiation, and adaptive streaming session control.
* **Asynchronous Telemetry & Analytics Engine:** Lightweight background event ingestion processing user listening habits without blocking client interactivity.

---

## 3. Request Lifecycle: Synchronous vs. Asynchronous Separation

To achieve maximum platform reliability, Aura Music strictly decouples user experience from operational tracking:

| Dimension | Flow A: Synchronous Audio Streaming | Flow B: Asynchronous EndSong Telemetry |
| :--- | :--- | :--- |
| **Primary Objective** | Immediate audio chunk playback with zero perceptible lag | Data-driven playback auditing, user analytics, and recommendation training |
| **Execution Path** | Client UI → CDN Edge Cache → HTML5 Audio Element | Client Event Listener → Telemetry Route → Ingestion Queue → PostgreSQL |
| **Target Latency** | **< 100 ms TTFB** (Time-to-first-byte) | **Eventual Consistency** (Batch processed within 5-60s) |
| **Failure Tolerance** | **Zero tolerance for failure** — client retries or falls back to alternate CDN edge | **High tolerance for transient failure** — client caches event locally in `IndexedDB`/`localStorage` if offline, retries on reconnect |
| **Impact on Playback** | Directly drives the user's active listening session | **Completely non-blocking**; playback is never stalled by network or DB latency |

### Flow A: Synchronous Audio Streaming Flow
1. User clicks **Play** on a song card or search result.
2. The client checks local memory cache for audio URL; if absent, requests track stream credentials.
3. The client establishes an HTTPS connection to the nearest CDN Edge Server.
4. CDN streams the first audio segment directly into the HTML5 `Audio` element buffer.
5. Playback starts immediately as subsequent segments buffer concurrently in the background.

### Flow B: Asynchronous Telemetry & "EndSong" Pipeline
1. When a track completes 30 seconds of playback or reaches the `onEnded` event, an `EndSong` event is triggered:
```json
{
  "event": "EndSong",
  "track_id": "trk_7f8c12",
  "user_id": "usr_94a2b1",
  "duration_ms": 219000,
  "completed_ratio": 1.0,
  "timestamp": "2026-09-19T15:25:00Z"
}
```
2. The client dispatches this payload via `navigator.sendBeacon()` or non-blocking `fetch()` to `/api/telemetry`.
3. The event is persisted into `aura_listening_events`.
4. Scheduled background cron workers aggregate listening events into daily/annual metrics (powering **Aura Unwrapped**, listening streaks, and "Top 0.001%" loyalty badges).

---

## 4. Governance, Security & Compliance Standards

### ISO/IEC 27001:2022 (ISMS Framework Controls)
* **A.5.15 (Access Control):** Strict JSON Web Token (JWT) OAuth 2.0 authorization on every private API route and database query.
* **A.8.24 (Use of Cryptography):** TLS 1.3 enforced for all network transit. Sensitive user credentials and auth tokens hashed/encrypted at rest using AES-256 and Argon2/Bcrypt.
* **A.8.15 (Logging and Monitoring):** Immutable audit trails for authentication, access grants, and system modifications.
* **A.8.14 (Redundancy of Information Processing Facilities):** Multi-Availability Zone database replication with automated failover.

### GDPR (General Data Protection Regulation)
* **Article 25 (Data Protection by Design and by Default):** Telemetry data anonymization, strict Row-Level Security (RLS) policies on Supabase tables ensuring users can only read and write their own data.
* **Article 6 (Lawfulness of Processing):** Clear user consent mechanisms for personalized analytics and recommendation modeling.
* **Article 17 (Right to Erasure):** Automated stored procedure `delete_user_listening_data(user_uuid)` purging all user telemetry and personal listening history upon account termination.
* **Article 33 (Notification of Personal Data Breach):** Real-time monitoring alerts flagging anomalous data exfiltration patterns within 72 hours.

---

## 5. Relational Schema Blueprint (`aura_*`)

To eliminate collisions with external systems, all entities use the `aura_` prefix:

```sql
-- 1. Songs Entity
CREATE TABLE IF NOT EXISTS aura_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  genre TEXT DEFAULT 'Pop',
  duration_ms INTEGER NOT NULL,
  audio_url TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Playlists Entity
CREATE TABLE IF NOT EXISTS aura_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Playlist-Song Junction
CREATE TABLE IF NOT EXISTS aura_playlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES aura_playlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES aura_songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, song_id)
);

-- 4. Asynchronous Listening Telemetry
CREATE TABLE IF NOT EXISTS aura_listening_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  song_id UUID REFERENCES aura_songs(id) ON DELETE CASCADE,
  duration_ms INTEGER NOT NULL,
  completed BOOLEAN DEFAULT true,
  device_info JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Implementation Roadmap

* **Phase 1 (Current):** System Blueprint, Next.js 14+ Shell, Custom Aura Tailwind Tokens, Glassmorphic UI Shell, Supabase SSR Clients.
* **Phase 2:** Supabase Database Tables (`aura_*`), Mock/Seed Song Data, Audio Player State Machine (Zustand/Context), Persistent Audio Dock.
* **Phase 3:** Synchronous Streaming Engine, Search & Catalog Browsing, Playlist Curation.
* **Phase 4:** Asynchronous Telemetry Ingestion, "Aura Unwrapped" 9:16 Social Story Card generator.
