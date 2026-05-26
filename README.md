# Olympus Fitness Center - Gym Automation System 🏋️

A modern, N-Tier Gym Management & Automation System built using **FastAPI (Python)** for the Backend, **React Vite (JavaScript)** with **Vanilla CSS & Recharts** for the Frontend, and **MySQL** as the database with full automation using **Stored Procedures & Triggers**.

---

## 🌟 Key Features

1. **📊 Dashboard (Control Panel)**
   * Dynamic **Monthly Revenue** chart and **Membership Distribution** status diagram.
   * Real-time statistics: Total Members, Active Memberships, Today's Check-ins, Monthly Revenue, and Total Turnover.
   * Recent payment transaction logs.

2. **👥 Member Management**
   * Complete CRUD operations (Create, Read, Update, Delete) for members.
   * Automatic TCKN validation (11 digits) and optional Passport number support.
   * **🔍 Unified Member Detail Portal (Tabbed View)**: Click the details icon to view complete Profile, Membership Package History, Payment History & Balance Statement (indicating debt/credit status), and workout attendance log.

3. **🏷️ Membership Packages**
   * Customize pricing and membership duration in months.
   * Automatic package tier categorization: *🥉 Bronze*, *🥈 Silver*, *🥇 Gold*, and *💎 Platinum* based on subscription duration.
   * Database foreign-key protection to prevent accidental deletion of packages assigned to active members.

4. **🎯 Memberships**
   * Register members to specific packages with custom starting dates.
   * Automatic end-date calculation handled directly by the database.
   * Subscription status filters: *Active, Inactive (Expired), and Pending (Waiting for start date)*.

5. **💳 Payments (Financial Management)**
   * Record income payments using Cash (*Nakit*), Credit Card (*Kredi Kartı*), or Bank Transfer (*Banka Havalesi*).
   * Automatic calculation of average payments, total revenue, and transaction counts.

6. **🚪 Member Attendance (Check-in System)**
   * **🏃 Smart Interactive Search**: Replaced long dropdown selectors with a smart, autocomplete-based search bar. Receptionists can search by Name, TCKN, Passport, or Member ID to filter instantly.
   * Real-time check-in and check-out logs.
   * Automatic workout duration calculation in minutes upon check-out.

---

## 🛡️ Database Automation (MySQL Stored Procedures & Triggers)

This project implements a highly secure, database-first architecture by ensuring that **all key CRUD operations and status checks are handled directly inside MySQL via procedures and triggers**:

* **`tg_gym_giris_kontrol` (BEFORE INSERT Trigger)**: Automatically rejects check-in attempts if the member's subscription has expired or is inactive.
* **`tg_gym_cakisma_kontrol` (BEFORE INSERT Trigger)**: Prevents overlapping active membership date ranges for the same member.
* **`tg_gym_giris_cikis_sure_hesapla_update` (BEFORE UPDATE Trigger)**: Automatically calculates workout duration in minutes upon check-out.
* **`gym_DashboardOzeti` & `gym_UyelikleriGetir`**: Automatically updates expired memberships' status to `Pasif` when executed.
* **`gym_UyeBakiye`**: Computes the member's net financial balance (Net Bakiye) by subtracting total payments made from the total cost of purchased membership packages.

---

## 🛠️ System Requirements

Ensure you have the following installed:
* **Python 3.8+**
* **Node.js LTS (v16+)**
* **MySQL Server 8.0+**

---

## 🚀 Installation & Running the Application

### 1. Database Configuration (MySQL)
1. Create a new database named `gym_otomasyonu` in your MySQL Server.
2. Edit the backend environment variables in `backend/.env` to match your MySQL port, user, and password:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=Bilal12345
   DB_NAME=gym_otomasyonu
   ```
3. Update database credentials in `database/setup_db.py` (lines 4-10) to match your environment.
4. Run the database setup script to apply tables, views, stored procedures, and triggers:
   ```bash
   cd database
   python setup_db.py
   ```

### 2. Running the Backend (Python FastAPI)
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Start the FastAPI server by double-clicking **`start_backend.bat`** in the root directory, or run:
   ```bash
   python app.py
   ```
   *The backend will run at: http://localhost:8000*

### 3. Running the Frontend (React Vite)
1. Navigate to the frontend directory and install npm packages:
   ```bash
   cd frontend
   npm install
   ```
2. Start the React development server by double-clicking **`start_frontend.bat`** in the root directory, or run:
   ```bash
   npm run dev
   ```
   *The frontend will run at: http://localhost:5173*
