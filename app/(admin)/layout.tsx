import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/weekly')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-purple-700 text-white px-4 py-0">
        {/* 상단 행: 로고 + 사용자 + 로그아웃 */}
        <div className="flex items-center justify-between py-2">
          <span className="font-bold text-lg whitespace-nowrap">Weekly Admin</span>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-purple-200">{profile?.name}</span>
            <LogoutButton />
          </div>
        </div>
        {/* 하단 행: 네비 링크 (가로 스크롤) */}
        <div className="flex items-center gap-5 overflow-x-auto pb-2 scrollbar-none">
          <Link href="/admin/dashboard" className="text-sm hover:text-purple-200 transition-colors whitespace-nowrap shrink-0">
            대시보드
          </Link>
          <Link href="/admin/users" className="text-sm hover:text-purple-200 transition-colors whitespace-nowrap shrink-0">
            사용자 관리
          </Link>
          <Link href="/admin/summary" className="text-sm hover:text-purple-200 transition-colors whitespace-nowrap shrink-0">
            취합 / 발송
          </Link>
          <Link href="/admin/email-logs" className="text-sm hover:text-purple-200 transition-colors whitespace-nowrap shrink-0">
            발송 이력
          </Link>
          <Link href="/weekly" className="text-sm hover:text-purple-200 transition-colors text-purple-300 whitespace-nowrap shrink-0">
            일반 화면
          </Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
