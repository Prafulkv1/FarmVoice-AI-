# FarmVoice AI – Regional Language AI Assistant for Farmers

A professional, responsive web application providing a secure authentication system
(registration + login) and a farmer dashboard layout for FarmVoice AI.

**Tech stack:** React.js + Vite (frontend), Python Flask (backend), MySQL 8.0 (database).

> **Note:** The AI assistant, crop info, weather, government schemes and market prices
> are planned for future phases. This release covers authentication + dashboard layout.

---

## 📁 Project Structure

```
farmvoice-ai/
├── README.md
├── .gitignore
├── database/
│   └── farmvoice_ai_db.sql
├── backend/
│   ├── run.py
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   └── app/
│       ├── __init__.py
│       ├── config.py
│       ├── models/
│       │   └── farmer.py
│       ├── routes/
│       │   └── auth_routes.py
│       ├── services/
│       │   └── auth_service.py
│       └── utils/
│           └── validators.py
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example
    ├── .gitignore
    ├── public/
    │   ├── images/
    │   └── logo/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── assets/
        │   ├── images/
        │   └── icons/
        ├── components/
        │   ├── AuthProvider.jsx
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── DashboardHeader.jsx
        │   ├── DashboardCard.jsx
        │   └── FormInput.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   └── NotFound.jsx
        ├── services/
        │   ├── api.js
        │   └── authService.js
        ├── styles/
        │   ├── global.css
        │   ├── components.css
        │   ├── navbar.css
        │   ├── login.css
        │   ├── register.css
        │   └── dashboard.css
        └── utils/
            └── validation.js
```

---

## 🗄️ Phase 1 & 2 – MySQL Database

### 1. Start MySQL
Make sure MySQL 8.0 is running (port `3306`).

### 2. Create the database and table
Run the SQL script:

```sql
mysql -u root -p < database/farmvoice_ai_db.sql
```

Or execute the contents of `database/farmvoice_ai_db.sql` in your MySQL client.

This creates:
- Database `farmvoice_ai_db`
- Table `farmers` with `farmer_id` (AUTO_INCREMENT PK), `farm_name`, `username` (UNIQUE),
  `email` (UNIQUE), `mobile_number`, `password_hash`, `created_at`.

---

## 🐍 Phase 3+ – Backend Setup

### 1. Create and activate a virtual environment
```powershell
# From the backend folder
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install dependencies
```powershell
pip install -r requirements.txt
```

### 3. Configure environment
Copy the example file and edit it with your MySQL credentials:

```powershell
copy .env.example .env
```

Then open `.env` and set at minimum:
- `MYSQL_PASSWORD` → your MySQL root (or app user) password
- `SECRET_KEY` and `JWT_SECRET_KEY` → strong random values (important in production)

Example `.env` snippet:
```
MYSQL_USER=root
MYSQL_PASSWORD=your_actual_mysql_password
MYSQL_DB=farmvoice_ai_db
JWT_SECRET_KEY=a-long-random-secret
SECRET_KEY=a-long-random-secret
```

> **Important:** This app does **not** use hardcoded credentials. You must supply your
> MySQL password in `.env` for the backend to connect to the database.

### 4. Run the Flask backend
```powershell
python run.py
```
Backend runs on: **http://localhost:5000**

API endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET  /api/auth/profile` (JWT-protected)
- `POST /api/auth/logout` (JWT-protected, clears cookies)

---

## 💻 Frontend Setup

### 1. Install dependencies
```powershell
cd frontend
npm install
```

### 2. Start the Vite dev server
```powershell
npm run dev
```
Frontend runs on: **http://localhost:5173**

The Vite dev server proxies `/api` requests to `http://localhost:5000`, so
cookie-based JWT authentication works on a single origin during development.

---

## 🧪 Testing Workflow

1. **Registration** – Open `http://localhost:5173/register`, fill all fields, submit.
   - Verify the farmer appears in MySQL (`SELECT * FROM farmers;`).
   - Verify `farmer_id` was auto-generated.
   - Try duplicate username / email → should return a 409 error.
   - Try invalid mobile or mismatched passwords → field errors.
2. **Login** – Open `http://localhost:5173/login`, submit valid credentials.
   - Should redirect to `/dashboard`.
   - Invalid credentials → generic "Invalid username or password" error.
3. **Dashboard** – Should show the logged-in farmer's username, farm name and
   Farmer ID fetched from Flask (`GET /api/auth/profile`).
4. **Logout** – Click Logout → clears the session and returns to `/login`.
5. **Protected route** – Visiting `/dashboard` without a session redirects to `/login`.

---

## 🔐 Security Highlights

- Passwords hashed with Werkzeug (never stored plain text).
- JWT access token stored in an **HttpOnly** cookie (SameSite=Lax).
- CSRF double-submit protection on cookie state-changing endpoints.
- CORS configured for the frontend origin with credentials.
- Protected dashboard route (unauthenticated access redirects to login).
- SQLAlchemy ORM with parameterised queries (SQL injection prevention).
- Unique constraints on `username` and `email`.

---

## 📦 Scripts

Backend (inside `backend/`):
```powershell
pip install -r requirements.txt
python run.py
```

Frontend (inside `frontend/`):
```powershell
npm install
npm run dev
npm run build
```

---

## 🛡️ License

MIT
