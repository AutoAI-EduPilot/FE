import '@testing-library/jest-dom/vitest'

// jsdom에는 scrollIntoView가 없다 (채팅 자동 스크롤에서 사용).
Element.prototype.scrollIntoView ??= () => {}
