'use client'
import Link from 'next/link'
import { useLoading } from '@/lib/loading-context'
import { ComponentProps } from 'react'

export default function NavLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const { startLoading } = useLoading()
  return (
    <Link
      {...props}
      onClick={e => {
        startLoading()
        onClick?.(e)
      }}
    />
  )
}
