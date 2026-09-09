const NOTE_MEDIA_SLASH_MENU_KEYS = new Set(['audio', 'file', 'image', 'video'])

export function filterNoteSlashMenuItems<T>(items: T[]): T[] {
  return items.filter((item) => {
    const key = (item as { key?: unknown }).key
    return typeof key !== 'string' || !NOTE_MEDIA_SLASH_MENU_KEYS.has(key)
  })
}
