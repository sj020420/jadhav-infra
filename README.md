# JADHAV INFRA – JCB Rental Management

Full app: **React (Vite) frontend + Node/Express backend + SQLite database**.
Mobile-first. All data is saved in a real database file – nothing is lost on refresh.

## 1. Requirements
- **Node.js 20 or newer** (https://nodejs.org)

## 2. First-time setup (once)
```bash
cd jadhav-infra
npm install          # installs the small root helper (concurrently)
npm run setup        # installs server + client packages
```

## 3. Run (development – frontend + backend together)
```bash
npm run dev
```
- App:  http://localhost:5173   (open this)
- API:  http://localhost:5001/api
- **On your phone** (same Wi-Fi): open `http://<your-computer-IP>:5173`

The database file is created automatically at `server/data/jadhav_infra.db`.

## 4. Run for real use (one server, one URL)
```bash
npm run build        # builds the frontend into client/dist
npm start            # serves app + API on http://localhost:5001
```
To use it from anywhere, deploy this folder to a VPS / Render / Railway / any Node host
(keep `server/data/` on a persistent disk) and open the server URL on your phone.

## 5. Project structure
```
jadhav-infra/
├─ server/
│  ├─ index.js        Express REST API  (/api/:collection  GET, POST, PUT/:id, DELETE/:id)
│  ├─ db.js           SQLite connection (better-sqlite3), creates tables on start
│  ├─ schema.sql      DATABASE FILE – table definitions
│  ├─ .env            PORT, DB_FILE
│  └─ data/           jadhav_infra.db is created here
└─ client/
   └─ src/
      ├─ api.js            ← the ONLY file that talks to the backend
      ├─ DataContext.jsx   loads / saves all data, toasts
      ├─ constants.js      company details, dropdown lists
      ├─ utils.js, calc.js, columns.js, export.js (Excel + PDF)
      ├─ components/       DataTable, CrudPage, Invoice, ReportTable, Modal, SummaryCard, DateRangeFilter, Layout
      ├─ forms/            CustomerForm, JcbWorkForm, ExpenseForm, DieselForm, EmployeePaymentForm, PaymentForm
      └─ pages/            Dashboard, JcbWork, Customers, Expenses, Diesel,
                           Employees, Reports, Invoices, Settings
```
Database tables: `customers, jobs, expenses, diesel, employee_payments, invoices`.

## 6. How it works (important rules)
- **Hours** = End − Start. If end time is earlier than start, the job is treated as running past midnight (shown as "next day"). Same start & end is rejected.
- **Total** = Hours × Rate. **Pending** = Total − Paid. Status (Paid/Unpaid/Partial) follows the paid amount.
- **Payments**: first paid amount is saved with the job; later part-payments are added directly in **JCB Work → Pay / Receive Payment**, with date and method.
- **Expenses** page shows everything going out: manual expenses + Diesel entries + *Paid* driver/employee payments (Pending ones are not counted until paid). Profit = JCB billing − all of these.
- **Income** in dashboard/P&L = amount billed for jobs (not only cash received).
- **Invoice**: GST is OFF unless ticked. Maharashtra (27) or no customer GSTIN → CGST+SGST; other state GSTIN → IGST. Number format `JI/2026-27/0001`.
- **PDF** uses "Rs." instead of ₹ (the standard PDF font cannot print ₹). Excel and screen use ₹.
- **Deleting a customer** is blocked while they have jobs.

## 7. Backup
Settings → **Download Backup** (JSON) / **Restore**. Also copy `server/data/jadhav_infra.db` regularly.

## 8. Change company details
Edit `client/src/constants.js`.

## 9. Security note
There is no login yet – anyone who can open the URL can see the data. If you host it on the internet, add a login or keep it on your home/office network. Ask for this as the next step.
