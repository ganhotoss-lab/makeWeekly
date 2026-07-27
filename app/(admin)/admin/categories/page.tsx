'use client'
import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function loadCategories() {
    const res = await fetch('/api/admin/categories')
    const data = await res.json()
    setCategories(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadCategories() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setError('')
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || '추가에 실패했습니다.')
    } else {
      setNewName('')
      await loadCategories()
    }
    setAdding(false)
  }

  async function handleDelete(cat: Category) {
    if (!window.confirm(`"${cat.name}" 구분을 삭제하시겠습니까?\n기존 등록된 업무의 구분 값은 변경되지 않습니다.`)) return
    setDeletingId(cat.id)
    setError('')
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || '삭제에 실패했습니다.')
    } else {
      await loadCategories()
    }
    setDeletingId(null)
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">구분 관리</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">구분 목록</h2>

        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 구분이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map(cat => (
              <li key={cat.id} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                <button
                  onClick={() => handleDelete(cat)}
                  disabled={deletingId === cat.id}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  {deletingId === cat.id ? '삭제 중...' : '삭제'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">구분 추가</h2>
        <form onSubmit={handleAdd} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[180px] sm:max-w-xs">
            <label className="block text-xs font-medium text-gray-600 mb-1">구분명</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="예: 운영지원"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {adding ? '추가 중...' : '추가'}
          </button>
        </form>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
        <p className="mt-3 text-xs text-gray-400">
          구분을 삭제해도 기존 업무에 저장된 구분 값은 유지됩니다.
        </p>
      </div>
    </div>
  )
}
