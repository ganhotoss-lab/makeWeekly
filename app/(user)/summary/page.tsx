'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getWeekLabel } from '@/lib/week'

interface UserSummary {
  id: string
  week_start_date: string
  summary_text: string
  created_at: string
}

export default function MySummaryPage() {
  const [summaries, setSummaries] = useState<UserSummary[]>([])
  const [selected, setSelected] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('user_summaries')
      .select('*')
      .order('week_start_date', { ascending: false })
      .then(({ data }) => {
        const list = data || []
        setSummaries(list)
        if (list.length > 0) setSelected(list[0].week_start_date)
        setLoading(false)
      })
  }, [])

  const current = summaries.find(s => s.week_start_date === selected)

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-gray-400">불러오는 중...</div>
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">내 AI 요약</h1>

      {summaries.length === 0 ? (
        <p className="text-gray-400 text-center py-16">아직 생성된 AI 요약이 없습니다.</p>
      ) : (
        <>
          {/* 주차 탭 */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
            {summaries.map(s => (
              <button
                key={s.week_start_date}
                onClick={() => setSelected(s.week_start_date)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm border transition-all duration-75 active:scale-95 ${
                  selected === s.week_start_date
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                {getWeekLabel(s.week_start_date)}
              </button>
            ))}
          </div>

          {current && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-4 text-sm">
                {getWeekLabel(current.week_start_date)} 내 업무 요약
              </h2>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                {current.summary_text || '요약 내용이 없습니다.'}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  )
}
