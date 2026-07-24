'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WeeklyEntry, Task } from '@/types'

interface EntryWithTask extends WeeklyEntry {
  tasks: Task
}

interface WeekOption {
  week_start_date: string
  week_label: string
}

export default function HistoryPage() {
  const [weeks, setWeeks] = useState<WeekOption[]>([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [entries, setEntries] = useState<EntryWithTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('weekly_entries')
        .select('week_start_date, week_label')
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: false })

      const seen = new Set<string>()
      const unique: WeekOption[] = []
      data?.forEach(d => {
        if (!seen.has(d.week_start_date)) {
          seen.add(d.week_start_date)
          unique.push({ week_start_date: d.week_start_date, week_label: d.week_label })
        }
      })
      setWeeks(unique)
      if (unique.length > 0) setSelectedWeek(unique[0].week_start_date)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedWeek) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('weekly_entries')
        .select('*, tasks(*)')
        .eq('user_id', user.id)
        .eq('week_start_date', selectedWeek)
        .order('created_at', { ascending: true })
      setEntries((data as EntryWithTask[]) || [])
    })
  }, [selectedWeek])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        불러오는 중...
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Weekly 이력 조회</h1>

      {weeks.length === 0 ? (
        <p className="text-gray-400 text-center py-16">이력이 없습니다.</p>
      ) : (
        <>
          <div className="flex gap-2 mb-6 flex-wrap">
            {weeks.map(w => (
              <button
                key={w.week_start_date}
                onClick={() => setSelectedWeek(w.week_start_date)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  selectedWeek === w.week_start_date
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                {w.week_label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
                    {entry.tasks.category}
                  </span>
                  {entry.tasks.is_completed && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md">완료</span>
                  )}
                  <span className="font-medium text-sm text-gray-900">{entry.tasks.content}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-1 font-medium">This Week</p>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {entry.this_week || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1 font-medium">Next Week</p>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {entry.next_week || '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
