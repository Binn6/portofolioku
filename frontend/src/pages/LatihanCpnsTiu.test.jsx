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

  it('navigates with Prev/Next, disables at bounds, and preserves selection per question', () => {
    render(<LatihanCpnsTiu />)

    const prevButton = screen.getByRole('button', { name: /Soal Sebelumnya/ })
    const nextButton = screen.getByRole('button', { name: /Soal Berikutnya/ })
    expect(prevButton).toBeDisabled()

    fireEvent.click(screen.getByText('Pasien'))
    fireEvent.click(nextButton)
    expect(screen.getByText('Soal 2/10')).toBeInTheDocument()

    fireEvent.click(prevButton)
    expect(screen.getByText('Soal 1/10')).toBeInTheDocument()
    expect(screen.getByText('Pasien').closest('button').className).toMatch(/sql-secondary/)
  })

  it('disables Soal Berikutnya on the last question', () => {
    render(<LatihanCpnsTiu />)

    const nextButton = screen.getByRole('button', { name: /Soal Berikutnya/ })
    for (let i = 0; i < 9; i++) {
      fireEvent.click(nextButton)
    }

    expect(screen.getByText('Soal 10/10')).toBeInTheDocument()
    expect(nextButton).toBeDisabled()
  })

  it('jumps directly to a question via the number-pill navigator', () => {
    render(<LatihanCpnsTiu />)

    fireEvent.click(screen.getByRole('button', { name: '5' }))

    expect(screen.getByText('Soal 5/10')).toBeInTheDocument()
    expect(screen.getByText('Deret Huruf')).toBeInTheDocument()
  })

  it('renders image-based stem groups and options for the figural questions, and answer-checking still works', () => {
    render(<LatihanCpnsTiu />)

    fireEvent.click(screen.getByRole('button', { name: '9' }))
    expect(screen.getByText('Figural (Deret Gambar)')).toBeInTheDocument()
    expect(screen.getAllByAltText(/lingkaran/i).length).toBeGreaterThan(0)

    const fiveCircleOption = screen.getByAltText('5 lingkaran merah').closest('button')
    fireEvent.click(fiveCircleOption)
    fireEvent.click(screen.getByRole('button', { name: 'Cek Jawaban' }))
    expect(screen.getByText(/Pola menambahkan satu lingkaran/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '10' }))
    expect(screen.getByText('Figural (Ketidaksamaan Gambar)')).toBeInTheDocument()
    expect(screen.getAllByAltText(/segitiga/i)).toHaveLength(5)
  })
})
