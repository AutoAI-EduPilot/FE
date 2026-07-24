import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

interface ButtonStyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
}

export interface ButtonProps
  extends ButtonStyleProps,
    ButtonHTMLAttributes<HTMLButtonElement> {}

export function Button({
  children,
  className,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={getButtonClassName({ className, size, variant })}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}

export interface ButtonLinkProps extends ButtonStyleProps, LinkProps {}

export function ButtonLink({
  children,
  className,
  size = 'md',
  variant = 'primary',
  ...props
}: PropsWithChildren<ButtonLinkProps>) {
  return (
    <Link className={getButtonClassName({ className, size, variant })} {...props}>
      {children}
    </Link>
  )
}

function getButtonClassName({
  className,
  size,
  variant,
}: Required<ButtonStyleProps> & { className?: string }): string {
  return [
    'inline-flex min-h-10 items-center justify-center rounded-lg border font-semibold',
    'transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600',
    'disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400',
    sizeClasses[size],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-teal-700 bg-teal-700 text-white hover:bg-teal-800',
  secondary: 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50',
  ghost: 'border-transparent bg-transparent text-zinc-700 hover:bg-zinc-100',
}
