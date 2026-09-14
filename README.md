# 📦 CampusDrop — WhatsApp-Enabled University Parcel Management System

> **A production-oriented full-stack web application designed exclusively for university campus parcel logistics (~2,300 students) at Rishihood University.**
> **Core Lifecycle: RECEIVE → STORE → NOTIFY → COLLECT**

---

## 🌐 Quick Application Links

- **React Web Application Frontend:** [http://localhost:5173](http://localhost:5173)
- **Express.js API Engine:** [http://localhost:5001/api](http://localhost:5001/api)
- **Health Check Endpoint:** [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🔑 Fast 1-Click Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **🎓 Student** | `student@campusdrop.demo` | `CampusDrop@2026` | Manjeet Sharma • Roll: `CS2023-0142` • Phone: `9876543210` • Aravali Hostel B-304 |
| **👮 Guard** | `guard@campusdrop.demo` | `CampusDrop@2026` | Rajesh Kumar • Badge: `GD-001` • Main Gate 1 Desk |
| **🛠️ Admin** | `admin@campusdrop.demo` | `CampusDrop@2026` | Dr. Vikram Malhotra • Director of Campus Logistics |

*(You can also use the **1-Click Demo Switcher** directly on the [Login Page](http://localhost:5173/login) or top navigation bar).*

---

## 🏛️ System Architecture

```
+---------------------------------------------------------------------------------------------------+
|                                          CAMPUSDROP PLATFORM                                      |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|   +------------------------------------+             +----------------------------------------+   |
|   |         STUDENT INTERFACE          |             |      GUARD & ADMIN WEB INTERFACES      |   |
|   |                                    |             |                                        |   |
|   |  - WhatsApp Business Cloud API     |             |  - React 18 + Vite + TypeScript        |   |
|   |  - Parcel Stored Notifications     |             |  - Tailwind CSS + Lucide Icons         |   |
|   |  - Interactive Menu Navigation     |             |  - Tablet-Optimized Guard Flow         |   |
|   |  - Dynamic Pickup QR & OTP Request |             |  - Admin Analytics & AI Forecasting    |   |
|   |  - Collection Receipts             |             |  - Live Storage Rack Matrix & Controls |   |
|   +-----------------+------------------+             +-------------------+--------------------+   |
|                     |                                                    |                        |
|                     | (Webhook & REST API)                               | (REST API + Socket.IO) |
|                     v                                                    v                        |
|   +-------------------------------------------------------------------------------------------+   |
|   |                              EXPRESS.JS BACKEND CORE ENGINE                               |   |
|   |                                                                                           |   |
|   |  [ Auth & RBAC ]  -->  [ Delivery & Parcel Engine ]  -->  [ Dynamic Storage Allocator ]   |   |
|   |  [ QR/OTP Sec ]   -->  [ Atomic Handover Engine ]    -->  [ Audit Logger & Security ]     |   |
|   |  [ AI Forecast ]  -->  [ WhatsApp Cloud Service ]    -->  [ Background Cron Reminders ]   |   |
|   +---------------------------------------------+---------------------------------------------+   |
|                                                 |                                                 |
|                                                 v                                                 |
|   +-------------------------------------------------------------------------------------------+   |
|   |                                POSTGRESQL + PRISMA ORM                                    |   |
|   |                                                                                           |   |
|   |  - Users, Students, Guards, Admins          - Deliveries, Parcels, DeliveryPartners       |   |
|   |  - StorageRacks, StorageSlots (Locks)       - Pickups, PickupTokens, OtpTokens            |   |
|   |  - Notifications, WhatsAppMessages          - AuditLogs, SystemSettings                   |   |
|   +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## ⚡ Core Operational Features

1. **Streamlined Parcel Intake & Dynamic Storage Allocation**:
   - Logistics partners supported: Amazon, Flipkart, Delhivery, Blue Dart, DTDC, Ecom Express, India Post, Other.
   - Auto-assigns an available storage slot across Racks A, B, or C with PostgreSQL concurrency locking, generates authoritative Parcel ID (`CD-YYYYMMDD-XXXXXX`), and triggers standardized WhatsApp arrival notification.
2. **Secure Handover Verification**:
   - Single-use, short-lived QR tokens (15-min expiry) generated on-demand.
   - Guard camera QR scanner (using `html5-qrcode`) with audio feedback.
   - Fallback 6-digit OTP verification.
   - Atomic PostgreSQL transaction: marks parcel `COLLECTED`, marks delivery `COMPLETED`, frees storage slot to `EMPTY`, records tamper-evident `AuditLog`, and sends WhatsApp receipt.
3. **WhatsApp Business Cloud API Architecture**:
   - `IWhatsAppProvider` adapter interface supporting both live Meta Cloud API (`MetaWhatsAppProvider`) and developer interactive simulator (`DevelopmentWhatsAppProvider`).
   - Webhook challenge verification (`GET /api/whatsapp/webhook`) & incoming message router (`POST /api/whatsapp/webhook`) with deterministic keyword commands (`Hi`, `1` My Parcels, `2` Pickup QR, `3` OTP, `4` Track, `5` Help).
4. **AI-Assisted Forecasting & Analytics**:
   - Linear regression and time-series moving averages across 30 days of historical data.
   - Predicts tomorrow's expected parcel volume, peak 2-hour window, rack overflow risk, and actionable guard counter staffing recommendations.
5. **Aged Unclaimed Parcel Automation**:
   - Scheduled `node-cron` background job: 24h reminder, 48h second notice, 72h overdue security alert.
6. **1-Click CSV Reporting Engine**:
   - Daily deliveries ledger, aged unclaimed packages, and warehouse rack capacity exports.

---

## 🚀 Running the System Locally

```bash
# 1. Sync PostgreSQL Schema & Seed Data (2,300 students + 30-day historical parcel data)
npx tsx prisma/seed.ts

# 2. Run Backend Integration Test Suite
cd server && npm test

# 3. Start Full-Stack Dev Server
npm run dev
```
