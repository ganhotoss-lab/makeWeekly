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
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-600 text-lg">Weekly Report</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">사용자</span>
            </div>
            <Link href="/weekly" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              이번 주 Weekly
            </Link>
            <Link href="/history" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              이력 조회
            </Link>
            {profile?.role === 'admin' && (
              <Link href="/admin/dashboard" className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors">
                관리자 화면
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm text-gray-600">
              {profile?.name} <span className="text-gray-400">({profile?.team})</span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
