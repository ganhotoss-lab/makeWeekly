'use client'
import { useLoading } from '@/lib/loading-context'

export default function LoadingOverlay() {
  const { isLoading } = useLoading()
  if (!isLoading) return null

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-500 animate-pulse" />
      <div className="fixed inset-0 z-40 backdrop-blur-sm bg-white/10" />
    </>
  )
}
