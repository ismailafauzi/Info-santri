// Inisialisasi Supabase Client
const SUPABASE_URL = "https://ijipnnhgbzwatdzbdlek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaXBubmhnYnp3YXRkemJkbGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjc3NDIsImV4cCI6MjEwMzkwMzc0Mn0.TviHZ5O25ZSif9DawhcywKD9c3d4bv3yGnLPGk6iMAU";

window.supabaseApp = window.supabaseApp || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const db = window.supabaseApp;

let currentSantri = null;

// 1. Fungsi Login
async function handleLogin() {
    const idInput = document.getElementById('id-santri-input').value.trim();
    const errorEl = document.getElementById('login-error');
    const btn = document.querySelector('#login-section button');
    
    errorEl.style.display = 'none';

    if (!idInput) {
        errorEl.innerText = 'Masukkan ID / UID Santri terlebih dahulu.';
        errorEl.style.display = 'block';
        return;
    }

    try {
        btn.innerText = "Memeriksa...";
        btn.disabled = true;

        const { data: santri, error } = await db
            .from('Data_Santri')
            .select('*')
            .eq('UID', idInput)
            .maybeSingle();

        if (error) {
            console.error("Supabase Error:", error);
            errorEl.innerText = 'Gagal terhubung ke database: ' + error.message;
            errorEl.style.display = 'block';
            return;
        }

        if (!santri) {
            errorEl.innerText = 'UID Santri ' + idInput + ' tidak ditemukan.';
            errorEl.style.display = 'block';
            return;
        }

        // Simpan data santri yang sedang login
        currentSantri = santri;
        document.getElementById('santri-id-display').innerText = santri.UID;
        document.getElementById('santri-name-display').innerText = santri.Nama || 'Santri Al-Bashiroh';

        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';

        fetchMutasi();
        fetchPaket();

    } catch (err) {
        console.error("System Error:", err);
        errorEl.innerText = 'Terjadi kesalahan sistem.';
        errorEl.style.display = 'block';
    } finally {
        btn.innerText = "Masuk Dashboard";
        btn.disabled = false;
    }
}

function handleLogout() {
    currentSantri = null;
    document.getElementById('id-santri-input').value = '';
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

function switchTab(tabId, evt) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));

    evt.currentTarget.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// 2. Fetch Mutasi dari Tabel Log_Transaksi
async function fetchMutasi() {
    if (!currentSantri) return;

    const tbody = document.getElementById('mutasi-data');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem;">Mengambil data transaksi...</td></tr>';

    // Query ke Log_Transaksi menggunakan ID santri
    let query = db
        .from('Log_Transaksi')
        .select('*')
        .eq('ID', currentSantri.ID);

    const filterType = document.getElementById('filter-type').value;

    if (filterType === 'hari') {
        const val = document.getElementById('select-hari').value;
        const now = new Date();
        
        if (val === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            query = query.gte('Waktu', todayStr);
        } else if (val === 'yesterday') {
            const yest = new Date(now);
            yest.setDate(yest.getDate() - 1);
            query = query.gte('Waktu', yest.toISOString().split('T')[0]);
        } else if (val === '7days') {
            const d7 = new Date(now);
            d7.setDate(d7.getDate() - 7);
            query = query.gte('Waktu', d7.toISOString().split('T')[0]);
        } else if (val === '30days') {
            const d30 = new Date(now);
            d30.setDate(d30.getDate() - 30);
            query = query.gte('Waktu', d30.toISOString().split('T')[0]);
        }
    } else {
        const start = document.getElementById('start-date').value;
        const end = document.getElementById('end-date').value;

        if (start) query = query.gte('Waktu', start);
        if (end) query = query.lte('Waktu', end + 'T23:59:59');
    }

    let { data, error } = await query;

    // Fallback jika ID tidak cocok, cari berdasarkan Nama
    if ((!data || data.length === 0) && currentSantri.Nama) {
        const fallbackRes = await db
            .from('Log_Transaksi')
            .select('*')
            .eq('Nama', currentSantri.Nama);
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
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6b7280; padding:1.5rem;">Tidak ada riwayat transaksi.</td></tr>';
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

function toggleFilterMode() {
    const type = document.getElementById('filter-type').value;
    document.getElementById('filter-hari-group').style.display = type === 'hari' ? 'flex' : 'none';
    document.getElementById('filter-tanggal-group').style.display = type === 'tanggal' ? 'flex' : 'none';
    document.getElementById('filter-tanggal-end-group').style.display = type === 'tanggal' ? 'flex' : 'none';
}

function applyFilterMutasi() {
    fetchMutasi();
}

// 3. Fetch Paket dari Tabel paket_santri
async function fetchPaket() {
    if (!currentSantri) return;

    const tbody = document.getElementById('paket-data');
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
    document.getElementById('modal-image').src = imageSrc;
    document.getElementById('modal-caption').innerText = "Bukti Paket: " + caption;
    document.getElementById('foto-modal').style.display = 'flex';
}

function closeFotoModal() {
    document.getElementById('foto-modal').style.display = 'none';
}

function processDokuTopup() {
    const amount = document.getElementById('topup-amount').value;
    if (!amount || amount < 10000) {
        alert("Nominal minimal top up adalah Rp 10.000");
        return;
    }
    alert("Proses Top Up DOKU sebesar Rp " + Number(amount).toLocaleString('id-ID') + " untuk UID: " + (currentSantri ? currentSantri.UID : '-'));
}
