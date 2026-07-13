import Navbar from '../components/layout/Navbar'
import FinanceWalletCaseStudy from '../components/finance-wallet/FinanceWalletCaseStudy'

export default function FinanceWallet() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <FinanceWalletCaseStudy />
        <p className="text-accent-muted mt-2">Chat widget dan tabel live segera menyusul.</p>
      </div>
    </div>
  )
}
