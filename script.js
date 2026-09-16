// 1. Inisialisasi Supabase
const SUPABASE_URL = "https://ijipnnhgbzwatdzbdlek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaXBubmhnYnp3YXRkemJkbGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjc3NDIsImV4cCI6MjEwMzkwMzc0Mn0.TviHZ5O25ZSif9DawhcywKD9c3d4bv3yGnLPGk6iMAU";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentSantriId = null;

// 2. Fungsi Login & Cek ID Santri ke Supabase
async function handleLogin() {
    const idInput = document.getElementById('id-santri-input').value.trim();
    const errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';

    if (!idInput) {
        errorEl.innerText = 'Masukkan ID Santri terlebih dahulu.';
        errorEl.style.display = 'block';
        return;
    }

    // Query ke tabel 'santri'
    const { data: santri, error } = await supabase
        .from('santri')
        .select('*')
        .eq('id_santri', idInput)
        .single();

    if (error || !santri) {
        errorEl.innerText = 'ID Santri tidak ditemukan di database.';
        errorEl.style.display = 'block';
        return;
    }

    // ID Ditemukan
    currentSantriId = santri.id_santri;
    document.getElementById('santri-id-display').innerText = santri.id_santri;
    document.getElementById('santri-name-display').innerText = santri.nama_santri || 'Santri';

    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';

    // Ambil data langsung dari Supabase
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

// 3. Narik Data Mutasi dari Supabase (Live Query)
async function fetchMutasi() {
    if (!currentSantriId) return;

    const tbody = document.getElementById('mutasi-data');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem;">Mengambil data mutasi dari server...</td></tr>';

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

    if (error) {
        console.error('Error fetching mutasi:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#dc2626;">Gagal memuat data mutasi. Gagal terhubung ke database.</td></tr>';
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6b7280; padding:1.5rem;">Tidak ada catatan mutasi untuk periode ini.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.tanggal ? new Date(item.tanggal).toLocaleString('id-ID') : '-'}</td>
            <td>${item.keterangan || '-'}</td>
            <td style="color: var(--primary); font-weight: 600;">${item.masuk ? Number(item.masuk).toLocaleString('id-ID') : '-'}</td>
            <td style="color: #dc2626; font-weight: 600;">${item.keluar ? Number(item.keluar).toLocaleString('id-ID') : '-'}</td>
            <td style="font-weight: 600;">${item.saldo_akhir ? Number(item.saldo_akhir).toLocaleString('id-ID') : '0'}</td>
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

// 4. Narik Data Info Paket dari Supabase (Live Query)
async function fetchPaket() {
    if (!currentSantriId) return;

    const tbody = document.getElementById('paket-data');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem;">Mengambil data paket dari server...</td></tr>';

    const { data, error } = await supabase
        .from('paket_santri')
        .select('*')
        .eq('id_santri', currentSantriId)
        .order('tanggal_tiba', { ascending: false });

    if (error) {
        console.error('Error fetching paket:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#dc2626;">Gagal memuat data paket.</td></tr>';
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

// Modal Foto
function openFotoModal(imageSrc, caption) {
    document.getElementById('modal-image').src = imageSrc;
    document.getElementById('modal-caption').innerText = "Bukti Paket: " + caption;
    document.getElementById('foto-modal').style.display = 'flex';
}

function closeFotoModal() {
    document.getElementById('foto-modal').style.display = 'none';
}

// 5. Integrasi Pembayaran via DOKU Payment Gateway
async function processDokuTopup() {
    const amountInput = document.getElementById('topup-amount');
    const amount = parseInt(amountInput.value);
    const btn = document.getElementById('btn-topup-doku');

    if (!amount || amount < 10000) {
        alert("Minimum top up adalah Rp 10.000");
        return;
    }

    if (!currentSantriId) {
        alert("Sesi login telah berakhir. Silakan login kembali.");
        return;
    }

    try {
        btn.disabled = true;
        btn.innerText = "Memproses Pembayaran DOKU...";

        // Panggil Supabase Edge Function untuk memproses DOKU Checkout URL
        // (Sangat direkomendasikan agar DOKU Client ID & Secret Key tidak bocor di frontend)
        const { data, error } = await supabase.functions.invoke('doku-checkout', {
            body: {
                id_santri: currentSantriId,
                amount: amount,
                order_id: "TOPUP-" + currentSantriId + "-" + Date.now()
            }
        });

        if (error || !data || !data.payment_url) {
            // Fallback jika Edge Function belum dideploy:
            console.warn('Edge Function doku-checkout belum siap atau error:', error);
            alert(`Sistem Top Up DOKU sebesar Rp ${amount.toLocaleString('id-ID')} siap dikoneksikan ke DOKU Checkout URL.`);
            return;
        }

        // Redirect wali santri ke halaman checkout resmi DOKU (Virtual Account / QRIS / e-Wallet)
        window.location.href = data.payment_url;

    } catch (err) {
        console.error('DOKU Top Up Error:', err);
        alert("Terjadi kesalahan saat memproses pembayaran. Coba lagi nanti.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Lanjutkan Pembayaran via Doku";
    }
}
