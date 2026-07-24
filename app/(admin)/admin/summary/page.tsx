'use client'
import { useState } from 'react'
import { getWeekStartDate } from '@/lib/week'

interface SummaryData {
  fullText: string
  weekLabel: string
  weekStart: string
  usersData: unknown[]
}

export default function SummaryPage() {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setSent(false)
    setSummaryData(null)

    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start_date: getWeekStartDate() }),
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

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Weekly 취합 및 AI 요약 발송</h1>

      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'AI 요약 생성 중...' : '취합 및 AI 요약 생성'}
        </button>
        {summaryData && !sent && (
          <button
            onClick={handleSend}
            disabled={sending}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {sending ? '발송 중...' : '이메일 발송'}
          </button>
        )}
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
          <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
            {summaryData.fullText}
          </pre>
        </div>
      )}
    </div>
  )
}
