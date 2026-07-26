'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Task, WeeklyEntry } from '@/types'
import TaskCard from '@/components/tasks/TaskCard'
import { getWeekStartDate, getWeekLabel } from '@/lib/week'

export default function WeeklyPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [entries, setEntries] = useState<Record<string, WeeklyEntry>>({})
  const [loading, setLoading] = useState(true)
  const weekStart = getWeekStartDate()
  const weekLabel = getWeekLabel(weekStart)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: taskData }, { data: entryData }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_completed', false)
          .order('created_at', { ascending: true }),
        supabase
          .from('weekly_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start_date', weekStart),
      ])

      setTasks(taskData || [])
      const entryMap: Record<string, WeeklyEntry> = {}
      entryData?.forEach(e => { entryMap[e.task_id] = e })
      setEntries(entryMap)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { load() }, [load])

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
              onRefresh={load}
            />
          ))}
        </div>
      )}
    </div>
  )
}
