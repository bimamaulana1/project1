require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const url = require("url");
const os = require("os");

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parsing DATABASE_URL
const dbUrl = new URL(process.env.MYSQLURI);

const db = mysql.createConnection({
  host: dbUrl.hostname,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace("/", ""),
  port: dbUrl.port,
});

// Tes koneksi
db.connect((err) => {
  if (err) {
    console.error("❌ Gagal koneksi ke database:", err.message);
  } else {
    console.log("✅ Terkoneksi ke database dari URI");
  }
});

// Endpoint API
app.get("/data", (req, res) => {
  db.query("SELECT * FROM user", (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
    } else {
      res.json(results);
    }
  });
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

app.listen(port, () => {
  console.log(`Server berjalan di http://${getLocalIP()}:${port}`);
});
