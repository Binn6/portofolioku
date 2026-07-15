import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LatihanCpnsTiu from './LatihanCpnsTiu'

describe('LatihanCpnsTiu', () => {
  it('renders the first question with its category, stem, and 5 options', () => {
    render(<LatihanCpnsTiu />)

    expect(screen.getByText('Soal 1/10')).toBeInTheDocument()
    expect(screen.getByText('Analogi Verbal')).toBeInTheDocument()
    expect(screen.getByText('GURU : MURID = DOKTER : ...')).toBeInTheDocument()
    expect(screen.getByText('Rumah Sakit')).toBeInTheDocument()
    expect(screen.getByText('Obat')).toBeInTheDocument()
    expect(screen.getByText('Pasien')).toBeInTheDocument()
    expect(screen.getByText('Perawat')).toBeInTheDocument()
    expect(screen.getByText('Klinik')).toBeInTheDocument()

    const checkButton = screen.getByRole('button', { name: 'Cek Jawaban' })
    expect(checkButton).toBeDisabled()
  })

  it('enables Cek Jawaban after selecting an option and reveals feedback on click', () => {
    render(<LatihanCpnsTiu />)

    const checkButton = screen.getByRole('button', { name: 'Cek Jawaban' })
    expect(checkButton).toBeDisabled()

    fireEvent.click(screen.getByText('Pasien'))
    expect(checkButton).toBeEnabled()

    fireEvent.click(checkButton)
    expect(screen.getByText(/Guru berinteraksi dengan murid/)).toBeInTheDocument()
  })

  it('marks a wrong selection distinctly from the correct answer after checking', () => {
    render(<LatihanCpnsTiu />)

    fireEvent.click(screen.getByText('Obat'))
    fireEvent.click(screen.getByRole('button', { name: 'Cek Jawaban' }))

    const wrongOptionButton = screen.getByText('Obat').closest('button')
    const correctOptionButton = screen.getByText('Pasien').closest('button')
    expect(wrongOptionButton.className).toMatch(/red/)
    expect(correctOptionButton.className).toMatch(/sql-primary/)
  })
})
