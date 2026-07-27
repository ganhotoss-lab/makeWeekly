'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getWeekStartDate, getWeekLabel } from '@/lib/week'
import { User, Task, WeeklyEntry } from '@/types'

interface TaskItem extends Task {
  weeklyEntry: WeeklyEntry | null
}

interface UserWithTasks {
  user: User
  tasks: TaskItem[]
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

interface SummaryData {
  fullText: string
  weekLabel: string
  weekStart: string
  usersData: unknown[]
}

export default function SummaryPage() {
  const recentWeeks = getRecentWeeks(8)
  const [selectedWeek, setSelectedWeek] = useState(recentWeeks[0].value)

  const [usersWithTasks, setUsersWithTasks] = useState<UserWithTasks[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())

  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [ccInput, setCcInput] = useState('')
  const [ccEmails, setCcEmails] = useState<string[]>([])

  useEffect(() => {
    async function loadData() {
      setUsersLoading(true)
      setSummaryData(null)
      setSent(false)
      setError('')
      setExpandedUsers(new Set())
      setSelectedTaskIds(new Set())

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('manager_id', user.id)
        .eq('is_active', true)
        .order('team')
        .order('name')

      const managedUsers = users || []
      const userIds = managedUsers.map(u => u.id)

      if (userIds.length === 0) {
        setUsersWithTasks([])
        setUsersLoading(false)
        return
      }

      const [{ data: tasks }, { data: entries }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .in('user_id', userIds)
          .order('is_completed', { ascending: true })
          .order('created_at'),
        supabase
          .from('weekly_entries')
          .select('*')
          .eq('week_start_date', selectedWeek)
          .in('user_id', userIds),
      ])

      const entryMap = new Map((entries || []).map(e => [e.task_id, e]))

      const result: UserWithTasks[] = managedUsers.map(u => ({
        user: u,
        tasks: (tasks || [])
          .filter(t => t.user_id === u.id)
          .map(t => ({ ...t, weeklyEntry: entryMap.get(t.id) ?? null })),
      }))

      setUsersWithTasks(result)

      // 기본값: 모든 task 선택
      const allTaskIds = new Set((tasks || []).map(t => t.id as string))
      setSelectedTaskIds(allTaskIds)

      setUsersLoading(false)
    }
    loadData()
  }, [selectedWeek])

  function toggleExpand(userId: string) {
    setExpandedUsers(prev => {
      const next = new Set(prev)
      next.has(userId) ? next.delete(userId) : next.add(userId)
      return next
    })
  }

  function toggleTask(taskId: string) {
    setSelectedTaskIds(prev => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }

  function toggleUserTasks(userId: string) {
    const uwt = usersWithTasks.find(u => u.user.id === userId)
    if (!uwt || uwt.tasks.length === 0) return
    const taskIds = uwt.tasks.map(t => t.id)
    const allSelected = taskIds.every(id => selectedTaskIds.has(id))
    setSelectedTaskIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        taskIds.forEach(id => next.delete(id))
      } else {
        taskIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  function toggleAll() {
    const allTaskIds = usersWithTasks.flatMap(u => u.tasks.map(t => t.id))
    const allSelected = allTaskIds.every(id => selectedTaskIds.has(id))
    if (allSelected) {
      setSelectedTaskIds(new Set())
    } else {
      setSelectedTaskIds(new Set(allTaskIds))
    }
  }

  async function handleGenerate() {
    if (selectedTaskIds.size === 0) {
      setError('취합할 업무 항목을 선택해주세요.')
      return
    }
    setLoading(true)
    setError('')
    setSent(false)
    setSummaryData(null)

    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_start_date: selectedWeek,
        task_ids: Array.from(selectedTaskIds),
      }),
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
        ccEmails: ccEmails.length > 0 ? ccEmails : undefined,
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

  const allTaskIds = usersWithTasks.flatMap(u => u.tasks.map(t => t.id))
  const allSelected = allTaskIds.length > 0 && allTaskIds.every(id => selectedTaskIds.has(id))

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

      {/* 업무 항목 선택 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">취합할 업무 항목 선택</h2>
          {allTaskIds.length > 0 && (
            <button
              onClick={toggleAll}
              className="text-xs text-purple-600 hover:underline"
            >
              {allSelected ? '전체 해제' : '전체 선택'}
            </button>
          )}
        </div>

        {usersLoading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : usersWithTasks.length === 0 ? (
          <p className="text-sm text-gray-400">관리 중인 파트원이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {usersWithTasks.map(({ user, tasks }) => {
              const isExpanded = expandedUsers.has(user.id)
              const hasTasks = tasks.length > 0
              const userTaskIds = tasks.map(t => t.id)
              const selectedCount = userTaskIds.filter(id => selectedTaskIds.has(id)).length
              const allUserSelected = hasTasks && selectedCount === tasks.length
              const writtenCount = tasks.filter(t => t.weeklyEntry).length

              return (
                <div key={user.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  {/* 유저 행 */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                    {hasTasks ? (
                      <input
                        type="checkbox"
                        checked={allUserSelected}
                        onChange={() => toggleUserTasks(user.id)}
                        className="w-4 h-4 accent-purple-600 flex-shrink-0"
                      />
                    ) : (
                      <input type="checkbox" disabled className="w-4 h-4 flex-shrink-0 opacity-30" />
                    )}

                    <button
                      onClick={() => hasTasks && toggleExpand(user.id)}
                      disabled={!hasTasks}
                      className="flex items-center gap-2 flex-1 text-left disabled:cursor-default"
                    >
                      <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''} ${!hasTasks ? 'opacity-30' : 'text-gray-500'}`}>▶</span>
                      <span className="text-sm font-medium text-gray-800">{user.name}</span>
                      <span className="text-xs text-gray-400">{user.team}</span>
                    </button>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasTasks ? (
                        <>
                          {writtenCount > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                              작성완료 {writtenCount}건
                            </span>
                          )}
                          {tasks.length - writtenCount > 0 && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              미작성 {tasks.length - writtenCount}건
                            </span>
                          )}
                          <span className="text-xs text-purple-600 font-medium">
                            {selectedCount}/{tasks.length} 선택
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-300">업무 없음</span>
                      )}
                    </div>
                  </div>

                  {/* 업무 목록 (펼쳤을 때) */}
                  {isExpanded && hasTasks && (
                    <div className="divide-y divide-gray-50">
                      {tasks.map(task => (
                        <label
                          key={task.id}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-purple-50 transition-colors ${task.is_completed ? 'opacity-60' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.has(task.id)}
                            onChange={() => toggleTask(task.id)}
                            className="w-4 h-4 accent-purple-600 flex-shrink-0 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                                {task.category}
                              </span>
                              {task.is_completed && (
                                <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">업무완료</span>
                              )}
                              {task.request_dept && (
                                <span className="text-xs text-gray-400">{task.request_dept}</span>
                              )}
                              <span className={`text-sm font-medium truncate ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {task.title || task.content.slice(0, 30)}
                              </span>
                              {task.weeklyEntry ? (
                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-auto">작성완료</span>
                              ) : (
                                <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded ml-auto">미작성</span>
                              )}
                            </div>
                            {task.weeklyEntry ? (
                              <div className="space-y-1">
                                <p className="text-xs text-gray-500">
                                  <span className="font-medium text-gray-600">This Week</span>{' '}
                                  {task.weeklyEntry.this_week || '—'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  <span className="font-medium text-gray-600">Next Week</span>{' '}
                                  {task.weeklyEntry.next_week || '—'}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-300">이번 주 작성 내용 없음</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={loading || selectedTaskIds.size === 0}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'AI 요약 생성 중...' : `취합 및 AI 요약 생성 (${selectedTaskIds.size}건)`}
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
              <div className="space-y-3 mb-4">
                <div className="flex gap-3 flex-wrap items-end">
                  <div className="flex-1 min-w-[200px] sm:max-w-xs">
                    <label className="block text-xs font-medium text-gray-600 mb-1">수신 이메일 (To)</label>
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">참조 이메일 (CC)</label>
                  {ccEmails.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {ccEmails.map(email => (
                        <span key={email} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                          {email}
                          <button
                            onClick={() => setCcEmails(prev => prev.filter(e => e !== email))}
                            className="hover:text-red-500 ml-0.5"
                          >✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <input
                      type="email"
                      placeholder="cc@example.com 입력 후 Enter"
                      value={ccInput}
                      onChange={e => setCcInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          const val = ccInput.trim().replace(/,$/, '')
                          if (val && !ccEmails.includes(val)) setCcEmails(prev => [...prev, val])
                          setCcInput('')
                        }
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = ccInput.trim()
                        if (val && !ccEmails.includes(val)) setCcEmails(prev => [...prev, val])
                        setCcInput('')
                      }}
                      className="text-xs border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !recipientEmail.trim()}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {sending ? '발송 중...' : '이메일 발송'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
