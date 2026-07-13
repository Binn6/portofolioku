import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import FinanceWalletStateTable from './FinanceWalletStateTable'
import { financeWalletGetState } from '../../services/api'

vi.mock('../../services/api', () => ({
  financeWalletGetState: vi.fn(),
}))

describe('FinanceWalletStateTable', () => {
  it('fetches and renders wallet state on mount', async () => {
    financeWalletGetState.mockResolvedValue({
      accounts: [{ nama: 'Mandiri', saldo_sekarang: 5000000 }],
      budgets: [{ kategori: 'Makanan', limit_bulanan: 1500000, terpakai_bulan_ini: 25000 }],
      transactions: [],
    })

    render(<FinanceWalletStateTable />)

    await waitFor(() => {
      screen.getByText('Mandiri')
    })
    expect(financeWalletGetState).toHaveBeenCalled()
  })
})
