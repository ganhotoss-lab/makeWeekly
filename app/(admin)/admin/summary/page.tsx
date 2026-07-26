'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getWeekStartDate, getWeekLabel } from '@/lib/week'
import { User } from '@/types'

interface SummaryData {
  fullText: string
  weekLabel: string
  weekStart: string
  usersData: unknown[]
}

function getRecentWeeks(n: number): { value: string; label: string }[] {
  const seen = new Set<string>()
  const weeks: { value: string; label: string }[] = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i * 7)
    const value = getWeekStartDate(d)
    if (!seen.has(value)) {
      seen.add(value)
      weeks.push({ value, label: getWeekLabel(value) })
    }
  }
  return weeks
}

export default function SummaryPage() {
  const recentWeeks = getRecentWeeks(8)
  const [selectedWeek, setSelectedWeek] = useState(recentWeeks[0].value)

  const [managedUsers, setManagedUsers] = useState<User[]>([])
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [usersLoading, setUsersLoading] = useState(true)

  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')

  useEffect(() => {
    async function loadUsers() {
      setUsersLoading(true)
      setSummaryData(null)
      setSent(false)
      setError('')

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: users }, { data: entries }] = await Promise.all([
        supabase.from('users').select('*').eq('manager_id', user.id).eq('is_active', true).order('team').order('name'),
        supabase.from('weekly_entries').select('user_id').eq('week_start_date', selectedWeek),
      ])

      const submitted = new Set((entries || []).map(e => e.user_id))
      setManagedUsers(users || [])
      setSubmittedIds(submitted)
      setSelectedIds(new Set((users || []).filter(u => submitted.has(u.id)).map(u => u.id)))
      setUsersLoading(false)
    }
    loadUsers()
  }, [selectedWeek])

  function toggleUser(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    const submittedUsers = managedUsers.filter(u => submittedIds.has(u.id))
    if (selectedIds.size === submittedUsers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(submittedUsers.map(u => u.id)))
    }
  }

  async function handleGenerate() {
    if (selectedIds.size === 0) { setError('취합할 파트원을 선택해주세요.'); return }
    setLoading(true)
    setError('')
    setSent(false)
    setSummaryData(null)

    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start_date: weekStart, user_ids: Array.from(selectedIds) }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'AI 요약 생성에 실패했습니다.')
      setLoading(false)
      return
    }
    setSummaryData(json)
    setLoading(false)
  }

  async function handleSend() {
    if (!summaryData) return
    if (!recipientEmail.trim()) { setError('수신 이메일을 입력해주세요.'); return }
    setSending(true)
    setError('')

    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekStart: summaryData.weekStart,
        weekLabel: summaryData.weekLabel,
        usersData: summaryData.usersData,
        aiSummaryText: summaryData.fullText,
        recipientEmail: recipientEmail.trim(),
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || '이메일 발송에 실패했습니다.')
      setSending(false)
      return
    }
    setSent(true)
    setSending(false)
  }

  const submittedUsers = managedUsers.filter(u => submittedIds.has(u.id))
  const notSubmittedUsers = managedUsers.filter(u => !submittedIds.has(u.id))

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Weekly 취합 및 AI 요약 발송</h1>

      {/* 주차 선택 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">주차 선택</h2>
        <select
          value={selectedWeek}
          onChange={e => setSelectedWeek(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-auto"
        >
          {recentWeeks.map(w => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
      </div>

      {/* 파트원 선택 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">취합할 파트원 선택</h2>
          {submittedUsers.length > 0 && (
            <button
              onClick={toggleAll}
              className="text-xs text-purple-600 hover:underline"
            >
              {selectedIds.size === submittedUsers.length ? '전체 해제' : '전체 선택'}
            </button>
          )}
        </div>

        {usersLoading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : (
          <div className="space-y-2">
            {submittedUsers.length === 0 && (
              <p className="text-sm text-gray-400">해당 주차에 작성된 Weekly가 없습니다.</p>
            )}
            {submittedUsers.map(u => (
              <label key={u.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedIds.has(u.id)}
                  onChange={() => toggleUser(u.id)}
                  className="w-4 h-4 accent-purple-600"
                />
                <span className="text-sm text-gray-800 group-hover:text-purple-700 font-medium">{u.name}</span>
                <span className="text-xs text-gray-400">{u.team}</span>
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-auto">작성완료</span>
              </label>
            ))}
            {notSubmittedUsers.length > 0 && (
              <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
                {notSubmittedUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 opacity-40">
                    <input type="checkbox" disabled className="w-4 h-4" />
                    <span className="text-sm text-gray-500">{u.name}</span>
                    <span className="text-xs text-gray-400">{u.team}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-auto">미작성</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={loading || selectedIds.size === 0}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'AI 요약 생성 중...' : `취합 및 AI 요약 생성 (${selectedIds.size}명)`}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {sent && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          이메일이 성공적으로 발송되었습니다.
        </div>
      )}

      {summaryData && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">
            {summaryData.weekLabel} AI 요약 미리보기
          </h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans mb-6">
            {summaryData.fullText}
          </pre>

          {!sent && (
            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-semibold text-gray-900 mb-3">이메일 발송</h3>
              <div className="flex gap-3 flex-wrap items-end">
                <div className="flex-1 min-w-[200px] sm:max-w-xs">
                  <label className="block text-xs font-medium text-gray-600 mb-1">수신 이메일</label>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={sending || !recipientEmail.trim()}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {sending ? '발송 중...' : '이메일 발송'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
