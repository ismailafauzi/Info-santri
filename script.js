<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portal Wali Santri - Al-Bashiroh</title>
<link rel="icon" type="image/jpeg" href="logo.jpg">
<style>
  :root {
    --hijau-tua: #0f766e;
    --hijau-muda: #14b8a6;
    --bg-terang: #e6f7f5;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    background: linear-gradient(to top, var(--hijau-tua) 0%, var(--hijau-muda) 30%, var(--bg-terang) 100%);
    background-attachment: fixed;
    min-height: 100vh;
    padding: 1.5rem 0.8rem;
  }
  .container {
    max-width: 680px;
    margin: 0 auto;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(4px);
    border-radius: 24px;
    padding: 1.2rem 1.4rem 1.6rem 1.4rem;
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }
  .banner-wali {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: linear-gradient(135deg, var(--hijau-tua) 0%, var(--hijau-muda) 100%);
    border-radius: 28px; padding: 2rem 1.5rem; margin-bottom: 1.5rem; color: white;
    box-shadow: 0 8px 24px rgba(15,118,110,0.35); text-align: center;
  }
  .banner-wali img {
    width: 72px; height: 72px; border-radius: 50%; object-fit: cover;
    border: 3px solid rgba(255,255,255,0.4); margin-bottom: 0.6rem;
  }
  .banner-wali h1 { font-size: 1.5rem; font-weight: 700; margin: 0.2rem 0 0.1rem 0; }
  .banner-wali .sub-judul { font-size: 1rem; font-weight: 600; margin: 0.1rem 0 0.2rem 0; opacity: 0.95; }
  .banner-wali .deskripsi { font-size: 0.9rem; opacity: 0.85; margin: 0.2rem 0 0 0; line-height: 1.4; }

  .kartu-form, .kartu-santri, .kartu-upload {
    background: white; border: 1px solid #e5e7eb; border-radius: 20px;
    padding: 1.2rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  label { font-size: 0.95rem; font-weight: 600; color: #111827; display: block; margin-bottom: 0.4rem; }
  input[type="text"], input[type="date"], select, input[type="file"] {
    width: 100%; font-size: 1rem; padding: 0.7rem; border-radius: 14px;
    border: 1px solid #d1d5db; margin-bottom: 0.8rem; background: #fff;
  }
  button, .btn {
    width: 100%; padding: 0.8rem 1rem; font-size: 1.05rem; font-weight: 600;
    border-radius: 16px; background-color: var(--hijau-tua); color: white; border: none;
    cursor: pointer; display: block; text-align: center; text-decoration: none;
  }
  button:hover, .btn:hover { background-color: #115e59; }
  button:disabled { opacity: 0.6; cursor: not-allowed; }

  .info-box { background: #dbeafe; color: #1e3a5f; border-radius: 16px; padding: 1rem 1.2rem; margin-bottom: 1rem; line-height: 1.6; }
  .error-box { background: #fee2e2; color: #991b1b; border-radius: 16px; padding: 0.9rem 1.1rem; margin-bottom: 1rem; }
  .success-box { background: #d1fae5; color: #065f46; border-radius: 16px; padding: 0.9rem 1.1rem; margin-bottom: 1rem; }

  .kartu-santri .label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }
  .kartu-santri .nilai-nama { font-size: 1.3rem; font-weight: 700; color: #111827; margin-top: 0.2rem; }
  .kartu-santri .nilai-saldo { font-size: 1.7rem; font-weight: 800; color: var(--hijau-tua); margin-top: 0.2rem; }

  h3 { text-align: left; color: #111827; }
  .mode-tanggal { display: flex; gap: 1rem; margin-bottom: 0.8rem; }
  .mode-tanggal label { display: flex; align-items: center; gap: 0.4rem; font-weight: 500; margin-bottom: 0; }
  .mode-tanggal input[type="radio"] { width: auto; margin: 0; }
  .rentang-wrapper { display: none; gap: 0.6rem; }
  .rentang-wrapper.aktif { display: flex; }
  .rentang-wrapper > div { flex: 1; }

  .table-scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.9rem; }
  th, td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid #e5e7eb; }
  th { color: #6b7280; font-size: 0.78rem; text-transform: uppercase; }

  .badge { display: inline-block; padding: 0.2rem 0.7rem; border-radius: 999px; font-size: 0.78rem; font-weight: 700; }
  .badge-lunas { background: #d1fae5; color: #065f46; }
  .badge-belum { background: #fee2e2; color: #991b1b; }
  .badge-pending { background: #fef3c7; color: #92400e; }

  .ringkas-spp { display: flex; gap: 0.6rem; margin-bottom: 0.8rem; flex-wrap: wrap; }
  .ringkas-spp > div { flex: 1; min-width: 140px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 14px; padding: 0.7rem 0.9rem; }
  .ringkas-spp .l { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; }
  .ringkas-spp .v { font-size: 1.15rem; font-weight: 800; color: var(--hijau-tua); }
  .ringkas-spp .v.merah { color: #b91c1c; }

  .wa-btn { background-color: #25D366; box-shadow: 0 4px 10px rgba(37,211,102,0.3); margin-top: 0.8rem; }
  .wa-btn:hover { background-color: #1ebc59; }
  .hidden { display: none; }
  .spinner { text-align: center; padding: 1rem; color: #6b7280; }
</style>
</head>
<body>

<div class="container">

  <div class="banner-wali">
    <img src="logo.jpg" alt="Logo Pesantren">
    <h1>Portal Tabungan &amp; Mutasi Santri</h1>
    <p class="sub-judul">Pondok Pesantren Al-Bashiroh Purwakarta</p>
    <p class="deskripsi">Pantau saldo, riwayat jajan, dan tagihan SPP ananda dengan mudah</p>
  </div>

  <div class="kartu-form">
    <label for="uidInput">🔑 Nomor ID Kartu Santri</label>
    <input type="text" id="uidInput" placeholder="Contoh: 1840474855">
    <button id="btnCari">🔍 Cari Data Santri</button>
  </div>

  <div id="pesanAwal" class="info-box">
    <i>Ahlan wa Sahlan</i>, <b>Bapak/Ibu Wali Santri</b>.<br><br>
    Silakan masukkan Nomor ID Kartu Ananda, lalu tekan tombol <b>Cari Data Santri</b> untuk melihat saldo, riwayat mutasi jajan, dan tagihan SPP bulanan.<br><br>
    <i>Jazakumullahu khairan</i> atas kepercayaan yang diberikan.
  </div>

  <div id="pesanError" class="error-box hidden"></div>
  <div id="pesanSukses" class="success-box hidden"></div>
  <div id="spinner" class="spinner hidden">Sedang mengambil data...</div>

  <div id="hasilWrapper" class="hidden">

    <div class="kartu-santri">
      <div class="label">Nama Santri</div>
      <div class="nilai-nama" id="namaSantri">-</div>
      <div class="label" style="margin-top: 0.9rem;">Sisa Saldo Saat Ini</div>
      <div class="nilai-saldo" id="saldoSantri">Rp 0</div>
    </div>

    <!-- ========== MUTASI ========== -->
    <div id="riwayatWrapper">
      <h3>📅 Filter Tanggal</h3>
      <div class="mode-tanggal">
        <label><input type="radio" name="modeTanggal" value="satu_hari" checked> Per 1 Hari</label>
        <label><input type="radio" name="modeTanggal" value="rentang"> Rentang Tanggal</label>
      </div>

      <div id="satuHariWrapper">
        <input type="date" id="tanggalSatu">
      </div>

      <div id="rentangWrapper" class="rentang-wrapper">
        <div><label>Dari</label><input type="date" id="tanggalAwal"></div>
        <div><label>Sampai</label><input type="date" id="tanggalAkhir"></div>
      </div>

      <h3>📜 Riwayat Mutasi Transaksi (Debit / Kredit)</h3>
      <p style="color:#6b7280; font-size:0.9rem; margin-top:-0.5rem;">Berikut adalah catatan pengeluaran jajan dan top-up ananda:</p>
      <div id="tabelRiwayat" class="table-scroll"></div>

      <h3>📊 Total Transaksi Per Tanggal</h3>
      <div id="tabelHarian" class="table-scroll"></div>
    </div>

    <div id="tidakAdaRiwayat" class="info-box hidden">📭 Belum ada riwayat transaksi jajan atau top-up untuk kartu ini.</div>

    <!-- ========== TAGIHAN SPP ========== -->
    <h3>🧾 Tagihan SPP Bulanan</h3>
    <div id="ringkasSpp" class="ringkas-spp"></div>
    <div id="tabelSpp" class="table-scroll"></div>
    <div id="tidakAdaSpp" class="info-box hidden">📭 Belum ada data tagihan SPP untuk santri ini.</div>

    <!-- ========== UPLOAD BUKTI TRANSFER ========== -->
    <div class="kartu-upload">
      <h3>📤 Form Upload Bukti Transfer</h3>
      <p style="color:#6b7280; font-size:0.9rem; margin-bottom: 0.8rem;">Sudah transfer ke QRIS / Rekening Pondok? Unggah buktinya di sini agar diverifikasi oleh admin keuangan.</p>
      
      <label for="jenisBayar">Jenis Pembayaran</label>
      <select id="jenisBayar">
        <option value="SPP">Pembayaran SPP Bulanan</option>
        <option value="Topup">Top-Up Uang Saku</option>
      </select>

      <div id="keteranganBayarWrapper">
        <label for="keteranganBayar">Keterangan / Bulan yang Dibayar</label>
        <input type="text" id="keteranganBayar" placeholder="Contoh: SPP Oktober 2026 atau Top-Up Rp 100.000">
      </div>

      <label for="fileBukti">File Bukti Transfer (Foto/PDF)</label>
      <input type="file" id="fileBukti" accept="image/*,application/pdf">

      <button id="btnUpload" style="background-color: #0d9488; margin-top: 0.5rem;">📤 Kirim Bukti Transfer</button>
    </div>

    <div class="info-box">💡 Hubungi admin via WhatsApp jika verifikasi memerlukan waktu lebih lama.</div>
    <a id="tombolWA" class="btn wa-btn" href="#" target="_blank">💬 Konfirmasi Transfer via Whatsapp</a>
  </div>

</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="script.js"></script>
</body>
</html>
