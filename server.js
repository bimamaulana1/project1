require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Koneksi ke MySQL
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

db.connect((err) => {
  if (err) {
    console.error("Koneksi database gagal:", err);
  } else {
    console.log("Terhubung ke database MySQL");
  }
});

// Endpoint tes
app.get("/", (req, res) => {
  res.send("API berjalan dengan baik");
});

// Endpoint untuk menampilkan semua data dari tabel `data`
app.get("/data", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json(results);
  });
});

// Menjalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
