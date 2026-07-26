import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import { LoadingProvider } from '@/lib/loading-context'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import NavigationWatcher from '@/components/ui/NavigationWatcher'
import NavLink from '@/components/ui/NavLink'

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
    <LoadingProvider>
      <div className="min-h-screen bg-gray-50">
        <LoadingOverlay />
        <NavigationWatcher />
        <nav className="bg-purple-700 text-white px-4 sm:px-6">
          {/* 상단: 로고 + 사용자 */}
          <div className="flex items-center justify-between py-2.5">
            <span className="font-bold text-lg">Weekly Admin</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-purple-200 hidden sm:inline">{profile?.name}</span>
              <LogoutButton />
            </div>
          </div>
          {/* 하단: 네비 링크 */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
            <NavLink href="/admin/dashboard" className="shrink-0 text-sm hover:text-purple-200 px-2 py-1 rounded-md hover:bg-purple-600 transition-colors">
              대시보드
            </NavLink>
            <NavLink href="/admin/users" className="shrink-0 text-sm hover:text-purple-200 px-2 py-1 rounded-md hover:bg-purple-600 transition-colors">
              사용자 관리
            </NavLink>
            <NavLink href="/admin/summary" className="shrink-0 text-sm hover:text-purple-200 px-2 py-1 rounded-md hover:bg-purple-600 transition-colors">
              취합 / 발송
            </NavLink>
            <NavLink href="/admin/email-logs" className="shrink-0 text-sm hover:text-purple-200 px-2 py-1 rounded-md hover:bg-purple-600 transition-colors">
              발송 이력
            </NavLink>
            <NavLink href="/weekly" className="shrink-0 text-sm text-purple-300 hover:text-purple-100 px-2 py-1 rounded-md hover:bg-purple-600 transition-colors">
              일반 화면
            </NavLink>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </div>
    </LoadingProvider>
  )
}
