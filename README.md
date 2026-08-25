# ClientGuard CRM - Personal Insurance & Renewal Tracker

A modern, high-performance web application designed for personal insurance client management, driver & vehicle records, and renewal/expiry tracking.

![Dashboard Preview](https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80)

---

## Key Features

1. **Owner Authentication**
   - Single-user PIN / Password lock screen with auto-unlocking keypad.
   - Default PIN: `1234` | Default Password: `admin123`.
   - Ready for Clerk / Supabase Auth provider swap.

2. **Smart Renewal & Expiry Urgency Tracking**
   - Computed status indicators: **Active** (Emerald), **Due Soon** (Pulsing Amber), and **Expired** (Urgent Red).
   - Configurable urgency alert window (15, 30, 45, or 60 days).
   - Real-time countdowns (`Renewal due in 5d`, `Overdue by 4 days`).

3. **Lightning-Fast Search & Filtering**
   - Instant search across **First Name**, **Last Name**, **Vehicle Plate Number**, and **Driver License (DL)**.
   - Filter tabs: `All Clients`, `⚡ Due Soon`, `🗓️ This Month`, `⚠️ Expired`, `✅ Active`, `📦 Archived`.
   - Sort by Expiry Date, Renewal Date, Client Name (A-Z), Plate #, or Date Added.

4. **Fast 1-Click Policy Renewal**
   - Flexible renewal duration: **1 Year (12 Months)**, **6 Months**, **3 Months**, or **custom monthly intervals from 3 to 12 months**.
   - Automatic calculation of new Term Start, Next Renewal Date, and Expiry Date with custom date overrides and renewal audit notes.

5. **Security & Sensitive Data Protection**
   - Masked Driver's License numbers with 1-click reveal toggle (`••••-••••-9102` ↔ `D8921-4492-9102`).
   - One-click copy for License Plates and DL numbers.

6. **Client Dossier & Soft-Delete (Archive)**
   - Complete client drawer showing age, contact details (phone, email), vehicle info, policy timeline, and renewal history.
   - Soft-delete with 1-click restore from the **Archived** tab, plus optional permanent delete.

7. **Portability & CSV Export**
   - 1-click export of all client records (active + archived) to CSV.

8. **Rich Design System & Dark Mode**
   - Custom Vanilla CSS design tokens, smooth animations, and Light/Dark mode.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Custom CSS Design Tokens, Glassmorphism, Micro-animations
- **Icons**: Lucide Icons
- **Date Engine**: `date-fns`
- **Database**: SQLite (via `better-sqlite3`) with automatic table initialization and index optimization

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or [http://localhost:3001](http://localhost:3001) if port 3000 is occupied).

### 3. Log In
- **Default PIN**: `1234`
- **Default Password**: `admin123`

---

## Vercel & Production Deployment

For local and standard Node.js server deployments (Docker, VPS, Railway, Render), SQLite runs seamlessly with zero external dependencies.

For serverless environments like **Vercel** where the local filesystem is ephemeral:
- You can plug in **Turso / LibSQL** (which provides a serverless SQLite database with global edge replication), or
- Connect **Supabase / Neon PostgreSQL** via the storage adapter in `src/lib/storage.ts`.
