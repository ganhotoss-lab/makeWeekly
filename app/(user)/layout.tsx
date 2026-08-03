import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import { LoadingProvider } from '@/lib/loading-context'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import NavigationWatcher from '@/components/ui/NavigationWatcher'
import NavLink from '@/components/ui/NavLink'

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
    <LoadingProvider>
      <div className="min-h-screen bg-gray-50">
        <LoadingOverlay />
        <NavigationWatcher />
        <nav className="bg-white border-b border-gray-200 px-4 sm:px-6">
          {/* 상단: 로고 + 사용자 */}
          <div className="flex items-center justify-between py-2.5">
            <span className="font-bold text-blue-600 text-lg">Weekly Report</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {profile?.name} <span className="text-gray-400">({profile?.team})</span>
              </span>
              <LogoutButton />
            </div>
          </div>
          {/* 하단: 네비 링크 */}
          <div className="flex items-center overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center border border-gray-200 rounded-lg divide-x divide-gray-200 overflow-hidden shrink-0">
              <NavLink href="/weekly" className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 hover:bg-blue-50 transition-colors">
                이번 주 Weekly
              </NavLink>
              <NavLink href="/history" className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 hover:bg-blue-50 transition-colors">
                이력 조회
              </NavLink>
              <NavLink href="/summary" className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 hover:bg-blue-50 transition-colors">
                AI 요약
              </NavLink>
              <NavLink href="/change-password" className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 hover:bg-blue-50 transition-colors">
                비밀번호 변경
              </NavLink>
              {profile?.role === 'admin' && (
                <NavLink href="/admin/dashboard" className="text-sm text-purple-600 hover:text-purple-800 font-medium px-3 py-1.5 hover:bg-purple-50 transition-colors">
                  관리자 화면
                </NavLink>
              )}
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </div>
    </LoadingProvider>
  )
}
