import type { HTMLAttributes } from 'react'

import { cx } from '../lib/cx'

export type PageContainerProps = HTMLAttributes<HTMLDivElement>

export function PageContainer({
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cx('w-full space-y-5', className)}
      {...props}
    />
  )
}
