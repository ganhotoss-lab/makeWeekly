import { createClient } from '@/lib/supabase/server'
import { getWeekStartDate, getWeekLabel } from '@/lib/week'
import { Task, WeeklyEntry } from '@/types'

interface TaskWithEntries extends Task {
  weekly_entries: WeeklyEntry[]
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const weekStart = getWeekStartDate()
  const weekLabel = getWeekLabel(weekStart)

  const [{ data: user }, { data: tasks }] = await Promise.all([
    supabase.from('users').select('*').eq('id', id).single(),
    supabase
      .from('tasks')
      .select('*, weekly_entries(*)')
      .eq('user_id', id)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {user?.name}{' '}
          <span className="text-gray-400 font-normal text-base">({user?.team})</span>
        </h1>
        <p className="text-gray-500 mt-0.5">{weekLabel} 기준 업무 현황</p>
      </div>

      <div className="space-y-4">
        {tasks?.map((task: TaskWithEntries) => {
          const thisWeekEntry = task.weekly_entries?.find(
            e => e.week_start_date === weekStart
          )
          return (
            <div
              key={task.id}
              className={`bg-white border rounded-xl p-5 shadow-sm ${
                task.is_completed ? 'opacity-60 border-gray-100' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
                  {task.category}
                </span>
                {task.is_completed && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md">완료</span>
                )}
              </div>
              <p className="font-medium text-gray-900 mb-1">{task.title || task.content}</p>
              {task.title && (
                <p className="text-sm text-gray-500 mb-2">{task.content}</p>
              )}
              <div className="flex gap-2 text-xs flex-wrap mb-3">
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  분석/설계: {task.analysis_status}
                </span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  개발: {task.development_status}
                </span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  UAT: {task.uat_status}
                </span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  OPEN: {task.open_status}
                </span>
              </div>

              {thisWeekEntry ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1 font-medium">This Week</p>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {thisWeekEntry.this_week || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1 font-medium">Next Week</p>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {thisWeekEntry.next_week || '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 border-t border-gray-100 pt-3">
                  이번 주 업데이트 없음
                </p>
              )}
            </div>
          )
        })}
        {(!tasks || tasks.length === 0) && (
          <p className="text-center text-gray-400 py-16">등록된 업무 항목이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
