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
      <nav className="bg-purple-700 text-white px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">Weekly Admin</span>
              <span className="text-xs bg-white text-purple-700 px-1.5 py-0.5 rounded font-bold">관리자</span>
            </div>
            <Link href="/admin/dashboard" className="text-sm hover:text-purple-200 transition-colors">
              대시보드
            </Link>
            <Link href="/admin/users" className="text-sm hover:text-purple-200 transition-colors">
              사용자 관리
            </Link>
            <Link href="/admin/summary" className="text-sm hover:text-purple-200 transition-colors">
              취합 / 발송
            </Link>
            <Link href="/admin/email-logs" className="text-sm hover:text-purple-200 transition-colors">
              발송 이력
            </Link>
            <Link href="/weekly" className="text-sm hover:text-purple-200 transition-colors text-purple-300">
              일반 화면
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-purple-200">{profile?.name}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
