# JADHAV INFRA – JCB Rental Management

तीन वेगळे भाग:

| Folder | काय आहे | Deploy कुठे |
|---|---|---|
| `frontend/` | React (Vite) app | **Vercel** |
| `backend/`  | Express REST API | **Render** |
| `database/` | PostgreSQL schema + migrate + data import | **Neon** |

```
jadhav-infra/
├─ frontend/   src/, vercel.json, .env.example
├─ backend/    index.js, db.js, .env.example
├─ database/   schema.sql, migrate.js, import-data.js, seed/existing-data.json
├─ render.yaml           (Render blueprint)
└─ package.json          (local dev scripts)
```

---------------------------------------------------------------------

## A. आधी GitHub वर टाका

तुमच्या जुन्या repo मध्ये `client/`, `server/`, `node_modules/` आणि `*.db` files होत्या. त्या काढून नवीन folders टाका:

```bash
cd jadhav-infra                      # तुमचा जुना repo folder
git rm -r --cached node_modules client server -q
rm -rf client server node_modules
# आता या zip मधले frontend/ backend/ database/ render.yaml package.json .gitignore README.md इथे copy करा
git add -A
git commit -m "Split into frontend/backend/database, move to Postgres"
git push
```
> Repo **Private** ठेवा – जुन्या commits मध्ये ग्राहकांचा data (`.db` file) आहे.

---------------------------------------------------------------------

## B. Database – Neon

1. https://neon.tech → Sign up → **Create project** (Region: Singapore – भारताला जवळ).
2. Dashboard मध्ये **Connect** दाबा → connection string copy करा. असा दिसतो:
   `postgresql://user:password@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
   (शेवटी `?sslmode=require` असणे आवश्यक.)
3. **जुना data (3 customers, 3 jobs, 1 invoice…) Neon मध्ये टाकायचा असेल** – तुमच्या computer वर:
   ```bash
   cd database
   cp .env.example .env          # .env उघडून DATABASE_URL मध्ये Neon string paste करा
   npm install
   npm run migrate               # tables बनतात
   npm run import                # seed/existing-data.json मधला जुना data जातो
   ```
   नवीन, रिकामा सुरू करायचा असेल तर `migrate` / `import` काहीच नको – Render सुरू होताना tables आपोआप बनवतो.

---------------------------------------------------------------------

## C. Backend – Render

1. https://render.com → **New + → Blueprint** → तुमचा GitHub repo निवडा (`render.yaml` आपोआप सापडतो).
   *(किंवा **New + → Web Service** आणि हे भरा: Build Command `npm --prefix database install && npm --prefix backend install`, Start Command `npm --prefix database run migrate && npm --prefix backend start`, Health Check Path `/api/health`, Root Directory रिकामे.)*
2. Environment variables:
   - `DATABASE_URL` = Neon ची connection string
   - `ADMIN_PASSWORD` = तुमचा login password (**इथेच टाका – GitHub वर कधीही नको**)
   - `ADMIN_USERNAME` (`aj1818`) आणि `JWT_SECRET` आपोआप भरले जातात
   - `FRONTEND_URL` = आत्ता रिकामे/तात्पुरते ठेवा (Vercel नंतर)
3. Deploy झाल्यावर URL मिळेल, उदा. `https://jadhav-infra-backend.onrender.com`
   तपासा: `https://…onrender.com/api/health` → `{"ok":true,"db":"postgres"}` आले पाहिजे.

---------------------------------------------------------------------

## D. Frontend – Vercel

1. https://vercel.com → **Add New → Project** → तोच GitHub repo.
2. **Root Directory = `frontend`** (Edit दाबून निवडा). Framework: Vite (आपोआप).
3. Environment Variable:
   - `VITE_API_URL` = `https://jadhav-infra-backend.onrender.com` (तुमचा Render URL, शेवटी `/` नको)
4. **Deploy**. Vercel URL मिळेल, उदा. `https://jadhav-infra.vercel.app`

## E. शेवटची जोडणी (महत्त्वाची)

Render → तुमची service → **Environment** → `FRONTEND_URL` = तुमचा Vercel URL (`https://jadhav-infra.vercel.app`, शेवटी `/` नको) → Save (service आपोआप restart होते).
Custom domain नंतर लावली तर दोन्ही कॉमा ने लिहा: `https://a.vercel.app,https://mydomain.com`

आता Vercel URL फोनवर उघडा – काम झाले. ✅

---------------------------------------------------------------------

## Local मध्ये चालवणे (computer वर)

Node.js 20+ लागेल.
```bash
npm install            # root
npm run setup          # database + backend + frontend packages
cp backend/.env.example backend/.env     # DATABASE_URL आणि ADMIN_PASSWORD टाका, FRONTEND_URL रिकामे ठेवा
npm run migrate
npm run dev            # app: http://localhost:5173   API: http://localhost:5001/api
```

## महत्त्वाच्या गोष्टी

- **Render Free**: 15 मिनिटे वापर नसेल तर server झोपतो. पहिले उघडणे ~30–60 सेकंद घेऊ शकते – app आपोआप थांबून वाट पाहते (loading दिसते), नंतर सगळे नेहमीसारखे वेगवान.
- **Neon Free**: पाच मिनिटे idle नंतर database झोपतो, पहिल्या request ला 1–2 सेकंद लागतात. Data सुरक्षित राहतो.
- **Login**: app उघडल्यावर Username + Password विचारतो. Username/Password फक्त backend (Render Environment) मध्ये असतात – frontend किंवा GitHub मध्ये नाहीत. बदलायचा असेल तर Render → Environment मध्ये `ADMIN_USERNAME` / `ADMIN_PASSWORD` बदला. एकदा login केल्यावर 30 दिवस फोनवर login राहतो; Logout बटन Sidebar / More मेनूमध्ये आहे. 10 चुकीच्या प्रयत्नांनंतर 15 मिनिटे block होते.
- **Backup**: Settings → Download Backup (JSON). तीच file `cd database && npm run import -- file.json` ने किंवा Settings → Restore ने परत टाकता येते.
- **Company details बदलणे**: `frontend/src/constants.js`.
- **Hours/Total/Pending/Invoice/PDF चे नियम** पूर्वीसारखेच आहेत – कोणताही business logic बदललेला नाही.

## Troubleshooting

| त्रास | उपाय |
|---|---|
| Browser मध्ये "CORS" error | Render मधला `FRONTEND_URL` Vercel URL शी तंतोतंत जुळतो का (https, शेवटी `/` नको) |
| "Cannot reach the server" | `VITE_API_URL` बरोबर आहे का; Vercel मध्ये बदलल्यावर **Redeploy** करा (env बदल build वेळी लागतात) |
| Render log मध्ये `DATABASE_URL is not set` किंवा `ADMIN_USERNAME and ADMIN_PASSWORD must be set` | Render → Environment मध्ये ते variable टाका |
| Login ला "Wrong username or password" | Render मधला `ADMIN_PASSWORD` तपासा (बदलल्यावर service restart होते) |
| `SSL/TLS required` error | Neon string च्या शेवटी `?sslmode=require` हवे |
| Vercel वर refresh केल्यावर 404 | `frontend/vercel.json` repo मध्ये आहे ना ते पाहा; Root Directory `frontend` असावी |
