import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FinanceChatWidget from './FinanceChatWidget'
import { financeWalletSendMessage, financeWalletConfirm } from '../../services/api'

vi.mock('../../services/api', () => ({
  financeWalletSendMessage: vi.fn(),
  financeWalletConfirm: vi.fn(),
}))

describe('FinanceChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('sends a message and renders the bot reply', async () => {
    financeWalletSendMessage.mockResolvedValue({
      type: 'transaction',
      reply: 'Tercatat: makan siang - Rp25.000 (Makanan).',
      realokasi_suggestion: null,
    })

    render(<FinanceChatWidget />)

    fireEvent.change(screen.getByPlaceholderText(/makan siang/i), {
      target: { value: 'makan siang 25rb dari mandiri' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim pesan' }))

    await waitFor(() => {
      screen.getByText(/Tercatat: makan siang/)
    })
    expect(financeWalletSendMessage).toHaveBeenCalledWith({
      visitor_tag: expect.any(String),
      message: 'makan siang 25rb dari mandiri',
    })
  })

  it('renders account choice buttons and confirms the chosen account', async () => {
    financeWalletSendMessage.mockResolvedValue({
      type: 'pending_account',
      pending_id: 'pending123',
      reply: 'Ini dari rekening mana?',
      options: ['Mandiri', 'BSI'],
    })
    financeWalletConfirm.mockResolvedValue({
      type: 'confirm_result',
      reply: 'Tercatat: makan siang - Rp25.000 (Makanan).',
      transaction: {},
      realokasi_suggestion: null,
    })

    render(<FinanceChatWidget />)
    fireEvent.change(screen.getByPlaceholderText(/makan siang/i), { target: { value: 'makan siang 25rb' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim pesan' }))

    const mandiriButton = await screen.findByRole('button', { name: 'Mandiri' })
    fireEvent.click(mandiriButton)

    await waitFor(() => {
      expect(financeWalletConfirm).toHaveBeenCalledWith({ pending_id: 'pending123', action: 'accept', choice: 'Mandiri' })
    })
  })
})
