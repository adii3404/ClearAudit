# ClearAudit — Corporate Expense Reimbursement Platform

ClearAudit is a minimalist, monochrome B2B corporate expense reimbursement and auditing platform built with React 19, TypeScript, and Tailwind CSS v4.

![ClearAudit Logo](public/assets/aistudio/Gemini_Generated_Image_kdnznskdnznskdnz_c1f00f87.jpeg)

---

## Features

### 1. Authentication (`/login`)
- **50/50 Split Screen**: Clean branding on the left; fixed-size login card on the right with zero layout shift.
- **Role Toggle**: Seamless toggle between **Employee** and **Admin**.
- **Credential Hint**: Quick-fill button adjacent to Email for easy local testing.
- **Show/Hide Password**: Visibility toggle button.

### 2. Employee Portal (`/employee`)
- **Left Sidebar Navigation**: Brand header, navigation links (*Open Camera*, *Upload from Local*, *Ask Query*, *Expense Policy*, *Change Password*), and *Sign Out*.
- **Document Camera Scanner**: Live webcam scanner with viewport guides and fallback sample document generation.
- **File Ingestion**: Drag-and-drop zone supporting `.jpg`, `.png`, and `.pdf` files up to 5MB.
- **Upload Metadata**: Prompts for Description, Transaction Date, Category, and Amount in Indian Rupees (₹).
- **Audit Token System**: Generates unique alphanumeric tokens (e.g., `CA-B3CU-HAXA`) for every submission.
- **Ally AI Policy Assistant**: In-app chatbot answering corporate reimbursement rules and per diem guidelines.
- **Recent Submissions & Export**: Track submission statuses (`Pending`, `Approved`, `Revoked`, `Rejected`) and download report CSVs.
- **Legitimate GST Tax Vouchers**: Generates authentic Indian corporate GST reimbursement slips with downloadable PNG and print support.

### 3. Admin Audit Queue (`/admin`)
- **Administrative Oversight**: Direct metric counters for Pending Claims (₹), Accepted & Disbursed (₹), Revoked Claims, and Total Queue Records.
- **Status Filtering & Search**: Filter by status (*All*, *Pending*, *Accepted*, *Rejected*, *Revoked*) with real-time text search.
- **Audit Review Actions**:
  - **Accept**: Authorize claims for disbursement.
  - **Reject**: Mark claims as rejected.
  - **Revoke**: Open modal requiring a mandatory tip or reason for compliance clarification.
  - **Inspect**: View and export the official voucher slip.
- **Comprehensive Report Generation**: Instant CSV download of complete audit queues.

---

## Tech Stack

- **Framework**: React 19 + Vite 8
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Persistence**: Browser `localStorage`

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
git clone https://github.com/adii3404/ClearAudit.git
cd ClearAudit
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

---

## Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Employee** | `employee@clearaudit.internal` | `password123` |
| **Admin** | `admin@clearaudit.internal` | `adminpass123` |

*(Credentials and passwords can be updated directly within the application and will synchronize with local storage).*
