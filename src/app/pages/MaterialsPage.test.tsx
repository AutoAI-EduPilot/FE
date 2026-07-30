import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MAX_MATERIAL_UPLOAD_BYTES } from '../../features/materials'
import { TestAuthProvider } from '../../test/TestAuthProvider'
import { apiSuccess, installApiFixtureServer } from '../../test/apiFixtureServer'
import { MaterialDetailPage } from './MaterialDetailPage'
import { MaterialsPage } from './MaterialsPage'

beforeEach(() => {
  installApiFixtureServer()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

function renderMaterialsPage() {
  return render(
    <TestAuthProvider>
      <MemoryRouter>
        <MaterialsPage />
      </MemoryRouter>
    </TestAuthProvider>,
  )
}

function renderMaterialDetail(path: string) {
  return render(
    <TestAuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/materials/:materialId" element={<MaterialDetailPage />} />
        </Routes>
      </MemoryRouter>
    </TestAuthProvider>,
  )
}

describe('MaterialsPage', () => {
  it('renders statuses returned by the materials API', async () => {
    renderMaterialsPage()

    expect(await screen.findByText('시험 대비 요약.pdf')).toBeInTheDocument()
    expect(screen.getByText('준비 완료')).toBeInTheDocument()
    expect(screen.getByText('처리 중')).toBeInTheDocument()
    expect(screen.getByText('처리 실패')).toBeInTheDocument()
    expect(
      screen.getByText('파일 업로드는 완료됐지만 PDF 분석에 실패했습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('진행 중인 학습 세션이 있습니다.')).toBeInTheDocument()
  })

  it('polls the list while a material is processing and stops when ready', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let listCalls = 0
    installApiFixtureServer((request) => {
      const url = new URL(request.url)
      if (request.method === 'GET' && url.pathname === '/api/materials') {
        listCalls += 1
        return apiSuccess({
          items: [
            {
              createdAt: '2026-07-23T00:00:00Z',
              materialId: 11,
              pageCount: listCalls > 1 ? 12 : undefined,
              processingStatus: listCalls > 1 ? 'READY' : 'PROCESSING',
              title: '강의 노트 5주차.pdf',
            },
          ],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        })
      }
      return undefined
    })
    renderMaterialsPage()

    expect(await screen.findByText('처리 중')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(5000)
    expect(await screen.findByText('준비 완료')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(15_000)
    expect(listCalls).toBe(2)
    vi.useRealTimers()
  })

  it('deletes a material after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderMaterialsPage()

    fireEvent.click(
      await screen.findByRole('button', { name: '강의 노트 5주차.pdf 삭제' }),
    )

    await waitFor(() =>
      expect(
        screen.queryByText('강의 노트 5주차.pdf'),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByText('자료를 삭제했습니다.')).toBeInTheDocument()
  })

  it('explains the active-session conflict when deletion returns 409', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderMaterialsPage()

    fireEvent.click(
      await screen.findByRole('button', { name: '시험 대비 요약.pdf 삭제' }),
    )

    expect(
      await screen.findByText(/진행 중인 학습 세션이 있어 삭제할 수 없습니다/),
    ).toBeInTheDocument()
    expect(screen.getByText('시험 대비 요약.pdf')).toBeInTheDocument()
  })

  it('rejects non-PDF uploads before making an API request', () => {
    renderMaterialsPage()

    fireEvent.change(screen.getByLabelText('PDF 파일'), {
      target: {
        files: [new File(['plain text'], 'notes.txt', { type: 'text/plain' })],
      },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'PDF 파일만 업로드할 수 있습니다.',
    )
  })

  it('rejects uploads over 45MB before submission', () => {
    renderMaterialsPage()
    const file = new File(['pdf'], 'large.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', {
      value: MAX_MATERIAL_UPLOAD_BYTES + 1,
    })

    fireEvent.change(screen.getByLabelText('PDF 파일'), {
      target: { files: [file] },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      '45MB 이하의 PDF 파일만 업로드할 수 있습니다.',
    )
  })

  it('adds the material returned by the upload API', async () => {
    renderMaterialsPage()

    fireEvent.drop(screen.getByLabelText('PDF 업로드 드롭 영역'), {
      dataTransfer: {
        files: [new File(['pdf'], 'dragged.pdf', { type: 'application/pdf' })],
      },
    })

    expect(
      await screen.findByRole(
        'heading',
        { name: 'dragged.pdf' },
        { timeout: 3_000 },
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /업로드 취소/ }),
    ).not.toBeInTheDocument()
  })
})

describe('MaterialDetailPage', () => {
  it('renders API material details and active session guidance', async () => {
    renderMaterialDetail('/materials/10')

    expect(
      await screen.findByRole('heading', { name: '시험 대비 요약.pdf' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '활성 세션 충돌 안내' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '진행 중인 세션으로' }),
    ).toHaveAttribute('href', '/sessions/100')
  })

  it('renders the API 404 material state', async () => {
    renderMaterialDetail('/materials/999')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '자료를 찾을 수 없습니다.',
    )
  })

  it('renders the learner memory card when analysis exists', async () => {
    renderMaterialDetail('/materials/10')

    expect(await screen.findByText('학습 분석')).toBeInTheDocument()
    expect(
      screen.getByText('수식 전개를 어려워하고 쉬운 예시를 선호함'),
    ).toBeInTheDocument()
    expect(screen.getByText('평균 개념을 정확히 사용함')).toBeInTheDocument()
    expect(screen.getByText('수식 전개 과정 설명')).toBeInTheDocument()
  })

  it('starts a session from a ready material and navigates to it', async () => {
    render(
      <TestAuthProvider>
        <MemoryRouter initialEntries={['/materials/14']}>
          <Routes>
            <Route path="/materials/:materialId" element={<MaterialDetailPage />} />
            <Route path="/sessions/:sessionId" element={<p>세션 화면</p>} />
          </Routes>
        </MemoryRouter>
      </TestAuthProvider>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /학습 시작/ }))

    expect(await screen.findByText('세션 화면')).toBeInTheDocument()
  })
})
