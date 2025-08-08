const express = require("express");
const path = require("path");
const { initializeApp } = require("firebase/app");
const {
  getDatabase,
  ref,
  push,
  set,
  get,
  child,
  update,
  remove,
} = require("firebase/database");

const os = require("os");
const app = express();
const PORT = 3000;
const cron = require("node-cron");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBb2Ntswgw_s8IZfeW7uK9HYXT5e2_Xn64",
  authDomain: "dbweb-690f4.firebaseapp.com",
  databaseURL: "https://dbweb-690f4-default-rtdb.firebaseio.com",
  projectId: "dbweb-690f4",
  storageBucket: "dbweb-690f4.firebasestorage.app",
  messagingSenderId: "555532137516",
  appId: "1:555532137516:web:9b797965d92f4b58f80d89",
  measurementId: "G-TGZ88HJ2QB",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Tambah Data
app.post("/tambah", async (req, res) => {
  const dataBaru = req.body;
  const idBaru = push(ref(db, "datamhs")).key;

  // Tambahkan kolom status default false, jika belum ada
  const dataLengkap = {
    ...dataBaru,
    status: false, // otomatis tanpa user input
  };

  await set(ref(db, "datamhs/" + idBaru), dataLengkap);
  res.send("Baris baru berhasil ditambahkan");
});

// Ambil semua data
app.get("/data", async (req, res) => {
  try {
    const db = getDatabase();
    const dbRef = ref(db, "datamhs");
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      res.json(snapshot.val());
    } else {
      res.json({});
    }
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data" });
  }
});

// Update data
app.post("/update", (req, res) => {
  const { id, ...fields } = req.body;
  if (!id) return res.status(400).send("ID diperlukan");
  update(ref(db, `datamhs/${id}`), fields)
    .then(() => res.send("Update sukses"))
    .catch((err) => res.status(500).send(err.message));
});

// Hapus data
app.post("/hapus", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).send("ID diperlukan");
  remove(ref(db, `datamhs/${id}`))
    .then(() => res.send("Hapus sukses"))
    .catch((err) => res.status(500).send(err.message));
});

app.post("/tambahkolom", async (req, res) => {
  const { kolom, tipe } = req.body;
  if (!kolom || !tipe)
    return res.status(400).send("Kolom dan tipe wajib diisi.");

  let nilaiAwal;
  switch (tipe) {
    case "string":
      nilaiAwal = "";
      break;
    case "number":
      nilaiAwal = 0;
      break;
    case "boolean":
      nilaiAwal = false;
      break;
    case "date":
      nilaiAwal = new Date().toISOString();
      break;
    default:
      return res.status(400).send("Tipe data tidak valid.");
  }

  const dbRef = ref(db, "datamhs");
  const snapshot = await get(dbRef);

  if (snapshot.exists()) {
    const updates = {};
    snapshot.forEach((child) => {
      const id = child.key;
      const data = child.val();
      if (!(kolom in data)) {
        updates[`datamhs/${id}/${kolom}`] = nilaiAwal;
      }
    });

    await update(ref(db), updates);
    res.send(`Kolom "${kolom}" dengan tipe "${tipe}" berhasil ditambahkan`);
  } else {
    res.send("Data kosong, tidak ada kolom yang diperbarui");
  }
});

// Edit nama kolom
app.post("/editkolom", async (req, res) => {
  const { dari, ke } = req.body;
  const snap = await get(ref(db, "datamhs"));
  const all = snap.val() || {};

  for (const id in all) {
    const data = all[id];
    if (data[dari] !== undefined) {
      data[ke] = data[dari];
      delete data[dari];
      await update(ref(db, "datamhs/" + id), data);
    }
  }
  res.send(`Kolom "${dari}" diubah menjadi "${ke}"`);
});

// Hapus kolom dari semua baris
app.post("/hapuskolom", async (req, res) => {
  const { kolom } = req.body;
  const snapshot = await get(ref(db, "datamhs"));
  const updates = {};

  if (!snapshot.exists()) {
    return res.status(404).send("Tidak ada data untuk dihapus kolomnya.");
  }

  snapshot.forEach((child) => {
    const data = child.val();
    if (data.hasOwnProperty(kolom)) {
      updates[`datamhs/${child.key}/${kolom}`] = null;
    }
  });

  await update(ref(db), updates);
  res.send(`Kolom "${kolom}" berhasil dihapus dari semua data.`);
});

// Contoh endpoint /cek-status
app.post("/cek-status", async (req, res) => {
  const { nama, nim } = req.body;

  try {
    const snapshot = await get(ref(db, "datamhs"));
    if (!snapshot.exists()) {
      return res.json({ status: false });
    }

    let ditemukan = false;
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.nama === nama && data.nim === nim && data.status === true) {
        ditemukan = true;
      }
    });

    res.json({ status: ditemukan });
  } catch (error) {
    res.status(500).json({ error: "Gagal memeriksa status login." });
  }
});

app.get("/riwayat", async (req, res) => {
  try {
    const snapshot = await get(ref(db, "pengguna"));
    res.json(snapshot.exists() ? snapshot.val() : {});
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data riwayat" });
  }
});

app.post("/log-riwayat", async (req, res) => {
  const { nama, nim } = req.body;
  const id = push(ref(db, "pengguna")).key;
  const waktu = new Date().toLocaleString("id-ID");

  await set(ref(db, `pengguna/${id}`), { nama, nim, waktu });

  res.send("Riwayat disimpan");
});

// Cron job untuk menghapus data lebih dari 30 hari setiap hari jam 00:00
// URL database Firebase Realtime
const DB_URL = "https://dbweb-690f4-default-rtdb.firebaseio.com/pengguna.json";

// Fungsi untuk hapus data yang lebih dari 30 hari
async function hapusDataLama() {
  try {
    const res = await fetch(DB_URL);
    const data = await res.json();

    if (!data) {
      console.log("Tidak ada data.");
      return;
    }

    const sekarang = new Date();

    const hapusPromises = Object.entries(data).map(async ([id, user]) => {
      if (!user.waktu) return;

      const waktuAkses = new Date(user.waktu);
      const selisihHari = (sekarang - waktuAkses) / (1000 * 60 * 60 * 24);

      if (selisihHari >= 30) {
        await fetch(
          `https://dbweb-690f4-default-rtdb.firebaseio.com/pengguna/${id}.json`,
          {
            method: "DELETE",
          }
        );
        console.log(
          `Data ${user.nama || id} dihapus karena lebih dari 30 hari.`
        );
      }
    });

    await Promise.all(hapusPromises);
    console.log("Pembersihan data selesai.");
  } catch (err) {
    console.error("Gagal memeriksa data lama:", err);
  }
}

// Jalankan sekali
hapusDataLama();

// Kalau mau dijalankan otomatis tiap hari:
setInterval(hapusDataLama, 24 * 60 * 60 * 1000); // setiap 24 jam

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`IP Lokal: http://${getLocalIP()}:${PORT}`);
});
