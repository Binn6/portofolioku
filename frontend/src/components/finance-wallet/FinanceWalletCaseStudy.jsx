const TECH_BADGES = ['n8n', 'Telegram Bot API', 'Gemini AI', 'Notion API', 'Laravel', 'MongoDB Atlas']

export default function FinanceWalletCaseStudy() {
  return (
    <section className="mb-12">
      <p className="text-xs uppercase tracking-widest text-accent-muted mb-2">Case Study</p>
      <h1 className="text-3xl font-semibold text-accent mb-4">Finance Wallet — Pencatatan Keuangan Otomatis via Chat</h1>
      <p className="text-accent-muted leading-relaxed max-w-3xl">
        Otomatisasi pencatatan keuangan pribadi yang jalan lewat chat: kirim pesan seperti
        "makan siang 25rb" atau foto struk belanja, dan AI (Gemini) langsung mengklasifikasi,
        mencatat transaksi, memperbarui saldo &amp; budget, sampai menyarankan realokasi budget
        kalau salah satu kategori mepet limit. Dibangun dengan n8n sebagai automation engine,
        Telegram sebagai antarmuka chat, dan Notion sebagai database personal.
      </p>

      <div className="flex flex-wrap gap-2 mt-5">
        {TECH_BADGES.map((tech) => (
          <span key={tech} className="text-xs px-3 py-1 rounded-full border border-border text-accent-muted">
            {tech}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mt-6 text-sm">
        <a
          href="/downloads/finance-wallet-workflow.json"
          download
          className="px-4 py-2 rounded-lg border border-border text-accent hover:border-accent-dim transition-colors"
        >
          Download workflow n8n (JSON)
        </a>
        <a
          href="https://t.me/+JfrV0lq3Yl5mZDQ9"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg border border-border text-accent hover:border-accent-dim transition-colors"
        >
          Tonton live feed di Telegram (view-only)
        </a>
      </div>

      <p className="text-xs text-accent-muted mt-6 max-w-3xl">
        Demo di bawah ini <strong>bukan</strong> workflow n8n asli di atas — demo publik jalan di
        atas data dummy tersendiri (MongoDB), supaya siapa pun bisa coba tanpa menyentuh data
        keuangan pribadi. Setiap pesan yang kamu kirim di sini juga disiarkan satu arah ke grup
        Telegram demo di atas, biar kamu bisa lihat buktinya real-time.
      </p>
    </section>
  )
}
