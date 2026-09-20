import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase
const SUPABASE_URL = "https://ijipnnhgbzwatdzbdlek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaXBubmhnYnp3YXRkemJkbGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjc3NDIsImV4cCI6MjEwMzkwMzc0Mn0.TviHZ5O25ZSif9DawhcywKD9c3d4bv3yGnLPGk6iMAU";[cite: 2]
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    // Vercel Serverless Function wajib menerima method POST dari DOKU
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const notification = req.body;
        console.log("Webhook DOKU Diterima:", JSON.stringify(notification, null, 2));
        
        // Mengambil data dari payload webhook DOKU (Mendukung struktur DOKU Checkout / SNAP / Notifikasi Umum)
        const transaction = notification.transaction || notification.payment;
        const order = notification.order;

        if (!order) {
            return res.status(400).json({ error: 'Invalid payload: order data missing' });
        }

        const invoiceNumber = order.invoice_number;
        const amount = parseFloat(order.amount);
        
        // Cek status pembayaran (SUCCESS, PAID, atau CAPTURED)
        const status = transaction ? (transaction.status || transaction.payment_status) : '';
        const isPaid = status === 'SUCCESS' || status === 'PAID' || status === 'CAPTURED' || notification.status === 'SUCCESS';

        if (isPaid) {
            // Mengambil UID santri dari metadata tambahan / line_items / catatan
            const uidSantri = order.additional_info?.uid_santri || 
                              order.line_items?.[0]?.name || 
                              notification.customer?.id || 
                              'UNKNOWN';

            // 1. Cek duplikasi transaksi di Supabase agar tidak tercatat dua kali
            const { data: existingLog, error: fetchError } = await supabase
                .from('Log_Transaksi')
                .select('*')
                .eq('Status', `Top Up DOKU (${invoiceNumber})`)
                .maybeSingle();

            if (fetchError) {
                console.error("Supabase Fetch Error:", fetchError);
            }

            if (!existingLog) {
                // 2. Masukkan data ke tabel Log_Transaksi
                const { error: insertError } = await supabase.from('Log_Transaksi').insert([
                    {
                        UID: uidSantri,
                        Status: `Top Up DOKU (${invoiceNumber})`,
                        Nominal: amount,
                        Waktu: new Date().toISOString()
                    }
                ]);

                if (insertError) {
                    console.error("Supabase Insert Error:", insertError);
                    return res.status(500).json({ error: 'Failed to save to database' });
                }
                console.log(`Berhasil mencatat top up untuk UID: ${uidSantri}, Nominal: ${amount}`);
            }
        }

        // Berikan respons sukses (HTTP 200) wajib agar DOKU tidak melakukan retry berulang kali
        return res.status(200).json({ status: 'OK' });

    } catch (err) {
        console.error("Webhook Error:", err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
