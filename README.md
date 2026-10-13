# ClearAudit

**Enterprise-grade, real-time AI expense reimbursement & audit compliance platform.**

Powered by Google Gemma 4 (26B MoE) multimodal AI for automated receipt analysis, policy enforcement, and workflow management.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-v11-FFCA28?style=flat&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat&logo=tailwindcss)

---

## Features

### For Employees (`/dashboard`)
- **Smart Receipt Upload** — Camera capture or drag-and-drop file upload (PNG, JPEG, WEBP, PDF up to 10MB)
- **AI-Powered Extraction** — Automatic vendor, date, amount, and line-item extraction via Gemma 4
- **Real-Time Status Tracking** — Live Firestore sync shows instant status updates (Pending → Approved / Rejected)
- **Expense History** — Full history table with policy compliance indicators

### For Admins (`/admin`)
- **Live Audit Queue** — Real-time feed of pending expenses with filter tabs
- **Split-Pane Verification** — Zoomable receipt viewer alongside AI audit results
- **One-Click Decisions** — Approve or reject with optional rejection notes
- **PDF Generation** — Instant downloadable PDF receipts for approved expenses
- **Policy Violation Alerts** — Flagged expenses highlighted with AI-detected violations

### AI Compliance Engine
- Meal limit enforcement ($50 USD max)
- Alcohol & tobacco auto-rejection
- Weekend transaction flagging
- Confidence scoring (0.0–1.0) for each audit

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS 4 |
| Auth | Firebase Auth (Google SSO + Email/Password) |
| Database | Cloud Firestore (real-time sync) |
| Storage | Firebase Storage |
| AI Engine | Google GenAI SDK — Gemma 4 26B (MoE) |
| PDF | jsPDF |
| Icons | Lucide React |

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/adii3404/ClearAudit.git
cd ClearAudit
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual API keys:

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Firebase Setup

In your Firebase Console:

- **Authentication** → Enable Google and Email/Password providers
- **Firestore** → Create database, set rules: `allow read, write: if request.auth != null;`
- **Storage** → Set rules: `allow read, write: if request.auth != null;`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Build for Production

```bash
npm run build
```

---

## Project Structure

```
src/
├── app/
│   ├── admin/page.tsx          # Admin audit control center
│   ├── api/process-receipt/    # AI receipt processing endpoint
│   │   └── route.ts
│   ├── dashboard/page.tsx      # Employee dashboard
│   ├── login/page.tsx          # Dual auth (Google SSO + Email)
│   ├── policy/page.tsx         # Corporate spending policy
│   ├── terms/page.tsx          # Terms & conditions
│   ├── globals.css             # Monochrome design system
│   ├── layout.tsx              # Root layout with AuthProvider
│   └── page.tsx                # Entry redirect
├── lib/
│   ├── auth-context.tsx        # Firebase Auth context + role detection
│   ├── firebase.ts             # Firebase client initialization
│   └── types.ts                # Shared TypeScript interfaces
```

---

## Design System

Strict monochrome B2B SaaS aesthetic:
- **Colors**: Pure black (#000), slate scale (#0A0A0A → #FAFAFA), white (#FFF)
- **Typography**: Inter with tight letter-spacing
- **Zero decorative colors** — no blue, purple, or pink gradients

---

## License

MIT
