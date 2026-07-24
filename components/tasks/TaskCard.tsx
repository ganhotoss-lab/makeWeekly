'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Task, WeeklyEntry, StageStatus } from '@/types'
import WeeklyUpdateForm from './WeeklyUpdateForm'

const STATUS_COLOR: Record<StageStatus, string> = {
  '미시작': 'bg-gray-100 text-gray-500',
  '진행중': 'bg-blue-100 text-blue-700',
  '완료': 'bg-green-100 text-green-700',
}

interface Props {
  task: Task
  entry: WeeklyEntry | null
  onRefresh: () => void
}

export default function TaskCard({ task, entry, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
              {task.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_COLOR[task.analysis_status]}`}>
              분석/설계: {task.analysis_status}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_COLOR[task.development_status]}`}>
              개발: {task.development_status}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_COLOR[task.uat_status]}`}>
              UAT: {task.uat_status}
            </span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
              OPEN: {task.open_status}
            </span>
          </div>
          <p className="font-medium text-gray-900">{task.content}</p>
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
          onSaved={onRefresh}
          onComplete={onRefresh}
        />
      )}
    </div>
  )
}
