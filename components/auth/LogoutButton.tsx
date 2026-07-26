'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLoading } from '@/lib/loading-context'

export default function LogoutButton() {
  const router = useRouter()
  const { startLoading, stopLoading } = useLoading()

  async function handleLogout() {
    startLoading()
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } finally {
      stopLoading()
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-gray-700 transition-all duration-75 active:scale-95 active:opacity-90"
    >
      로그아웃
    </button>
  )
}
