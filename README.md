# Olympus Fitness Center - Gym Automation System 🏋️

Sistem Manajemen & Otomasi Gym N-Tier modern yang dibangun menggunakan **FastAPI (Python)** untuk Backend, **React Vite (JavaScript)** dengan **Vanilla CSS & Recharts** untuk Frontend, dan **MySQL** sebagai database dengan otomasi penuh menggunakan **Stored Procedures & Triggers**.

---

## 🌟 Fitur Utama

1. **📊 Kontrol Paneli (Dashboard)**
   * Grafik Pendapatan Bulanan dinamis (*Monthly Revenue*) dan Diagram Status Keanggotaan (*Membership Distribution*).
   * Statistik real-time: Total Anggota, Keanggotaan Aktif, Kunjungan Hari Ini, Pendapatan Bulan Ini, dan Total Ciro.
   * Log transaksi pembayaran terbaru (*Recent Transactions*).

2. **👥 Üye Yönetimi (Manajemen Anggota)**
   * Pendaftaran, pembaruan, pencarian, dan penghapusan data anggota secara lengkap (CRUD).
   * Validasi otomatis TCKN (11 hane) dan nomor Paspor opsional.
   * **🔍 Portal Detail Anggota Terpadu (Tabbed View)**: Klik ikon pencarian untuk melihat Profil lengkap, Riwayat Paket Keanggotaan, Riwayat Pembayaran beserta Saldo Neraca (apakah anggota memiliki utang/borç atau kelebihan bayar), serta Riwayat kehadiran latihan.

3. **🏷️ Üyelik Paketleri (Manajemen Paket)**
   * Pengaturan harga dan durasi keanggotaan dalam rentang bulan.
   * Kategori paket otomatis: *🥉 Bronze*, *🥈 Silver*, *🥇 Gold*, dan *💎 Platinum* berdasarkan lama bulan langganan.
   * Proteksi database (Foreign Key) agar paket yang sedang digunakan oleh anggota aktif tidak dapat dihapus secara tidak sengaja.

4. **🎯 Üyelikler (Langganan Anggota)**
   * Mendaftarkan anggota ke dalam paket keanggotaan tertentu dengan tanggal mulai kustom.
   * Perhitungan tanggal jatuh tempo/selesai otomatis oleh database.
   * Filter status langganan: *Aktif, Pasif (Kedaluwarsa), dan Beklemede (Menunggu Tanggal Mulai)*.

5. **💳 Ödemeler (Manajemen Keuangan)**
   * Pencatatan pembayaran uang masuk dengan metode tunai (*Tunai/Nakit*), kartu kredit (*Kartu Kredit/Kredi Kartı*), atau transfer bank (*Banka Havalesi*).
   * Penghitungan otomatis rata-rata pembayaran, total pendapatan kas, dan jumlah transaksi.

6. **🚪 Üye Katılım (Sistem Absensi Kehadiran)**
   * **🏃 Pencarian Cepat Interaktif**: Mengganti select dropdown panjang dengan text input pencarian cerdas. Resepsionis cukup mengetikkan Nama, TCKN, Pasaport, atau ID anggota untuk langsung menyaring anggota.
   * Pencatatan waktu masuk (*check-in*) dan waktu keluar (*check-out*).
   * Penghitungan otomatis durasi latihan dalam menit setelah check-out.

---

## 🛡️ Otomasi Database (MySQL Stored Procedures & Triggers)

Proyek ini menerapkan konsep keamanan data tingkat tinggi dengan memastikan bahwa **seluruh operasi CRUD dikelola langsung oleh Stored Procedure dan Trigger di MySQL**:

* **`tg_gym_giris_kontrol` (Trigger BEFORE INSERT)**: Otomatis menolak masuk (*check-in*) anggota apabila keanggotaannya sudah kedaluwarsa atau tidak aktif.
* **`tg_gym_cakisma_kontrol` (Trigger BEFORE INSERT)**: Mencegah adanya tabrakan tanggal keanggotaan aktif (*overlapping active memberships*) untuk satu anggota yang sama di waktu bersamaan.
* **`tg_gym_giris_cikis_sure_hesapla_update` (Trigger BEFORE UPDATE)**: Otomatis menghitung selisih menit antara jam masuk dan jam keluar anggota saat *check-out* dilakukan.
* **`gym_DashboardOzeti` & `gym_UyelikleriGetir`**: Secara otomatis mengubah status membership yang sudah melewati masa bitis menjadi `Pasif` ketika dieksekusi.
* **`gym_UyeBakiye`**: Menghitung saldo neraca bersih (*Net Bakiye*) anggota dari selisih total harga paket keanggotaan yang dibeli dengan total uang yang sudah dibayarkan.

---

## 🛠️ Persyaratan Sistem

Pastikan Anda telah memasang:
* **Python 3.8+**
* **Node.js LTS (v16+)**
* **MySQL Server 8.0+**

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Konfigurasi Database (MySQL)
1. Buat database baru bernama `gym_otomasyonu` di MySQL Server Anda.
2. Edit konfigurasi database pada file backend env di `backend/.env` dan sesuaikan port, user, serta password database Anda:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=Bilal12345
   DB_NAME=gym_otomasyonu
   ```
3. Konfigurasikan pula file `database/setup_db.py` di baris 4-10 agar sesuai dengan akun MySQL Anda.
4. Jalankan skrip setup database untuk menerapkan fungsi, pemicu (trigger), dan prosedur tersimpan ke MySQL:
   ```bash
   cd database
   python setup_db.py
   ```

### 2. Menjalankan Backend (Python FastAPI)
1. Masuk ke direktori backend dan pasang pustaka yang diperlukan:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Jalankan server FastAPI dengan mengklik ganda file **`start_backend.bat`** di direktori utama, atau jalankan perintah berikut:
   ```bash
   python app.py
   ```
   *Backend akan berjalan di: http://localhost:8000 *

### 3. Menjalankan Frontend (React Vite)
1. Masuk ke direktori frontend dan pasang package npm:
   ```bash
   cd frontend
   npm install
   ```
2. Jalankan server React dengan mengklik ganda file **`start_frontend.bat`** di direktori utama, atau jalankan perintah berikut:
   ```bash
   npm run dev
   ```
   *Frontend akan berjalan di: http://localhost:5173  *
