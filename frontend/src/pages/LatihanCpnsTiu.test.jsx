import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
