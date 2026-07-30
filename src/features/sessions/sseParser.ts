export interface SseMessage {
  data: string
  event: string
  id?: string
}

export async function consumeSseStream(
  stream: ReadableStream<Uint8Array>,
  onMessage: (message: SseMessage) => void,
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      buffer = emitCompleteBlocks(buffer, onMessage)
      if (done) break
    }

    if (buffer.trim()) emitBlock(buffer, onMessage)
  } finally {
    reader.releaseLock()
  }
}

function emitCompleteBlocks(
  input: string,
  onMessage: (message: SseMessage) => void,
): string {
  let buffer = input
  let boundary = findBoundary(buffer)

  while (boundary) {
    emitBlock(buffer.slice(0, boundary.index), onMessage)
    buffer = buffer.slice(boundary.index + boundary.length)
    boundary = findBoundary(buffer)
  }

  return buffer
}

function findBoundary(
  input: string,
): { index: number; length: number } | undefined {
  const match = /\r?\n\r?\n/.exec(input)
  return match ? { index: match.index, length: match[0].length } : undefined
}

function emitBlock(
  block: string,
  onMessage: (message: SseMessage) => void,
): void {
  let event = 'message'
  let id: string | undefined
  const data: string[] = []

  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue
    const separator = line.indexOf(':')
    const field = separator >= 0 ? line.slice(0, separator) : line
    const rawValue = separator >= 0 ? line.slice(separator + 1) : ''
    const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue

    if (field === 'event') event = value
    if (field === 'id') id = value
    if (field === 'data') data.push(value)
  }

  if (data.length > 0) {
    onMessage({ data: data.join('\n'), event, id })
  }
}
