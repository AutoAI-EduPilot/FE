export const MAX_MATERIAL_UPLOAD_BYTES = 45 * 1024 * 1024

export function validateMaterialUpload(file: File | null | undefined): string | null {
  if (!file) {
    return '업로드할 PDF 파일을 선택하세요.'
  }

  if (!isPdfFile(file)) {
    return 'PDF 파일만 업로드할 수 있습니다.'
  }

  if (file.size > MAX_MATERIAL_UPLOAD_BYTES) {
    return '45MB 이하의 PDF 파일만 업로드할 수 있습니다.'
  }

  return null
}

function isPdfFile(file: File): boolean {
  const hasPdfType = file.type === 'application/pdf'
  const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf')

  return hasPdfType || hasPdfExtension
}
