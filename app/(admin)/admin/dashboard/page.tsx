import { createAdminClient } from '@/lib/supabase/server'
import { getWeekStartDate, getWeekLabel } from '@/lib/week'
import { User } from '@/types'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createAdminClient()
  const weekStart = getWeekStartDate()
  const weekLabel = getWeekLabel(weekStart)

  const [{ data: users, error: usersError }, { data: entries }, { data: activeTasks }] = await Promise.all([
    supabase.from('users').select('*').eq('is_active', true).neq('role', 'admin').order('team').order('name'),
    supabase.from('weekly_entries').select('user_id, task_id, updated_at').eq('week_start_date', weekStart),
    supabase.from('tasks').select('user_id').eq('is_completed', false),
  ])

  if (usersError) {
    return <div className="text-red-500 p-4">사용자 데이터를 불러오는 중 오류가 발생했습니다.</div>
  }

  const entryMap = new Map<string, { count: number; last: string }>()
  entries?.forEach(e => {
    const existing = entryMap.get(e.user_id)
    if (!existing) {
      entryMap.set(e.user_id, { count: 1, last: e.updated_at })
    } else {
      entryMap.set(e.user_id, {
        count: existing.count + 1,
        last: e.updated_at > existing.last ? e.updated_at : existing.last,
      })
    }
  })

  const activeTaskSet = new Set(activeTasks?.map(t => t.user_id) || [])

  const submitted = (users || []).filter(u => entryMap.has(u.id))
  const inProgress = (users || []).filter(u => !entryMap.has(u.id) && activeTaskSet.has(u.id))
  const notRegistered = (users || []).filter(u => !entryMap.has(u.id) && !activeTaskSet.has(u.id))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">작성 현황 대시보드</h1>
        <p className="text-gray-500 mt-1">{weekLabel}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="전체 대상자" value={users?.length || 0} color="blue" />
        <StatCard label="작성 완료" value={submitted.length} color="green" />
        <StatCard label="업무 진행 중" value={inProgress.length} color="yellow" />
        <StatCard label="미등록" value={notRegistered.length} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h2 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            작성 완료 ({submitted.length}명)
          </h2>
          <div className="space-y-2">
            {submitted.map(u => {
              const info = entryMap.get(u.id)!
              return (
                <div key={u.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-sm text-blue-600 hover:underline">
                      {u.name}
                    </Link>
                    <span className="text-xs text-gray-400">{u.team}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    업데이트 {info.count}건 ·{' '}
                    {new Date(info.last).toLocaleString('ko-KR', {
                      month: 'numeric', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                      timeZone: 'Asia/Seoul',
                    })}
                  </p>
                </div>
              )
            })}
            {submitted.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">작성자 없음</p>}
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-3 text-yellow-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
            업무 진행 중 ({inProgress.length}명)
          </h2>
          <div className="space-y-2">
            {inProgress.map(u => (
              <div key={u.id} className="bg-white border border-yellow-100 rounded-lg p-3">
                <div className="flex justify-between">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-sm text-blue-600 hover:underline">
                    {u.name}
                  </Link>
                  <span className="text-xs text-gray-400">{u.team}</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">위클리 미작성</p>
              </div>
            ))}
            {inProgress.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">해당 없음</p>}
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-3 text-red-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            미등록 ({notRegistered.length}명)
          </h2>
          <div className="space-y-2">
            {notRegistered.map(u => (
              <div key={u.id} className="bg-white border border-red-100 rounded-lg p-3">
                <div className="flex justify-between">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-sm text-blue-600 hover:underline">
                    {u.name}
                  </Link>
                  <span className="text-xs text-gray-400">{u.team}</span>
                </div>
              </div>
            ))}
            {notRegistered.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">미등록자 없음</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'yellow' | 'red' }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  }
  return (
    <div className={`${styles[color]} border rounded-xl p-5 text-center`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  )
}
