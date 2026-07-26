'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useLoading } from '@/lib/loading-context'

export default function NavigationWatcher() {
  const pathname = usePathname()
  const { clearLoading } = useLoading()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    clearLoading()
  }, [pathname, clearLoading])

  return null
}
