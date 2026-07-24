import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { mockDiagnosisRepository, restorePendingDiagnosis } from '../../features/diagnosis'
import { DiagnosisPage } from './DiagnosisPage'

afterEach(() => {
  cleanup()
})

function renderDiagnosisPage() {
  return render(
    <MemoryRouter initialEntries={['/sessions/session-100/diagnosis/diagnosis-42']}>
      <Routes>
        <Route
          path="/sessions/:sessionId/diagnosis/:diagnosisId"
          element={<DiagnosisPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DiagnosisPage', () => {
  it('restores pending diagnosis mock state from route params', () => {
    renderDiagnosisPage()

    expect(screen.getByRole('heading', { name: '진단 복원' })).toBeInTheDocument()
    expect(screen.getByText(/저득점 결과 48점/)).toBeInTheDocument()
    expect(restorePendingDiagnosis('diagnosis-42', 'session-100')).toMatchObject({
      diagnosisId: 'diagnosis-42',
      sessionId: 'session-100',
    })
    expect(mockDiagnosisRepository.restorePending('diagnosis-42', 'session-100')).toMatchObject({
      diagnosisId: 'diagnosis-42',
      sessionId: 'session-100',
    })
  })

  it('validates diagnosis answer before submission', () => {
    renderDiagnosisPage()

    fireEvent.click(screen.getByRole('button', { name: '진단 제출' }))

    expect(screen.getByRole('alert')).toHaveTextContent('진단 답변을 입력하세요.')
  })

  it('renders correction message and links back to the general question flow', async () => {
    renderDiagnosisPage()

    fireEvent.change(
      screen.getByLabelText('오답을 고른 이유와 헷갈린 개념을 적어 보세요.'),
      { target: { value: '개념 정의와 예시를 헷갈려서 오답을 골랐습니다.' } },
    )
    fireEvent.click(screen.getByRole('button', { name: '진단 제출' }))

    expect(await screen.findByRole('heading', { name: '교정 메시지' })).toBeInTheDocument()
    expect(screen.getByText('개념 정의')).toBeInTheDocument()
    expect(screen.getByText('적용 사례')).toBeInTheDocument()
    expect(screen.getByText('같은 개념을 다른 예시로 다시 질문해 보세요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '일반 질문으로 이어가기' })).toHaveAttribute(
      'href',
      '/sessions/session-100',
    )
  })
})
