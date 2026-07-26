import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import { LoadingProvider } from '@/lib/loading-context'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

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
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
            <Link href="/weekly" className="shrink-0 text-sm text-gray-600 hover:text-blue-600 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors">
              이번 주 Weekly
            </Link>
            <Link href="/history" className="shrink-0 text-sm text-gray-600 hover:text-blue-600 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors">
              이력 조회
            </Link>
            {profile?.role === 'admin' && (
              <Link href="/admin/dashboard" className="shrink-0 text-sm text-purple-600 hover:text-purple-800 font-medium px-2 py-1 rounded-md hover:bg-purple-50 transition-colors">
                관리자 화면
              </Link>
            )}
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </div>
    </LoadingProvider>
  )
}
