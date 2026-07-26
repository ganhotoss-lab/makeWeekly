'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLoading } from '@/lib/loading-context'
import { WeeklyEntry, Task, StageStatus, OpenStatus } from '@/types'

interface EntryWithTask extends WeeklyEntry {
  tasks: Task
}

interface WeekOption {
  week_start_date: string
  week_label: string
}

const STATUS_COLORS: Record<StageStatus, string> = {
  '미시작': 'bg-gray-100 text-gray-400',
  '진행중': 'bg-blue-100 text-blue-700',
  '완료':   'bg-green-100 text-green-700',
}

const OPEN_COLORS: Record<OpenStatus, string> = {
  '미오픈':   'bg-gray-100 text-gray-400',
  '오픈완료': 'bg-green-100 text-green-700',
}

function formatDate(d: string | null) {
  if (!d) return null
  return d.slice(5).replace('-', '/')
}

function StageSection({ task }: { task: Task }) {
  const stages = [
    {
      label: '분석/설계',
      status: task.analysis_status,
      start: task.analysis_start_date,
      end: task.analysis_end_date,
      colorClass: STATUS_COLORS[task.analysis_status],
    },
    {
      label: '개발',
      status: task.development_status,
      start: task.development_start_date,
      end: task.development_end_date,
      colorClass: STATUS_COLORS[task.development_status],
    },
    {
      label: 'UAT',
      status: task.uat_status,
      start: task.uat_start_date,
      end: task.uat_end_date,
      colorClass: STATUS_COLORS[task.uat_status],
    },
    {
      label: 'OPEN',
      status: task.open_status,
      start: task.open_date,
      end: null,
      colorClass: OPEN_COLORS[task.open_status],
    },
  ]

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
      {stages.map(s => (
        <div key={s.label} className="flex flex-col gap-1">
          <span className="text-xs text-gray-400 font-medium">{s.label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-md font-medium w-fit ${s.colorClass}`}>
            {s.status}
          </span>
          {(s.start || s.end) && (
            <span className="text-xs text-gray-400">
              {formatDate(s.start)}{s.end ? ` ~ ${formatDate(s.end)}` : ''}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function HistoryPage() {
  const [weeks, setWeeks] = useState<WeekOption[]>([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [entries, setEntries] = useState<EntryWithTask[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const { startLoading, stopLoading } = useLoading()

  function toggleStage(id: string) {
    setExpandedStages(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function loadWeeks() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
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
    return unique
  }

  async function loadEntries(week: string) {
    startLoading()
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('weekly_entries')
        .select('*, tasks(*)')
        .eq('user_id', user.id)
        .eq('week_start_date', week)
        .order('created_at', { ascending: true })
      setEntries((data as EntryWithTask[]) || [])
    } finally {
      stopLoading()
    }
  }

  useEffect(() => {
    loadWeeks().then(unique => {
      if (unique && unique.length > 0) setSelectedWeek(unique[0].week_start_date)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedWeek) return
    loadEntries(selectedWeek)
  }, [selectedWeek])

  async function handleDelete(entryId: string) {
    if (!confirm('이 위클리를 삭제하시겠습니까?')) return
    startLoading()
    try {
      const supabase = createClient()
      const { error } = await supabase.from('weekly_entries').delete().eq('id', entryId)
      if (error) {
        alert('삭제 중 오류가 발생했습니다: ' + error.message)
        return
      }
      await loadEntries(selectedWeek)
      const unique = await loadWeeks()
      if (unique && unique.length > 0 && !unique.find(w => w.week_start_date === selectedWeek)) {
        setSelectedWeek(unique[0].week_start_date)
      }
    } finally {
      stopLoading()
    }
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
      <h1 className="text-xl font-bold text-gray-900 mb-4">Weekly 이력 조회</h1>

      {weeks.length === 0 ? (
        <p className="text-gray-400 text-center py-16">이력이 없습니다.</p>
      ) : (
        <>
          {/* 주차 탭 — 모바일: 가로 스크롤 */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
            {weeks.map(w => (
              <button
                key={w.week_start_date}
                onClick={() => setSelectedWeek(w.week_start_date)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm border transition-all duration-75 active:scale-95 active:opacity-90 ${
                  selectedWeek === w.week_start_date
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                {w.week_label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
                {/* 카드 헤더 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-medium shrink-0">
                      {entry.tasks.category}
                    </span>
                    {entry.tasks.is_completed && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md shrink-0">완료</span>
                    )}
                    <span className="font-medium text-sm text-gray-900 break-words">{entry.tasks.title || entry.tasks.content}</span>
                    {entry.tasks.title && (
                      <span className="text-xs text-gray-500 break-words">{entry.tasks.content}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="shrink-0 text-xs border border-red-200 text-red-400 hover:bg-red-50 px-2 py-1 rounded-lg transition-all duration-75 active:scale-95 active:opacity-90"
                  >
                    삭제
                  </button>
                </div>

                {/* This Week / Next Week */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-3">
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

                {/* 단계별 진행상황 토글 */}
                <button
                  onClick={() => toggleStage(entry.id)}
                  className="mt-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                >
                  <span>{expandedStages.has(entry.id) ? '▲' : '▼'}</span>
                  단계별 진행상황
                </button>
                {expandedStages.has(entry.id) && <StageSection task={entry.tasks} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
