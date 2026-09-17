// Inisialisasi Supabase Client
const SUPABASE_URL = "https://ijipnnhgbzwatdzbdlek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaXBubmhnYnp3YXRkemJkbGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjc3NDIsImV4cCI6MjEwMzkwMzc0Mn0.TviHZ5O25ZSif9DawhcywKD9c3d4bv3yGnLPGk6iMAU";

window.supabaseApp = window.supabaseApp || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const db = window.supabaseApp;

let currentSantri = null;

// Set default tanggal hari ini pada input date saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split('T')[0];
    const singleDateEl = document.getElementById('single-date');
    if (singleDateEl) singleDateEl.value = today;
});

// 1. Fungsi Login
async function handleLogin() {
    const idInputEl = document.getElementById('id-santri-input');
    const idInput = idInputEl ? idInputEl.value.trim() : '';
    const errorEl = document.getElementById('login-error');
    const btn = document.querySelector('#login-section button');
    
    if (errorEl) errorEl.style.display = 'none';

    if (!idInput) {
        if (errorEl) {
            errorEl.innerText = 'Masukkan ID / UID Santri terlebih dahulu.';
            errorEl.style.display = 'block';
        }
        return;
    }

    try {
        if (btn) {
            btn.innerText = "Memeriksa...";
            btn.disabled = true;
        }

        const { data: santri, error } = await db
            .from('Data_Santri')
            .select('*')
            .eq('UID', idInput)
            .maybeSingle();

        if (error) {
            console.error("Supabase Error:", error);
            if (errorEl) {
                errorEl.innerText = 'Gagal terhubung ke database: ' + error.message;
                errorEl.style.display = 'block';
            }
            return;
        }

        if (!santri) {
            if (errorEl) {
                errorEl.innerText = 'UID Santri ' + idInput + ' tidak ditemukan.';
                errorEl.style.display = 'block';
            }
            return;
        }

        currentSantri = santri;
        const displayUid = document.getElementById('santri-id-display');
        const displayName = document.getElementById('santri-name-display');
        if (displayUid) displayUid.innerText = santri.UID;
        if (displayName) displayName.innerText = santri.Nama || 'Santri Al-Bashiroh';

        const loginSec = document.getElementById('login-section');
        const dashSec = document.getElementById('dashboard-section');
        if (loginSec) loginSec.style.display = 'none';
        if (dashSec) dashSec.style.display = 'block';

        fetchMutasi();
        fetchPaket();

    } catch (err) {
        console.error("System Error:", err);
        if (errorEl) {
            errorEl.innerText = 'Terjadi kesalahan sistem.';
            errorEl.style.display = 'block';
        }
    } finally {
        if (btn) {
            btn.innerText = "Masuk Dashboard";
            btn.disabled = false;
        }
    }
}

function handleLogout() {
    currentSantri = null;
    const input = document.getElementById('id-santri-input');
    if (input) input.value = '';
    const errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.style.display = 'none';
    const dashSec = document.getElementById('dashboard-section');
    if (dashSec) dashSec.style.display = 'none';
    const loginSec = document.getElementById('login-section');
    if (loginSec) loginSec.style.display = 'block';
}

function switchTab(tabId, evt) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));

    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add('active');
    }
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

// 2. Toggle Tampilan Mode Filter
function toggleFilterMode() {
    const filterTypeEl = document.getElementById('filter-type');
    const type = filterTypeEl ? filterTypeEl.value : 'all';
    const groupHari = document.getElementById('filter-hari-group');
    const groupStart = document.getElementById('filter-tanggal-group');
    const groupEnd = document.getElementById('filter-tanggal-end-group');

    if (groupHari) groupHari.style.display = (type === 'hari') ? 'flex' : 'none';
    if (groupStart) groupStart.style.display = (type === 'tanggal') ? 'flex' : 'none';
    if (groupEnd) groupEnd.style.display = (type === 'tanggal') ? 'flex' : 'none';
}

function applyFilterMutasi() {
    fetchMutasi();
}

// 3. Fetch Mutasi dari Tabel Log_Transaksi
async function fetchMutasi() {
    if (!currentSantri) return;

    const tbody = document.getElementById('mutasi-data');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem;">Mengambil data transaksi...</td></tr>';

    let query = db
        .from('Log_Transaksi')
        .select('*')
        .eq('ID', currentSantri.ID)
        .order('Waktu', { ascending: false });

    const filterTypeEl = document.getElementById('filter-type');
    const filterType = filterTypeEl ? filterTypeEl.value : 'all';

    if (filterType === 'hari') {
        const singleDateEl = document.getElementById('single-date');
        const singleDate = singleDateEl ? singleDateEl.value : '';
        if (singleDate) {
            query = query
                .gte('Waktu', `${singleDate}T00:00:00`)
                .lte('Waktu', `${singleDate}T23:59:59`);
        } else {
            alert('Silakan pilih tanggal terlebih dahulu.');
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6b7280; padding:1.5rem;">Pilih tanggal filter.</td></tr>';
            return;
        }
    } else if (filterType === 'tanggal') {
        const startEl = document.getElementById('start-date');
        const endEl = document.getElementById('end-date');
        const start = startEl ? startEl.value : '';
        const end = endEl ? endEl.value : '';

        if (start && end) {
            query = query
                .gte('Waktu', `${start}T00:00:00`)
                .lte('Waktu', `${end}T23:59:59`);
        } else if (start) {
            query = query.gte('Waktu', `${start}T00:00:00`);
        } else if (end) {
            query = query.lte('Waktu', `${end}T23:59:59`);
        } else {
            alert('Silakan isi rentang tanggal.');
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6b7280; padding:1.5rem;">Pilih rentang tanggal.</td></tr>';
            return;
        }
    }

    let { data, error } = await query;

    if ((!data || data.length === 0) && currentSantri.Nama && filterType === 'all') {
        const fallbackRes = await db
            .from('Log_Transaksi')
            .select('*')
            .eq('Nama', currentSantri.Nama)
            .order('Waktu', { ascending: false });
        if (fallbackRes.data && fallbackRes.data.length > 0) {
            data = fallbackRes.data;
            error = null;
        }
    }

    if (error) {
        console.error('Error fetching mutasi:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#dc2626;">Gagal memuat data transaksi.</td></tr>';
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6b7280; padding:1.5rem;">Tidak ada riwayat transaksi pada tanggal/periode ini.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => {
        const statusText = item.Status || 'Transaksi';
        const isJajan = statusText.toLowerCase().includes('jajan') || statusText.toLowerCase().includes('keluar');
        const nominal = item.Nominal ? Number(item.Nominal).toLocaleString('id-ID') : '0';
        
        const masuk = isJajan ? '-' : nominal;
        const keluar = isJajan ? nominal : '-';
        const waktu = item.Waktu_WIB || item.Waktu || item.created_at;

        return `
            <tr>
                <td>${waktu ? new Date(waktu).toLocaleString('id-ID') : '-'}</td>
                <td>${statusText}</td>
                <td style="color: var(--primary); font-weight: 600;">${masuk}</td>
                <td style="color: #dc2626; font-weight: 600;">${keluar}</td>
                <td style="font-weight: 600;">-</td>
            </tr>
        `;
    }).join('');
}

// 4. Fetch Paket dari Tabel paket_santri
async function fetchPaket() {
    if (!currentSantri) return;

    const tbody = document.getElementById('paket-data');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem;">Mengambil data paket...</td></tr>';

    const { data, error } = await db
        .from('paket_santri')
        .select('*')
        .eq('UID', currentSantri.UID);

    if (error) {
        console.error('Error fetching paket:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6b7280; padding:1.5rem;">Belum ada riwayat paket masuk.</td></tr>';
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6b7280; padding:1.5rem;">Belum ada riwayat paket masuk.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(p => {
        const statusText = p.status || 'Di Pos Asrama';
        const isSuccess = statusText.toLowerCase().includes('sudah') || statusText.toLowerCase().includes('diambil');
        const badgeClass = isSuccess ? 'badge-success' : 'badge-pending';
        const imgUrl = p.foto_url || 'logo.jpg';

        return `
            <tr>
                <td>${p.tanggal_tiba ? new Date(p.tanggal_tiba).toLocaleDateString('id-ID') : '-'}</td>
                <td>${p.pengirim || '-'}</td>
                <td>${p.deskripsi || '-'}</td>
                <td>
                    <img src="${imgUrl}" alt="Foto Paket" class="paket-thumb" onclick="openFotoModal('${imgUrl}', '${p.deskripsi || 'Paket'}')">
                </td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

function openFotoModal(imageSrc, caption) {
    const imgEl = document.getElementById('modal-image');
    const capEl = document.getElementById('modal-caption');
    const modalEl = document.getElementById('foto-modal');
    if (imgEl) imgEl.src = imageSrc;
    if (capEl) capEl.innerText = "Bukti Paket: " + caption;
    if (modalEl) modalEl.style.display = 'flex';
}

function closeFotoModal() {
    const modalEl = document.getElementById('foto-modal');
    if (modalEl) modalEl.style.display = 'none';
}

// 5. Process Top Up DOKU (Mengarah Langsung ke Payment Link Doku)
function processDokuTopup() {
    if (!currentSantri) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    const inputEl = document.getElementById('topup-amount') || document.querySelector('.panel input[type="number"]');
    const amountVal = inputEl ? inputEl.value : null;
    const amount = parseInt(amountVal);

    if (!amount || isNaN(amount) || amount < 10000) {
        alert("Nominal minimal top up adalah Rp 10.000");
        return;
    }

    // Link Pembayaran Doku yang sudah dibuat di dasbor
    const dokuPaymentLink = "https://pay.doku.com/p-link/p/uangsakusantri";

    // Langsung arahkan wali santri ke halaman pembayaran Doku
    window.location.href = dokuPaymentLink;
}
