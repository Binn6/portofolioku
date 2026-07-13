import { useEffect, useRef, useState } from 'react'
import { getProfile } from '../services/api'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import FinanceWalletCaseStudy from '../components/finance-wallet/FinanceWalletCaseStudy'
import FinanceChatWidget from '../components/finance-wallet/FinanceChatWidget'
import FinanceWalletStateTable from '../components/finance-wallet/FinanceWalletStateTable'

export default function FinanceWallet() {
  const [profile, setProfile] = useState(null)
  const tableRef = useRef(null)

  useEffect(() => {
    getProfile().then(({ data }) => setProfile(data)).catch(() => setProfile(null))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <FinanceWalletCaseStudy />

        <div className="grid gap-6 lg:grid-cols-[360px_1fr] items-start">
          <FinanceChatWidget onStateChanged={() => tableRef.current?.refresh()} />
          <FinanceWalletStateTable ref={tableRef} />
        </div>
      </div>

      <Footer profile={profile} />
    </div>
  )
}
