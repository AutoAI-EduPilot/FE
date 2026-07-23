import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { MAX_MATERIAL_UPLOAD_BYTES } from '../../features/materials'
import { MaterialDetailPage } from './MaterialDetailPage'
import { MaterialsPage } from './MaterialsPage'

afterEach(() => {
  cleanup()
})

function renderMaterialsPage() {
  return render(
    <MemoryRouter>
      <MaterialsPage />
    </MemoryRouter>,
  )
}

function renderMaterialDetail(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/materials/:materialId" element={<MaterialDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MaterialsPage', () => {
  it('renders material status UI', () => {
    renderMaterialsPage()

    expect(screen.getByText('READY')).toBeInTheDocument()
    expect(screen.getByText('PROCESSING')).toBeInTheDocument()
    expect(screen.getByText('FAILED')).toBeInTheDocument()
    expect(screen.getByText('진행 중인 학습 세션이 있습니다.')).toBeInTheDocument()
  })

  it('rejects non-PDF uploads', () => {
    renderMaterialsPage()

    fireEvent.change(screen.getByLabelText('PDF 파일'), {
      target: {
        files: [new File(['plain text'], 'notes.txt', { type: 'text/plain' })],
      },
    })

    expect(screen.getByRole('alert')).toHaveTextContent('PDF 파일만 업로드할 수 있습니다.')
  })

  it('rejects uploads over 45MB before submission', () => {
    renderMaterialsPage()
    const file = new File(['pdf'], 'large.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: MAX_MATERIAL_UPLOAD_BYTES + 1 })

    fireEvent.change(screen.getByLabelText('PDF 파일'), {
      target: { files: [file] },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      '45MB 이하의 PDF 파일만 업로드할 수 있습니다.',
    )
  })

  it('confirms before removing a material from local state', () => {
    renderMaterialsPage()

    fireEvent.click(screen.getByRole('button', { name: '시험 대비 요약.pdf 삭제' }))
    const dialog = screen.getByRole('dialog', { name: '자료 삭제' })
    fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }))

    expect(screen.queryByText('시험 대비 요약.pdf')).not.toBeInTheDocument()
  })
})

describe('MaterialDetailPage', () => {
  it('renders active session conflict guidance', () => {
    renderMaterialDetail('/materials/material-ready')

    expect(screen.getByRole('heading', { name: '시험 대비 요약.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '활성 세션 충돌 안내' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '진행 중인 세션으로' })).toHaveAttribute(
      'href',
      '/sessions/session-100',
    )
  })

  it('renders missing material state', () => {
    renderMaterialDetail('/materials/missing-material')

    expect(screen.getByRole('alert')).toHaveTextContent('자료를 찾을 수 없습니다.')
  })
})
