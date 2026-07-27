'use client'
import { useEffect, useState } from 'react'

interface Column {
  column_key: string
  label: string
  enabled: boolean
  sort_order: number
}

export default function ExcelColumnsPage() {
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/excel-columns')
      .then(r => r.json())
      .then(data => {
        setColumns(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [])

  function moveUp(index: number) {
    if (index === 0) return
    setColumns(prev => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveDown(index: number) {
    setColumns(prev => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  function toggleEnabled(index: number) {
    setColumns(prev => prev.map((c, i) => i === index ? { ...c, enabled: !c.enabled } : c))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    const res = await fetch('/api/admin/excel-columns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(columns),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || '저장에 실패했습니다.')
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    }
    setSaving(false)
  }

  if (loading) return <div className="flex justify-center py-16 text-gray-400">불러오는 중...</div>

  const enabledCount = columns.filter(c => c.enabled).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Excel 컬럼 설정</h1>
          <p className="text-sm text-gray-500 mt-0.5">포함할 컬럼과 순서를 설정합니다 (활성 {enabledCount}개)</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : '설정 저장'}
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          설정이 저장되었습니다.
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center">
          <span className="text-xs font-medium text-gray-500 w-14 text-center">순서</span>
          <span className="text-xs font-medium text-gray-500">컬럼명</span>
          <span className="text-xs font-medium text-gray-500 text-center">포함</span>
          <span className="text-xs font-medium text-gray-500 w-16"></span>
        </div>
        <div className="divide-y divide-gray-100">
          {columns.map((col, i) => (
            <div
              key={col.column_key}
              className={`px-4 py-3 grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center transition-colors ${col.enabled ? '' : 'opacity-40'}`}
            >
              <span className="text-xs text-gray-400 w-14 text-center font-mono">{i + 1}</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{col.label}</p>
                <p className="text-xs text-gray-400 font-mono">{col.column_key}</p>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => toggleEnabled(i)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${col.enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${col.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex gap-1 w-16 justify-end">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-colors"
                  title="위로"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === columns.length - 1}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-colors"
                  title="아래로"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        * 설정은 다음 이메일 발송 시 적용됩니다.
      </p>
    </div>
  )
}
