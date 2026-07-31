'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Task, WeeklyEntry } from '@/types'
import TaskCard from '@/components/tasks/TaskCard'
import { getWeekStartDate, getWeekLabel, getPrevWeekStartDate } from '@/lib/week'

export default function WeeklyPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [entries, setEntries] = useState<Record<string, WeeklyEntry>>({})
  const [prevEntries, setPrevEntries] = useState<Record<string, WeeklyEntry>>({})
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [uncompleting, setUncompleting] = useState<string | null>(null)
  const weekStart = getWeekStartDate()
  const weekLabel = getWeekLabel(weekStart)
  const prevWeekStart = getPrevWeekStartDate(weekStart)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: taskData }, { data: completedData }, { data: entryData }, { data: prevEntryData }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_completed', false)
          .order('created_at', { ascending: true }),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .order('updated_at', { ascending: false }),
        supabase
          .from('weekly_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start_date', weekStart),
        supabase
          .from('weekly_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start_date', prevWeekStart),
      ])

      setTasks(taskData || [])
      setCompletedTasks(completedData || [])
      const entryMap: Record<string, WeeklyEntry> = {}
      entryData?.forEach(e => { entryMap[e.task_id] = e })
      setEntries(entryMap)
      const prevEntryMap: Record<string, WeeklyEntry> = {}
      prevEntryData?.forEach(e => { prevEntryMap[e.task_id] = e })
      setPrevEntries(prevEntryMap)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { load() }, [load])

  async function handleUncomplete(taskId: string) {
    setUncompleting(taskId)
    const supabase = createClient()
    await supabase.from('tasks').update({ is_completed: false }).eq('id', taskId)
    setUncompleting(null)
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        불러오는 중...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">이번 주 Weekly</h1>
          <p className="text-sm text-gray-500 mt-0.5">{weekLabel}</p>
        </div>
        <Link
          href="/tasks/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + 신규 업무 추가
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="mb-3">등록된 업무 항목이 없습니다.</p>
          <Link
            href="/tasks/new"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            신규 업무 추가하기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              entry={entries[task.id] || null}
              prevEntry={prevEntries[task.id] || null}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowCompleted(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-3"
          >
            <span>{showCompleted ? '▼' : '▶'}</span>
            <span>완료된 업무 ({completedTasks.length})</span>
          </button>
          {showCompleted && (
            <div className="space-y-2">
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-gray-400 bg-gray-200 rounded px-1.5 py-0.5">{task.category}</span>
                      <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">완료</span>
                    </div>
                    <p className="text-sm text-gray-400 line-through truncate">{task.content}</p>
                  </div>
                  <button
                    onClick={() => handleUncomplete(task.id)}
                    disabled={uncompleting === task.id}
                    className="shrink-0 text-xs text-gray-400 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {uncompleting === task.id ? '처리 중...' : '완료 취소'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
