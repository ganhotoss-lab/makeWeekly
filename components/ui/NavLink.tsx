'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLoading } from '@/lib/loading-context'
import { ComponentProps } from 'react'

export default function NavLink({ onClick, href, ...props }: ComponentProps<typeof Link>) {
  const { startLoading } = useLoading()
  const pathname = usePathname()
  return (
    <Link
      href={href}
      {...props}
      onClick={e => {
        if (pathname !== href.toString()) startLoading()
        onClick?.(e)
      }}
    />
  )
}
