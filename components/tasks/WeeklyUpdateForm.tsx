'use client'
import { useState } from 'react'
import { Task, WeeklyEntry } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { getWeekStartDate, getWeekLabel } from '@/lib/week'
import { useLoading } from '@/lib/loading-context'

interface Props {
  task: Task
  entry: WeeklyEntry | null
  onSaved: () => void
  onComplete: () => void
}

export default function WeeklyUpdateForm({ task, entry, onSaved, onComplete }: Props) {
  const [thisWeek, setThisWeek] = useState(entry?.this_week || '')
  const [nextWeek, setNextWeek] = useState(entry?.next_week || '')
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const { startLoading, stopLoading } = useLoading()

  async function handleSave() {
    startLoading()
    setSaving(true)
    setSaved(false)
    try {
      const supabase = createClient()
      const weekStart = getWeekStartDate()
      if (entry) {
        await supabase
          .from('weekly_entries')
          .update({ this_week: thisWeek, next_week: nextWeek })
          .eq('id', entry.id)
      } else {
        await supabase.from('weekly_entries').insert({
          task_id: task.id,
          user_id: task.user_id,
          week_start_date: weekStart,
          week_label: getWeekLabel(weekStart),
          this_week: thisWeek,
          next_week: nextWeek,
        })
      }
      setSaved(true)
      onSaved()
    } finally {
      setSaving(false)
      stopLoading()
    }
  }

  async function handleComplete() {
    if (!confirm('이 업무를 완료 처리하시겠습니까?')) return
    startLoading()
    setCompleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: true })
        .eq('id', task.id)
      if (error) {
        alert('완료 처리 중 오류가 발생했습니다: ' + error.message)
        return
      }
      onComplete()
    } finally {
      setCompleting(false)
      stopLoading()
    }
  }

  async function handleDeleteEntry() {
    if (!entry) return
    if (!confirm('이번 주 위클리를 삭제하시겠습니까?')) return
    startLoading()
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('weekly_entries').delete().eq('id', entry.id)
      if (error) {
        alert('삭제 중 오류가 발생했습니다: ' + error.message)
        return
      }
      onSaved()
    } finally {
      setDeleting(false)
      stopLoading()
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">This Week</label>
          <textarea
            value={thisWeek}
            onChange={e => { setThisWeek(e.target.value); setSaved(false) }}
            rows={3}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="이번 주 수행 내용"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Next Week</label>
          <textarea
            value={nextWeek}
            onChange={e => { setNextWeek(e.target.value); setSaved(false) }}
            rows={3}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="다음 주 수행 예정"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-all duration-75 active:scale-95 active:opacity-90"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={handleComplete}
          disabled={completing}
          className="border border-gray-300 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50 text-gray-600 transition-all duration-75 active:scale-95 active:opacity-90 disabled:opacity-50"
        >
          완료 처리
        </button>
        {entry && (
          <button
            onClick={handleDeleteEntry}
            disabled={deleting}
            className="border border-red-200 px-4 py-1.5 rounded-lg text-sm hover:bg-red-50 text-red-500 transition-all duration-75 active:scale-95 active:opacity-90 disabled:opacity-50"
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        )}
        {saved && <span className="text-green-600 text-xs">저장되었습니다</span>}
      </div>
    </div>
  )
}
