const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const timeFormatter = new Intl.DateTimeFormat('ko-KR', { timeStyle: 'short' })

export function formatTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : formatWithKoreanDayPeriod(timeFormatter, date)
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dateFormatter.format(date)
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? iso
    : formatWithKoreanDayPeriod(dateTimeFormatter, date)
}

export function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || Number.isNaN(bytes)) return '-'
  if (bytes < 1024) return `${bytes}B`
  const megabytes = bytes / (1024 * 1024)
  if (megabytes < 1) return `${Math.round(bytes / 1024)}KB`
  return `${megabytes.toFixed(1)}MB`
}

function formatWithKoreanDayPeriod(
  formatter: Intl.DateTimeFormat,
  date: Date,
): string {
  return formatter.formatToParts(date).map((part) => {
    if (part.type !== 'dayPeriod') return part.value
    const dayPeriod = part.value.toUpperCase()
    if (dayPeriod === 'AM' || part.value === '오전') return '오전'
    if (dayPeriod === 'PM' || part.value === '오후') return '오후'
    return part.value
  }).join('')
}
