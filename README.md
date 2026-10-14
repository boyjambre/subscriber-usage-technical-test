Subscriber Usage API & Snapshot Automation

Project ini dibuat untuk Technical Test V2. Project berisi backend untuk mencatat dan mengambil data penggunaan pelanggan, otomatisasi snapshot CSV, script penghapusan snapshot lama, query SQL, dan pengujian otomatis.

Setup dan konfigurasi

1. Buka terminal pada folder project.
2. Instal dependency:

   npm install

3. Salin file konfigurasi contoh jika diperlukan.

PowerShell:

    Copy-Item .env.example .env

4. Jalankan backend:

   npm start

Secara default, backend berjalan di http://localhost:3000.

Data penggunaan disimpan menggunakan in-memory storage sesuai instruksi tes. Data akan hilang saat proses backend dihentikan atau dijalankan ulang.

Q1 — Subscriber Usage API

API digunakan untuk menambahkan dan mengambil data penggunaan pelanggan. Setiap record memuat subscriberId, callMinutes, smsCount, dan dataUsageMB.

Endpoint yang tersedia:

- GET /health — memeriksa status API.
- POST /api/usage — menambahkan data penggunaan.
- GET /api/usage — mengambil seluruh data penggunaan.
- GET /api/usage?subscriberId=SUB01 — mengambil data berdasarkan ID pelanggan.
- GET /api/usage/:subscriberId — mengambil data milik satu pelanggan.

API memvalidasi input sebelum menyimpan data. subscriberId tidak boleh kosong, nilai penggunaan harus berupa angka valid dan tidak negatif, serta smsCount harus berupa bilangan bulat. Jika input tidak sesuai, API mengembalikan status 400 dengan kode VALIDATION_ERROR.

Contoh request untuk menambahkan data:

    $body = @{
      subscriberId = "SUB01"
      callMinutes = 40
      smsCount = 10
      dataUsageMB = 1500
    } | ConvertTo-Json

    Invoke-RestMethod `
      -Uri "http://localhost:3000/api/usage" `
      -Method Post `
      -ContentType "application/json" `
      -Body $body

Untuk melihat data yang tersimpan:

    Invoke-RestMethod -Uri "http://localhost:3000/api/usage" | ConvertTo-Json -Depth 5

Q2 — Usage Snapshot Automation

Script snapshot mengambil data dari endpoint GET /api/usage lalu menyimpannya ke file CSV di folder snapshots. Nama file menggunakan format subscriber-usage_YYYY-MM-DD_HH-mm-ss.csv dengan zona waktu Asia/Jakarta.

Membuat satu snapshot secara langsung:

    npm run snapshot:once

Menjalankan scheduler:

    npm run snapshot:cron

Scheduler berjalan setiap hari pukul 08.00, 12.00, dan 15.00 WIB. Proses scheduler harus tetap aktif agar jadwal berjalan.

Menjalankan cleanup:

    npm run cleanup

Script cleanup menghapus file CSV di folder snapshot yang waktu modifikasinya lebih dari 30 hari. Cleanup dijalankan terpisah dari scheduler snapshot.

Q3 — Subscriber & Usage SQL

Query SQL disimpan di sql/queries.sql dan diuji menggunakan MySQL melalui phpMyAdmin pada database hasbul_test_v2.

Query yang dibuat mencakup:

- Menambahkan pelanggan Fajar dengan paket Basic dan tanggal aktivasi 24 Januari 2024.
- Mengubah paket Fajar menjadi Premium.
- Menghitung total penggunaan data pelanggan Premium.
- Menampilkan tiga pelanggan dengan penggunaan data tertinggi.
- Mencari pelanggan dengan rata-rata durasi telepon maksimal 30 menit menggunakan subquery.

Untuk query tiga pelanggan teratas, gunakan LIMIT 3 agar sesuai dengan MySQL. Pastikan ID pelanggan yang akan ditambahkan belum digunakan sebelum menjalankan INSERT pada database lain.

Q4 — Troubleshoot & Explain

Fungsi getTotalUsageMB() pada soal mengalami bug karena callback reduce() tidak mengembalikan nilai akumulasi dan tidak menetapkan nilai awal. Perbaikannya adalah mengembalikan hasil penjumlahan pada setiap iterasi dan memberikan nilai awal 0.

Kode perbaikan berada di q4_debug.js. Jalankan pengujian dengan:

    node q4_debug.js

Hasil pengujian yang sudah diperoleh:

- Total penggunaan: 3200 MB
- Array kosong: 0 MB

Pengujian otomatis

Jalankan seluruh automated test dengan:

    npm test

Pengujian mencakup status endpoint health, penambahan dan pengambilan data, validasi input, serta penanganan karakter khusus pada output CSV. Pengujian Q4 dijalankan terpisah menggunakan q4_debug.js.

Hasil automated test yang sudah diperoleh:

- 4 test berhasil
- 0 test gagal

Struktur project

    src/
      app.js
      server.js
    scripts/
      snapshot.js
      cleanup-snapshots.js
    sql/
      queries.sql
    test/
      app.test.js
    snapshots/
    q4_debug.js
    package.json
    README.md

Git dan GitHub

Untuk mengunggah project ke GitHub, jalankan perintah berikut dari folder project:

    git init
    git add .
    git commit -m "Membuat API dan otomatisasi snapshot penggunaan pelanggan"
    git branch -M main
    git remote add origin <URL_REPOSITORY_GITHUB>
    git push -u origin main

Ganti <URL_REPOSITORY_GITHUB> dengan URL repository milik sendiri. Jangan mengunggah file .env yang berisi konfigurasi rahasia atau folder node_modules.
