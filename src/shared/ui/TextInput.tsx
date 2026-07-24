import type { InputHTMLAttributes } from 'react'

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  description?: string
  error?: string
  id: string
  label: string
}

export function TextInput({
  className,
  description,
  error,
  id,
  label,
  ...props
}: TextInputProps) {
  const describedBy = getDescribedBy({ description, error, id })

  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-800" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={[
          'mt-1 block min-h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-950',
          'placeholder:text-zinc-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100',
          error ? 'border-rose-400' : 'border-zinc-300',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        id={id}
        {...props}
      />
      {description ? (
        <p className="mt-1 text-xs text-zinc-500" id={`${id}-description`}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-700" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

function getDescribedBy({
  description,
  error,
  id,
}: Pick<TextInputProps, 'description' | 'error' | 'id'>): string | undefined {
  const ids = [
    description ? `${id}-description` : undefined,
    error ? `${id}-error` : undefined,
  ].filter(Boolean)

  return ids.length > 0 ? ids.join(' ') : undefined
}
