// ==========================================
// 1. KONFIGURASI
// ==========================================
const SUPABASE_URL = "https://ijipnnhgbzwatdzbdlek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaXBubmhnYnp3YXRkemJkbGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjc3NDIsImV4cCI6MjEwMzkwMzc0Mn0.TviHZ5O25ZSif9DawhcywKD9c3d4bv3yGnLPGk6iMAU";
const NOMOR_WA = "6285161999315";

const NAMA_TABEL_SANTRI = "Data_Santri";
const NAMA_TABEL_RIWAYAT = "Log_Transaksi";

// TODO: sesuaikan dengan nama tabel SPP di Supabase Anda.
// Kolom yang dikenali (huruf besar/kecil bebas): ID atau UID, Bulan, Tahun, Nominal, Status, Tanggal_Bayar
const NAMA_TABEL_SPP = "Tagihan_SPP";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let dataSantriSaatIni = null;
let uidTerakhir = null;
let logDataSaatIni = [];
let sppDataSaatIni = [];
let sedangMencari = false;

const NAMA_BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

// ==========================================
// 2. FUNGSI BANTUAN
// ==========================================
function tampilkanError(pesan) {
  const el = document.getElementById("pesanError");
  if (!el) return;
  if (!pesan) { el.style.display = "none"; return; }
  el.style.display = "block";
  el.classList.remove("hidden");
  el.textContent = pesan;
}

function formatRp(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

function esc(teks) {
  return String(teks == null ? "" : teks)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return null;
}

function ambilTanggalLokal(iso) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(iso));
}

function formatWaktuTampil(iso) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date(iso)).replace(",", "");
}

// ==========================================
// 3. CARI DATA SANTRI
// ==========================================
async function cariSantri(uid) {
  if (sedangMencari) return;
  sedangMencari = true;
  const btn = document.getElementById("btnCari");
  if (btn) btn.disabled = true;

  try {
    tampilkanError(null);
    document.getElementById("spinner").classList.remove("hidden");

    const { data: santri, error } = await supabaseClient
      .from(NAMA_TABEL_SANTRI).select("*").eq("UID", uid);
    if (error) throw error;

    if (!santri || santri.length === 0) {
      document.getElementById("hasilWrapper").classList.add("hidden");
      tampilkanError("❌ Data santri tidak ditemukan!");
      return;
    }

    const s = santri[0];

    // Riwayat transaksi (difilter dengan kolom ID)
    const { data: riwayat, error: errR } = await supabaseClient
      .from(NAMA_TABEL_RIWAYAT).select("*").eq("ID", s.ID)
      .order("Waktu", { ascending: false });
    if (errR) throw errR;

    // Tagihan SPP (tidak menggagalkan halaman bila tabel belum ada)
    sppDataSaatIni = await ambilSpp(s);

    uidTerakhir = uid;
    dataSantriSaatIni = s;
    logDataSaatIni = riwayat || [];

    renderData();
  } catch (err) {
    console.error("Error Koneksi:", err);
    tampilkanError("Kendala koneksi ke server Supabase: " + (err.message || err));
  } finally {
    document.getElementById("spinner").classList.add("hidden");
    sedangMencari = false;
    if (btn) btn.disabled = false;
  }
}

async function ambilSpp(santri) {
  try {
    let res = await supabaseClient.from(NAMA_TABEL_SPP).select("*").eq("ID", santri.ID);
    if ((!res.data || res.data.length === 0) && !res.error) {
      res = await supabaseClient.from(NAMA_TABEL_SPP).select("*").eq("UID", santri.UID);
    }
    if (res.error) {
      console.warn("Tabel SPP tidak dapat dibaca:", res.error.message);
      return [];
    }
    return res.data || [];
  } catch (e) {
    console.warn("Gagal memuat SPP:", e);
    return [];
  }
}

// ==========================================
// 4. RENDER
// ==========================================
function renderData() {
  document.getElementById("pesanAwal").classList.add("hidden");
  document.getElementById("hasilWrapper").classList.remove("hidden");
  document.getElementById("namaSantri").textContent = dataSantriSaatIni.Nama || "-";
  document.getElementById("saldoSantri").textContent = formatRp(pick(dataSantriSaatIni, ["Saldo", "saldo"]));

  const pesanWA =
    "_Assalamu'alaikum_ Ustadz.\n\n" +
    "Saya wali dari ananda *" + dataSantriSaatIni.Nama + "* dengan ID Kartu *" + uidTerakhir + "*.\n\n" +
    "Izin ingin *konfirmasi transfer* (top-up uang saku / pembayaran SPP) atau melaporkan kendala transaksi.\n\n" +
    "Berikut saya lampirkan *screenshot bukti transfer*.\n\n" +
    "Mohon bantuannya untuk diproses. _Jazakumullahu khairan._";
  document.getElementById("tombolWA").href = "https://wa.me/" + NOMOR_WA + "?text=" + encodeURIComponent(pesanWA);

  renderMutasiSection();
  renderSpp();
}

function renderMutasiSection() {
  if (logDataSaatIni.length === 0) {
    document.getElementById("riwayatWrapper").classList.add("hidden");
    document.getElementById("tidakAdaRiwayat").classList.remove("hidden");
    return;
  }
  document.getElementById("riwayatWrapper").classList.remove("hidden");
  document.getElementById("tidakAdaRiwayat").classList.add("hidden");

  const tgl = logDataSaatIni.map((r) => ambilTanggalLokal(r.Waktu)).sort();
  const min = tgl[0], max = tgl[tgl.length - 1];

  const satu = document.getElementById("tanggalSatu");
  satu.min = min; satu.max = max; satu.value = max;
  const awal = document.getElementById("tanggalAwal");
  awal.min = min; awal.max = max; awal.value = min;
  const akhir = document.getElementById("tanggalAkhir");
  akhir.min = min; akhir.max = max; akhir.value = max;

  terapkanFilterTanggal();
}

function terapkanFilterTanggal() {
  const mode = document.querySelector('input[name="modeTanggal"]:checked').value;
  let a, b;
  if (mode === "satu_hari") {
    a = b = document.getElementById("tanggalSatu").value;
  } else {
    a = document.getElementById("tanggalAwal").value;
    b = document.getElementById("tanggalAkhir").value;
  }
  const hasil = logDataSaatIni.filter((r) => {
    const t = ambilTanggalLokal(r.Waktu);
    return (!a || t >= a) && (!b || t <= b);
  });
  renderTabelRiwayat(hasil);
  renderTabelHarian(hasil);
}

function renderTabelRiwayat(data) {
  const w = document.getElementById("tabelRiwayat");
  if (data.length === 0) {
    w.innerHTML = '<p style="color:#6b7280;">Tidak ada transaksi pada tanggal yang dipilih.</p>';
    return;
  }
  let html = "<table><thead><tr><th>Waktu Transaksi 📅</th><th>Nominal (Rp) 💵</th><th>Keterangan Status 📝</th></tr></thead><tbody>";
  data.forEach((r) => {
    html += "<tr><td>" + formatWaktuTampil(r.Waktu) + "</td><td>" + formatRp(r.Nominal) + "</td><td>" + esc(r.Status) + "</td></tr>";
  });
  w.innerHTML = html + "</tbody></table>";
}

function renderTabelHarian(data) {
  const w = document.getElementById("tabelHarian");
  if (data.length === 0) { w.innerHTML = ""; return; }

  const grup = {};
  data.forEach((r) => {
    const t = ambilTanggalLokal(r.Waktu);
    const key = t + "||" + r.Status;
    if (!grup[key]) grup[key] = { tanggal: t, status: r.Status, total: 0 };
    grup[key].total += Number(r.Nominal) || 0;
  });
  const daftar = Object.values(grup).sort((x, y) => x.tanggal.localeCompare(y.tanggal));

  let html = "<table><thead><tr><th>Tanggal 📅</th><th>Keterangan Status 📝</th><th>Total Nominal (Rp) 💵</th></tr></thead><tbody>";
  daftar.forEach((i) => {
    const tt = new Date(i.tanggal + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
    html += "<tr><td>" + tt + "</td><td>" + esc(i.status) + "</td><td>" + formatRp(i.total) + "</td></tr>";
  });
  w.innerHTML = html + "</tbody></table>";
}

// ---------- SPP ----------
function namaBulan(b) {
  const n = Number(b);
  if (!isNaN(n) && n >= 1 && n <= 12) return NAMA_BULAN[n - 1];
  return String(b || "-");
}

function indeksBulan(b) {
  const n = Number(b);
  if (!isNaN(n) && n >= 1 && n <= 12) return n;
  const i = NAMA_BULAN.findIndex((x) => x.toLowerCase() === String(b).toLowerCase());
  return i >= 0 ? i + 1 : 0;
}

function sudahLunas(status) {
  const s = String(status || "").toLowerCase();
  return s.includes("lunas") && !s.includes("belum");
}

function renderSpp() {
  const tabel = document.getElementById("tabelSpp");
  const ringkas = document.getElementById("ringkasSpp");
  const kosong = document.getElementById("tidakAdaSpp");

  if (sppDataSaatIni.length === 0) {
    tabel.innerHTML = ""; ringkas.innerHTML = "";
    kosong.classList.remove("hidden");
    return;
  }
  kosong.classList.add("hidden");

  const baris = sppDataSaatIni.map((r) => ({
    bulan: pick(r, ["Bulan", "bulan"]),
    tahun: pick(r, ["Tahun", "tahun"]),
    nominal: Number(pick(r, ["Nominal", "nominal", "Jumlah", "jumlah"])) || 0,
    status: pick(r, ["Status", "status"]) || "Belum Lunas",
    tglBayar: pick(r, ["Tanggal_Bayar", "tanggal_bayar", "Tgl_Bayar"]),
  })).sort((a, b) => (Number(b.tahun) - Number(a.tahun)) || (indeksBulan(b.bulan) - indeksBulan(a.bulan)));

  const belum = baris.filter((r) => !sudahLunas(r.status));
  const totalBelum = belum.reduce((s, r) => s + r.nominal, 0);

  ringkas.innerHTML =
    '<div><div class="l">Bulan Belum Lunas</div><div class="v ' + (belum.length ? "merah" : "") + '">' + belum.length + " bulan</div></div>" +
    '<div><div class="l">Total Tunggakan</div><div class="v ' + (totalBelum ? "merah" : "") + '">' + formatRp(totalBelum) + "</div></div>";

  let html = "<table><thead><tr><th>Bulan 📅</th><th>Nominal (Rp) 💵</th><th>Status 📝</th><th>Tgl Bayar</th></tr></thead><tbody>";
  baris.forEach((r) => {
    const lunas = sudahLunas(r.status);
    const tgl = r.tglBayar ? ambilTanggalLokal(r.tglBayar).split("-").reverse().join("/") : "-";
    html += "<tr><td>" + esc(namaBulan(r.bulan)) + " " + esc(r.tahun || "") + "</td><td>" + formatRp(r.nominal) +
      '</td><td><span class="badge ' + (lunas ? "badge-lunas" : "badge-belum") + '">' + (lunas ? "Lunas" : "Belum Lunas") +
      "</span></td><td>" + tgl + "</td></tr>";
  });
  tabel.innerHTML = html + "</tbody></table>";
}

// ==========================================
// 5. EVENT LISTENERS
// ==========================================
document.getElementById("btnCari").addEventListener("click", () => {
  const uid = document.getElementById("uidInput").value.trim();
  if (!uid) { tampilkanError("❌ Silakan masukkan Nomor ID Kartu terlebih dahulu."); return; }
  cariSantri(uid);
});

document.getElementById("uidInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); if (!sedangMencari) document.getElementById("btnCari").click(); }
});

document.querySelectorAll('input[name="modeTanggal"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    document.getElementById("satuHariWrapper").style.display = radio.value === "satu_hari" ? "block" : "none";
    document.getElementById("rentangWrapper").classList.toggle("aktif", radio.value === "rentang");
    terapkanFilterTanggal();
  });
});

["tanggalSatu", "tanggalAwal", "tanggalAkhir"].forEach((id) =>
  document.getElementById(id).addEventListener("change", terapkanFilterTanggal)
);

window.addEventListener("unhandledrejection", (event) => {
  const p = String((event.reason && event.reason.message) || event.reason || "");
  if (p.includes("message channel closed") || p.includes("asynchronous response")) event.preventDefault();
});
