import '@testing-library/jest-dom/vitest'
import { createElement, type ReactNode } from 'react'
import { vi } from 'vitest'

// jsdom에는 scrollIntoView가 없다 (채팅 자동 스크롤에서 사용).
Element.prototype.scrollIntoView ??= () => {}

vi.mock('react-pdf', () => ({
  Document: ({ children }: { children: ReactNode }) =>
    createElement('div', { 'data-testid': 'pdf-document' }, children),
  Page: ({ pageNumber }: { pageNumber: number }) =>
    createElement('div', { 'data-testid': 'pdf-page' }, `PDF ${pageNumber}쪽`),
  pdfjs: {
    GlobalWorkerOptions: {},
  },
}))
