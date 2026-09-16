// 1. Inisialisasi Supabase (Ganti pake kredensial Supabase kamu)
const SUPABASE_URL = "https://ijipnnhgbzwatdzbdlek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaXBubmhnYnp3YXRkemJkbGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjc3NDIsImV4cCI6MjEwMzkwMzc0Mn0.TviHZ5O25ZSif9DawhcywKD9c3d4bv3yGnLPGk6iMAU";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentSantriId = null;

// 2. Fungsi Login & Cek ID ke Database Supabase
async function handleLogin() {
    const idInput = document.getElementById('id-santri-input').value.trim();
    const errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';

    if (!idInput) {
        errorEl.innerText = 'Masukkan ID Santri terlebih dahulu.';
        errorEl.style.display = 'block';
        return;
    }

    // Cek tabel 'santri' di Supabase
    const { data: santri, error } = await supabase
        .from('santri')
        .select('*')
        .eq('id_santri', idInput)
        .single();

    if (error || !santri) {
        errorEl.innerText = 'ID Santri nggak ditemukan di database.';
        errorEl.style.display = 'block';
        return;
    }

    // Jika ID ketemu
    currentSantriId = santri.id_santri;
    document.getElementById('santri-id-display').innerText = santri.id_santri;
    document.getElementById('santri-name-display').innerText = santri.nama_santri;

    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';

    // Fetch data otomatis setelah login
    fetchMutasi();
    fetchPaket();
}

function handleLogout() {
    currentSantriId = null;
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

// 3. Narik Data Mutasi dari Supabase dengan Filter
async function fetchMutasi() {
    if (!currentSantriId) return;

    const tbody = document.getElementById('mutasi-data');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading data mutasi...</td></tr>';

    let query = supabase
        .from('mutasi_uang_saku')
        .select('*')
        .eq('id_santri', currentSantriId)
        .order('tanggal', { ascending: false });

    const filterType = document.getElementById('filter-type').value;

    if (filterType === 'hari') {
        const val = document.getElementById('select-hari').value;
        const now = new Date();
        
        if (val === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            query = query.gte('tanggal', todayStr);
        } else if (val === 'yesterday') {
            const yest = new Date(now);
            yest.setDate(yest.getDate() - 1);
            query = query.gte('tanggal', yest.toISOString().split('T')[0]);
        } else if (val === '7days') {
            const d7 = new Date(now);
            d7.setDate(d7.getDate() - 7);
            query = query.gte('tanggal', d7.toISOString().split('T')[0]);
        } else if (val === '30days') {
            const d30 = new Date(now);
            d30.setDate(d30.getDate() - 30);
            query = query.gte('tanggal', d30.toISOString().split('T')[0]);
        }
    } else {
        const start = document.getElementById('start-date').value;
        const end = document.getElementById('end-date').value;

        if (start) query = query.gte('tanggal', start);
        if (end) query = query.lte('tanggal', end + 'T23:59:59');
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6b7280;">Tidak ada catatan mutasi.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${new Date(item.tanggal).toLocaleString('id-ID')}</td>
            <td>${item.keterangan}</td>
            <td style="color: var(--primary); font-weight: 600;">${item.masuk ? item.masuk.toLocaleString('id-ID') : '-'}</td>
            <td style="color: #dc2626; font-weight: 600;">${item.keluar ? item.keluar.toLocaleString('id-ID') : '-'}</td>
            <td style="font-weight: 600;">${item.saldo_akhir ? item.saldo_akhir.toLocaleString('id-ID') : '0'}</td>
        </tr>
    `).join('');
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

// 4. Narik Data Info Paket dari Supabase
async function fetchPaket() {
    if (!currentSantriId) return;

    const tbody = document.getElementById('paket-data');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading data paket...</td></tr>';

    const { data, error } = await supabase
        .from('paket_santri')
        .select('*')
        .eq('id_santri', currentSantriId)
        .order('tanggal_tiba', { ascending: false });

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6b7280;">Belum ada paket masuk.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(p => {
        const isSuccess = p.status.toLowerCase().includes('sudah') || p.status.toLowerCase().includes('diambil');
        const badgeClass = isSuccess ? 'badge-success' : 'badge-pending';
        const imgUrl = p.foto_url || 'logo.jpg';

        return `
            <tr>
                <td>${new Date(p.tanggal_tiba).toLocaleDateString('id-ID')}</td>
                <td>${p.pengirim}</td>
                <td>${p.deskripsi}</td>
                <td>
                    <img src="${imgUrl}" alt="Foto Paket" class="paket-thumb" onclick="openFotoModal('${imgUrl}', '${p.deskripsi}')">
                </td>
                <td><span class="badge ${badgeClass}">${p.status}</span></td>
            </tr>
        `;
    }).join('');
}

// Modal Foto & Doku TopUp
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
    if (!amount || amount <= 0) {
        alert("Silakan masukkan nominal top up yang valid.");
        return;
    }
    alert("Mengarahkan ke Gateway Doku untuk pembayaran sebesar Rp " + parseInt(amount).toLocaleString('id-ID'));
}
