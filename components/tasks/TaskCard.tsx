'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Task, WeeklyEntry, StageStatus } from '@/types'
import { createClient } from '@/lib/supabase/client'
import WeeklyUpdateForm from './WeeklyUpdateForm'

const STATUS_COLOR: Record<string, string> = {
  '미시작': 'bg-gray-100 text-gray-400',
  '진행중': 'bg-blue-100 text-blue-700',
  '완료': 'bg-green-100 text-green-700',
  '미오픈': 'bg-gray-100 text-gray-400',
  '오픈완료': 'bg-green-100 text-green-700',
}

function fmtD(d?: string | null) {
  if (!d) return null
  const [, m, day] = d.split('-')
  return `${parseInt(m)}/${parseInt(day)}`
}

function StageChip({ label, status, start, end }: { label: string; status: string; start?: string | null; end?: string | null }) {
  const color = STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-400'
  const s = fmtD(start)
  const e = fmtD(end)
  const dates = s || e ? ` · ${s ?? '?'}~${e ?? '?'}` : ''
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md ${color}`}>
      {label}{dates || `: ${status}`}
    </span>
  )
}

interface Props {
  task: Task
  entry: WeeklyEntry | null
  prevEntry?: WeeklyEntry | null
  onRefresh: () => void
}

export default function TaskCard({ task, entry, prevEntry, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [duplicating, setDuplicating] = useState(false)
  const [duplicated, setDuplicated] = useState(false)

  async function handleDuplicate() {
    setDuplicating(true)
    setDuplicated(false)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('tasks').insert({
        user_id: task.user_id,
        category: task.category,
        title: task.title ? `${task.title} (복사본)` : null,
        request_dept: task.request_dept,
        content: task.content,
        analysis_status: task.analysis_status,
        analysis_start_date: task.analysis_start_date,
        analysis_end_date: task.analysis_end_date,
        development_status: task.development_status,
        development_start_date: task.development_start_date,
        development_end_date: task.development_end_date,
        uat_status: task.uat_status,
        uat_start_date: task.uat_start_date,
        uat_end_date: task.uat_end_date,
        open_status: task.open_status,
        open_date: task.open_date,
        note: task.note,
        is_completed: false,
      })
      if (!error) {
        setDuplicated(true)
        onRefresh()
        setTimeout(() => setDuplicated(false), 2000)
      }
    } finally {
      setDuplicating(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
              {task.category}
            </span>
            <StageChip label="분석" status={task.analysis_status} start={task.analysis_start_date} end={task.analysis_end_date} />
            <StageChip label="개발" status={task.development_status} start={task.development_start_date} end={task.development_end_date} />
            <StageChip label="UAT" status={task.uat_status} start={task.uat_start_date} end={task.uat_end_date} />
            <StageChip label="OPEN" status={task.open_status} start={task.open_date} />
          </div>
          <p className="font-medium text-gray-900">{task.title || task.content}</p>
          {task.title && (
            <p className="text-sm text-gray-500 mt-0.5">{task.content}</p>
          )}
          {task.note && (
            <p className="text-sm text-gray-400 mt-1">비고: {task.note}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/tasks/${task.id}`}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            수정
          </Link>
          <button
            onClick={handleDuplicate}
            disabled={duplicating}
            className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
          >
            {duplicated ? '복제됨' : duplicating ? '...' : '복제'}
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? '접기' : '펼치기'}
          </button>
        </div>
      </div>

      {expanded && (
        <WeeklyUpdateForm
          task={task}
          entry={entry}
          prevEntry={prevEntry}
          onSaved={onRefresh}
          onComplete={onRefresh}
        />
      )}
    </div>
  )
}
