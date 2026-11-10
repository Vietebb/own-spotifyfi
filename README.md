# ✦ Aura Music

> **Sub-100ms Lightweight Music Streaming Architecture**  
> *Course Assignment 1: ICT, Computer Systems & System Architecture Proposal*  
> **Lead System Architect:** Balgyn Baikozhayev  
> **Repository:** [Vietebb/own-spotify](https://github.com/Vietebb/own-spotify)

---

## 🎧 Overview

Aura Music is a modern, high-performance streaming platform engineered to deliver broadcast-grade, low-latency audio playback (target TTFB < 100ms) with a lightweight cloud footprint. 

The system strictly decouples the critical-path **synchronous audio streaming pipeline** from the background **asynchronous playback telemetry engine** (`EndSong` events powering **Aura Unwrapped**), ensuring that analytics, user statistics, and recommendation modeling never contend with real-time media streaming threads.

```
+-----------------------------------------------------------------------------------+
|                                  AURA MUSIC CLIENT                                |
|   (Next.js App Router, Tailwind CSS Aura Theme, HTML5 Web Audio Engine)          |
+--------------------------+-----------------------------------+--------------------+
                           |                                   |
             [Flow A: Synchronous Audio]             [Flow B: Asynchronous Telemetry]
              Direct HTTPS Stream <100ms              Non-Blocking Event ('EndSong')
                           |                                   |
                           v                                   v
             +----------------------------+         +----------------------------+
             |   CDN Edge Storage Cache   |         |   /api/telemetry Ingestion |
             |   (Cloudflare / S3 CDN)    |         |   (Next.js Edge Queue)     |
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

## 🏛️ The Four Core ICT Pillars

1. **Hardware & Compute**:
   - Vercel/Cloudflare Edge serverless runtime for sub-10ms UI hydration and routing.
   - Containerized microservices (AWS EC2 / Docker) handling background batch aggregations and encoding.
2. **Networks & CDN**:
   - Global Cloudflare CDN edge caching serving progressive byte-range audio chunks over HTTP/3 and TLS 1.3 with target sub-100ms TTFB.
3. **Polyglot Storage**:
   - **PostgreSQL (Supabase)**: Transactional ACID metadata (`aura_songs`, `aura_playlists`, `aura_playlist_songs`, `aura_listening_events`).
   - **Object Storage (Supabase Storage / S3)**: Master audio binaries (`.mp3`, `.aac`) and high-res cover art.
4. **Software Services**:
   - Modular decoupled microservices: Identity & Auth, Catalog Search, Audio Streaming Player Engine, and Background Telemetry & Analytics Worker.

---

## 🔒 Governance & Security Compliance

- **ISO/IEC 27001:2022 ISMS Controls**:
  - **A.5.15 (Access Control)**: Strict JWT OAuth 2.0 bearer token authorization.
  - **A.8.24 (Cryptography)**: Enforced TLS 1.3 in transit; AES-256 encryption at rest.
  - **A.8.15 (Logging & Monitoring)**: Audited timestamps on all listening events and playlist mutations.
- **GDPR Compliance**:
  - **Article 25 (Privacy by Design)**: Strict Row Level Security (RLS) policies on all tables.
  - **Article 17 (Right to Erasure)**: Stored procedure `delete_user_listening_data(target_user_id UUID)` allowing users to completely purge their telemetry history.

---

## 🎨 Aura Design System

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `aura-obsidian` | `#06080c` | Audio player dock, story card base, deep canvas |
| `aura-navy` | `#0F172A` | Navigation sidebar, dark slate cards, header borders |
| `aura-blush` | `#FFF0F5` | Main application canvas background |
| `aura-pink` | `#E6196E` | Primary Hot Rose accent, play buttons, active indicators |
| `aura-blossom` | `#FF99C2` | Secondary soft accent, badges, gradient highlights |
| `aura-royal` | `#1E3A8A` | Secondary navy accent, gradient depths |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (Tested on Node.js v24)
- npm or yarn

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSCODE=your-admin-passcode
```

### 3. Database Migrations
Execute the SQL migrations in `supabase/migrations/` via your Supabase SQL Editor or CLI:
- `20260919000001_aura_music_schema.sql` (Tables, RLS policies, GDPR erasure procedure, seed tracks)
- `20260919000002_aura_stats_rpc.sql` (`get_user_listening_stats` aggregation RPC)

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 📂 Project Structure

```
├── AURA_ARCHITECTURE.md                # Full system architecture specification
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── stats/route.ts          # Server API calling get_user_listening_stats RPC
│   │   │   └── telemetry/route.ts      # Non-blocking EndSong event ingestion
│   │   ├── globals.css                 # Custom Aura theme tokens & glassmorphism
│   │   ├── layout.tsx                  # Root layout & Geist typography
│   │   └── page.tsx                    # Main dashboard & interactive catalog
│   ├── components/
│   │   ├── catalog/
│   │   │   └── SongGrid.tsx            # High-density track cards & playback trigger
│   │   ├── layout/
│   │   │   ├── AppShell.tsx            # Responsive app shell
│   │   │   ├── Header.tsx              # Search bar, latency badge, export button
│   │   │   ├── PlayerDock.tsx          # Initial bottom dock
│   │   │   └── Sidebar.tsx             # Collapsible Dark Slate navigation
│   │   ├── player/
│   │   │   ├── AudioPlayer.tsx         # Persistent audio dock connected to global state
│   │   │   └── StoryModal.tsx          # Interactive listening modal
│   │   └── stats/
│   │       └── StoryCardModal.tsx      # 9:16 Unwrapped social story frame & PNG export
│   ├── context/
│   │   └── PlayerContext.tsx           # Global HTML5 audio state machine & queue
│   └── lib/
│       ├── constants.ts                # Master seed catalog fallback
│       ├── telemetry.ts                # Fail-safe non-blocking telemetry dispatcher
│       ├── utils.ts                    # Styling & tabular mono time formatting
│       └── supabase/
│           ├── client.ts               # Browser Supabase client
│           ├── server.ts               # Server Supabase client (cookies)
│           └── types.ts                # Database schema TypeScript types
└── supabase/
    └── migrations/
        ├── 20260919000001_aura_music_schema.sql  # Relational ER schema & GDPR function
        └── 20260919000002_aura_stats_rpc.sql     # get_user_listening_stats RPC
```

---

## 📜 License & Academic Attribution
Created by **Balgyn Baikozhayev** for University Course Assignment 1: ICT, Computer Systems & System Architecture Defense.
