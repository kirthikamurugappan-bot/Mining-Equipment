# MineTrack — Mining Equipment & Tyre Maintenance Management Platform

MineTrack is a production-style, enterprise internal platform for mining companies to manage heavy mining machinery, OTR (Off-the-Road) tyres, operator task dispatch, pit fault reporting, preventive/corrective maintenance workflows, automated invoice reconciliation, and workforce availability.

Built exclusively on the **MERN Stack** (MongoDB, Express.js, React.js, Node.js), utilizing REST APIs with real-time database persistence, strict Role-Based Access Control (RBAC), and Indian Rupee (₹) currency formatting.

---

## 🌟 Key System Capabilities

1. **Strict Single Login Authentication & Automatic Role-Routing**
   - Single unified login page (`/login`) with no role selection dropdowns or buttons.
   - Credentials checked securely on Express/Node backend; user role retrieved directly from MongoDB.
   - Dynamic routing to role-specific portals:
     - **Worker** → Worker Dashboard (`/worker`)
     - **Supervisor** → Supervisor Operational Overview (`/supervisor`)
     - **Admin** → System Administration & User Console (`/admin`)
   - Passwords hashed securely using bcryptjs; protected JWT bearer authorization; inactive accounts denied access.

2. **Heavy Equipment Fleet Management**
   - Centralized machinery registry (Dump Trucks, Excavators, Wheel Loaders, Bulldozers, Drills).
   - Real-time operational statuses: `Operational`, `Under Maintenance`, `Inactive`.
   - Comprehensive machine detail modal linking attached tyres, maintenance log history, and assigned operators.

3. **OTR Tyre Tracking & Condition Inspections**
   - High-value mining tyre asset management across wheel positions (Front Left, Rear Duals, etc.).
   - Inspection log recorder (tread depth, operating hours/km, condition grading: `Good`, `Warning`, `Critical`, `Replacement Required`).
   - Automated alerts triggered upon degradation to `Critical`.

4. **Pit Fault & Issue Reporting**
   - Field operators submit equipment fault reports with symptom descriptions, subsystem categorization, and priority.
   - Supervisor triage decision workflow:
     - `Inspection Required`
     - `Maintenance Required`
     - `No Action Required`
     - `Request More Information`

5. **Maintenance & Automated Cost Comparison Engine**
   - Direct automatic cost variance reconciliation:
     $$\text{Variance} = \text{Bill Cost} - \text{Entered Cost}$$
     $$\text{Variance Percentage} = \left(\frac{\text{Bill Cost} - \text{Entered Cost}}{\text{Entered Cost}}\right) \times 100$$
   - Real-time states: `Cost Matched` (₹0 Variance), `Cost Mismatch`, `Bill Cost Missing`, `Entered Cost Missing`, `Awaiting Cost Data`.
   - Supervisor review panel to `Approve`, `Reject`, or `Request Clarification` for invoice variances.

6. **Task Operations & Worker Availability Enforcement**
   - Strict availability guard: Workers marked `On Leave` or `Inactive` are automatically blocked from task assignment with warning dialogs.
   - Full worker lifecycle: `Assigned` → `Acknowledged` → `In Progress` → `Completed`.
   - Supervisor task reassignment and rescheduling capabilities.

7. **Shift Attendance Registry**
   - Worker digital punch in / punch out widget with automated hours worked calculation.
   - Workforce attendance roster and absence monitoring.

8. **Fleet Analytics & Multi-Page Non-Clipped PDF Reports**
   - 7 Real Recharts analytics charts:
     1. Monthly Maintenance Job Volume Trend (Line Chart)
     2. Monthly Maintenance Cost Trend (Bar Chart in ₹)
     3. Equipment-wise Maintenance Cost Comparison (Horizontal Bar Chart)
     4. Maintenance Type Distribution (Donut Chart)
     5. Completed vs Pending vs Overdue Operations (Pie Chart)
     6. OTR Tyre Condition Fleet Distribution (Donut Chart)
     7. Cost Mismatch & Reconciliation Overview (Bar Chart)
   - Client-side multi-page PDF generation with dedicated page-breaks ensuring zero chart clipping or overlapping text.

9. **Admin User Management & Audit Trail**
   - Admin-exclusive employee account creation with role selection (`Worker`, `Supervisor`, `Admin`).
   - Account activation/deactivation and password reset.
   - Real-time audit trail capturing all system modifications.

---

## 🏗️ Technology Stack

- **Frontend:** React 19, Vite, React Router v7, Recharts, Lucide React, jsPDF, html2canvas, Axios, React Hot Toast.
- **Backend:** Node.js, Express.js, Mongoose, JWT, bcryptjs, Helmet, Morgan, Express Rate Limit.
- **Database:** MongoDB (`mongodb://localhost:27017/minetrack`).
- **Styling:** Modern enterprise CSS design system with Dark Charcoal and Clean Light theme support.

---

## 📁 Project Structure

```
MineTrack/
│
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Layout & reusable UI components
│   │   │   └── layout/         # AppLayout with role-aware sidebar & header
│   │   ├── context/            # AuthContext & ThemeContext
│   │   ├── pages/              # 16 Role-based portal & module views
│   │   │   ├── LoginPage.jsx
│   │   │   ├── WorkerDashboard.jsx
│   │   │   ├── SupervisorDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── EquipmentPage.jsx
│   │   │   ├── TyresPage.jsx
│   │   │   ├── MaintenancePage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   ├── IssuesPage.jsx
│   │   │   ├── AttendancePage.jsx
│   │   │   ├── AlertsPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── UsersPage.jsx
│   │   │   ├── AuditLogsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── services/           # Axios REST API client
│   │   ├── utils/              # INR & Date formatters
│   │   ├── App.jsx             # Role-protected route tree
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── config/                 # MongoDB database connection
│   ├── controllers/            # Business logic controllers
│   ├── middleware/             # Auth, RBAC, Upload, and Audit middleware
│   ├── models/                 # Mongoose schemas (Equipment, Tyre, Maintenance, etc.)
│   ├── routes/                 # REST API endpoints
│   ├── services/               # Background Alert Scheduler
│   ├── utils/                  # Database seed script
│   ├── test-api.js             # API test suite (21 assertions)
│   ├── test-e2e-workflow.js    # End-to-end integration test (33 assertions)
│   ├── server.js               # Express application entrypoint
│   └── package.json
│
├── .env                        # Environment configuration
├── package.json                # Root orchestration package
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally on port `27017`

### 1. Install Dependencies
Run the following commands in PowerShell:

```powershell
# Root dependencies
npm.cmd install

# Server dependencies
cd server
npm.cmd install

# Client dependencies
cd ../client
npm.cmd install
cd ..
```

### 2. Environment Variables
Ensure `.env` exists in the project root:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/minetrack
JWT_SECRET=minetrack_super_secret_jwt_key_2026_production
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
```

### 3. Seed Realistic Mining Demonstration Data
Populate MongoDB with realistic dump trucks, excavators, OTR tyres, maintenance jobs, tasks, alerts, and user accounts:

```powershell
npm.cmd run seed
```

---

## 🚀 Running the Application

### Start Backend Server (Port 5000)
```powershell
npm.cmd run server
```
*Health Check: http://localhost:5000/api/health*

### Start Frontend Application (Port 5173)
In a separate terminal window:
```powershell
npm.cmd run client
```
*Web App: http://localhost:5173*

---

## 👥 Seeded Demo Credentials

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `password123` | Full access, user management, audit logs |
| **Supervisor** | `sup1` | `password123` | Pit operations, cost verification, task assignment |
| **Supervisor** | `sup2` | `password123` | Workshop supervisor |
| **Worker** | `ravi01` | `password123` | Dump truck operator (Available) |
| **Worker** | `suresh02` | `password123` | Excavator operator (Available) |
| **Worker (Leave)** | `anil03` | `password123` | Operator marked **On Leave** (Tests availability enforcement) |

*Note: Passwords are encrypted with bcryptjs and are never exposed in plaintext or API responses.*

---

## 🧪 Automated Testing

### 1. API Route Test Suite (21 Assertions)
Validates database connection, password hashing, protected routes, and role boundaries:
```powershell
npm.cmd run test:api
```

### 2. End-to-End Workflow Test Suite (33 Assertions)
Validates the complete multi-role lifecycle (Worker task acknowledge → Issue report → Supervisor triage → Maintenance scheduling → Automatic cost reconciliation → Admin user onboarding):
```powershell
npm.cmd run test:e2e
```

### 3. Production Build Validation
Validates that all React components, icons, charts, and PDF scripts compile without errors:
```powershell
cd client
npm.cmd run build
```

---

## 📑 Complete Demonstration Workflow

1. **Admin Login**:
   - Log in with `admin` / `password123`.
   - Access Admin Dashboard (`/admin`), view metrics and real-time audit trail.
   - Navigate to `/users`, click **Add Employee User**, specify role (`Worker`, `Supervisor`, or `Admin`), and create an account.
2. **Worker Login**:
   - Log in with `ravi01` / `password123`.
   - View Worker Dashboard (`/worker`) with assigned equipment (CAT 777D Dump Truck).
   - Under Today's Tasks, click **Acknowledge**, **Start**, add remarks, and mark **Complete**.
   - Navigate to `/issues`, click **Report Fault Issue** on machine DT-205 (Hydraulic Leak, Priority: High).
   - Log shift punch in/out under `/attendance`.
3. **Supervisor Triage & Cost Verification**:
   - Log in with `sup1` / `password123`.
   - Supervisor Dashboard (`/supervisor`) displays open issue and active alerts.
   - Under `/issues`, review reported fault and assign triage: `Maintenance Required`.
   - Under `/maintenance`, view scheduled job: Entered Cost (₹8,000) vs Contractor Bill (₹9,500). System flags `Cost Mismatch` (Variance: ₹1,500, +18.75%).
   - Click **Review** and submit decision (`Approved` with reason).
   - Attempt to assign task to `anil03`; system blocks assignment with "Worker is currently on leave".
4. **Analytics & PDF Export**:
   - Navigate to `/reports`.
   - Filter by year, machine, or job status; all 7 Recharts charts update instantly from MongoDB.
   - Click **Export Complete PDF Report** to generate a clean, multi-page document with zero chart clipping.
