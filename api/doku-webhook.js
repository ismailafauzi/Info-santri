import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase
const SUPABASE_URL = "https://ijipnnhgbzwatdzbdlek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaXBubmhnYnp3YXRkemJkbGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjc3NDIsImV4cCI6MjEwMzkwMzc0Mn0.TviHZ5O25ZSif9DawhcywKD9c3d4bv3yGnLPGk6iMAU"; //[cite: 2]
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    // Vercel Serverless Function wajib menerima method POST dari DOKU
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const notification = req.body;
        
        // Mengambil data dari payload webhook DOKU
        const transaction = notification.transaction;
        const order = notification.order;

        // Cek apakah pembayaran berhasil
        if (transaction && (transaction.status === 'SUCCESS' || transaction.status === 'PAID')) {
            const invoiceNumber = order.invoice_number;
            const amount = parseFloat(order.amount);
            
            // Mengambil UID santri yang dikirim melalui metadata tambahan DOKU
            const uidSantri = order.additional_info?.uid_santri || order.line_items?.[0]?.name || 'UNKNOWN';

            // 1. Cek duplikasi transaksi di Supabase agar tidak tercatat dua kali
            const { data: existingLog } = await supabase
                .from('Log_Transaksi')
                .select('*')
                .eq('Status', `Top Up DOKU (${invoiceNumber})`)
                .maybeSingle();

            if (!existingLog) {
                // 2. Masukkan data ke tabel Log_Transaksi (Otomatis masuk sebagai saldo/pemasukan)
                await supabase.from('Log_Transaksi').insert([
                    {
                        UID: uidSantri,
                        Status: `Top Up DOKU (${invoiceNumber})`,
                        Nominal: amount,
                        Waktu: new Date().toISOString()
                    }
                ]);
            }
        }

        // Berikan respons sukses ke DOKU
        return res.status(200).json({ status: 'OK' });

    } catch (err) {
        console.error("Webhook Error:", err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
