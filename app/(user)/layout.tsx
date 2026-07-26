import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, team, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-0">
        {/* 상단 행: 로고 + 사용자 + 로그아웃 */}
        <div className="flex items-center justify-between py-2">
          <span className="font-bold text-blue-600 text-lg whitespace-nowrap">Weekly Report</span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray-600">
              {profile?.name} <span className="text-gray-400">({profile?.team})</span>
            </span>
            <LogoutButton />
          </div>
        </div>
        {/* 하단 행: 네비 링크 (가로 스크롤) */}
        <div className="flex items-center gap-5 overflow-x-auto pb-2 scrollbar-none">
          <Link href="/weekly" className="text-sm text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap shrink-0">
            이번 주 Weekly
          </Link>
          <Link href="/history" className="text-sm text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap shrink-0">
            이력 조회
          </Link>
          <span className="text-sm text-gray-500 sm:hidden whitespace-nowrap shrink-0">
            {profile?.name}
          </span>
          {profile?.role === 'admin' && (
            <Link href="/admin/dashboard" className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors whitespace-nowrap shrink-0">
              관리자 화면
            </Link>
          )}
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
