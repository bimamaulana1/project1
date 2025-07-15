require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

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

// Tampilkan semua data
app.get("/data", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json(results);
  });
});

// 🔧 Endpoint untuk menambah kolom
app.post("/tambah-kolom", (req, res) => {
  const { namaKolom, tipeData } = req.body;

  if (!namaKolom || !tipeData) {
    return res
      .status(400)
      .json({ error: "namaKolom dan tipeData wajib diisi" });
  }

  const query = `ALTER TABLE users ADD \`${namaKolom}\` ${tipeData}`;

  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json({
      message: `Kolom '${namaKolom}' berhasil ditambahkan dengan tipe ${tipeData}`,
    });
  });
});

app.post("/update-user", (req, res) => {
  const { id, kolom, nilaiBaru } = req.body;

  if (!id || !kolom || nilaiBaru === undefined) {
    return res
      .status(400)
      .json({ error: "id, kolom, dan nilaiBaru wajib diisi" });
  }

  const query = `UPDATE users SET \`${kolom}\` = ? WHERE id = ?`;
  db.query(query, [nilaiBaru, id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json({ message: "Data berhasil diperbarui" });
  });
});

// Hapus user berdasarkan id
app.post("/hapus-user", (req, res) => {
  const { id } = req.body;
  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "User berhasil dihapus" });
  });
});

// Endpoint update nilai status (checkbox)
app.post("/update-checkbox", (req, res) => {
  const { id, status } = req.body;
  db.query(
    "UPDATE users SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Status berhasil diperbarui" });
    }
  );
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
