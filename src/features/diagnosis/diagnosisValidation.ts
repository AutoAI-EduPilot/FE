export function validateDiagnosisAnswer(answer: string): string | null {
  const trimmedAnswer = answer.trim()

  if (!trimmedAnswer) {
    return '진단 답변을 입력하세요.'
  }

  if (trimmedAnswer.length < 10) {
    return '진단 답변은 10자 이상 입력하세요.'
  }

  return null
}
