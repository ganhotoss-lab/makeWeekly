'use client'
import { useState } from 'react'
import { Category, StageStatus, OpenStatus, Task } from '@/types'

export interface TaskFormData {
  category: Category
  content: string
  analysis_status: StageStatus
  analysis_start_date: string
  analysis_end_date: string
  development_status: StageStatus
  development_start_date: string
  development_end_date: string
  uat_status: StageStatus
  uat_start_date: string
  uat_end_date: string
  open_status: OpenStatus
  open_date: string
  note: string
  this_week: string
  next_week: string
}

interface TaskFormProps {
  initialData?: Partial<Task>
  onSubmit: (data: TaskFormData) => Promise<void>
  submitLabel?: string
  showWeeklyFields?: boolean
}

const CATEGORIES: Category[] = ['Biz사업', '내부개선', '상품', '기타']
const STAGE_STATUSES: StageStatus[] = ['미시작', '진행중', '완료']

export default function TaskForm({
  initialData,
  onSubmit,
  submitLabel = '저장',
  showWeeklyFields = true,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>({
    category: (initialData?.category as Category) || 'Biz사업',
    content: initialData?.content || '',
    analysis_status: (initialData?.analysis_status as StageStatus) || '미시작',
    analysis_start_date: initialData?.analysis_start_date || '',
    analysis_end_date: initialData?.analysis_end_date || '',
    development_status: (initialData?.development_status as StageStatus) || '미시작',
    development_start_date: initialData?.development_start_date || '',
    development_end_date: initialData?.development_end_date || '',
    uat_status: (initialData?.uat_status as StageStatus) || '미시작',
    uat_start_date: initialData?.uat_start_date || '',
    uat_end_date: initialData?.uat_end_date || '',
    open_status: (initialData?.open_status as OpenStatus) || '미오픈',
    open_date: initialData?.open_date || '',
    note: initialData?.note || '',
    this_week: '',
    next_week: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.content.trim()) { setError('업무 내용을 입력해주세요.'); return }
    setLoading(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 구분 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">구분</label>
        <select
          value={form.category}
          onChange={e => set('category', e.target.value as Category)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* 업무 내용 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          업무 내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.content}
          onChange={e => set('content', e.target.value)}
          rows={3}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="업무 목적 및 개요를 입력하세요"
        />
      </div>

      {/* 단계별 진행상태 */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-sm text-gray-700">단계별 진행상태</h3>
        <StageRow
          label="분석/설계"
          statusKey="analysis_status"
          startKey="analysis_start_date"
          endKey="analysis_end_date"
          form={form}
          set={set}
          statuses={STAGE_STATUSES}
        />
        <StageRow
          label="개발"
          statusKey="development_status"
          startKey="development_start_date"
          endKey="development_end_date"
          form={form}
          set={set}
          statuses={STAGE_STATUSES}
        />
        <StageRow
          label="UAT"
          statusKey="uat_status"
          startKey="uat_start_date"
          endKey="uat_end_date"
          form={form}
          set={set}
          statuses={STAGE_STATUSES}
        />
        {/* OPEN */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-sm text-gray-600 sm:w-24">OPEN</span>
          <select
            value={form.open_status}
            onChange={e => set('open_status', e.target.value as OpenStatus)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>미오픈</option>
            <option>오픈완료</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">예정일</span>
            <input
              type="date"
              value={form.open_date}
              onChange={e => set('open_date', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* This Week / Next Week */}
      {showWeeklyFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">This Week</label>
            <textarea
              value={form.this_week}
              onChange={e => set('this_week', e.target.value)}
              rows={4}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이번 주 실제 수행 내용"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Week</label>
            <textarea
              value={form.next_week}
              onChange={e => set('next_week', e.target.value)}
              rows={4}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="다음 주 수행 예정 내용"
            />
          </div>
        </div>
      )}

      {/* 비고 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
        <textarea
          value={form.note}
          onChange={e => set('note', e.target.value)}
          rows={2}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="이슈, 리스크 등"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all duration-75 active:scale-95 active:opacity-90"
      >
        {loading ? '저장 중...' : submitLabel}
      </button>
    </form>
  )
}

function StageRow({
  label, statusKey, startKey, endKey, form, set, statuses,
}: {
  label: string
  statusKey: keyof TaskFormData
  startKey: keyof TaskFormData
  endKey: keyof TaskFormData
  form: TaskFormData
  set: <K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) => void
  statuses: StageStatus[]
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <span className="text-sm text-gray-600 sm:w-24">{label}</span>
      <select
        value={form[statusKey] as string}
        onChange={e => set(statusKey, e.target.value as StageStatus)}
        className="border border-gray-300 rounded px-2 py-1.5 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {statuses.map(s => <option key={s}>{s}</option>)}
      </select>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={form[startKey] as string}
          onChange={e => set(startKey, e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-400">~</span>
        <input
          type="date"
          value={form[endKey] as string}
          onChange={e => set(endKey, e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
