'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'

interface GroupMember {
  user_id: string
  users: { id: string; name: string; team: string }
}

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  group_members: GroupMember[]
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [addingMember, setAddingMember] = useState<string | null>(null)

  const loadGroups = useCallback(async () => {
    const res = await fetch('/api/admin/groups')
    const data = await res.json()
    setGroups(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [groupsRes, usersData] = await Promise.all([
        fetch('/api/admin/groups').then(r => r.json()),
        supabase.from('users').select('*').eq('manager_id', user.id).eq('is_active', true).order('team').order('name'),
      ])
      setGroups(Array.isArray(groupsRes) ? groupsRes : [])
      setUsers(usersData.data || [])
      setLoading(false)
    }
    init()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setCreating(true)
    setError('')
    const res = await fetch('/api/admin/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, description: form.description }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || '그룹 생성에 실패했습니다.')
    } else {
      setForm({ name: '', description: '' })
      setShowForm(false)
      await loadGroups()
    }
    setCreating(false)
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm('그룹을 삭제하시겠습니까?')) return
    await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' })
    await loadGroups()
    if (expandedGroup === id) setExpandedGroup(null)
  }

  async function handleAddMember(groupId: string, userId: string) {
    setAddingMember(groupId)
    await fetch(`/api/admin/groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    await loadGroups()
    setAddingMember(null)
  }

  async function handleRemoveMember(groupId: string, userId: string) {
    await fetch(`/api/admin/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
    await loadGroups()
  }

  if (loading) return <div className="flex justify-center py-16 text-gray-400">불러오는 중...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">그룹 관리</h1>
        <button
          onClick={() => { setShowForm(v => !v); setError('') }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          + 그룹 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">새 그룹 생성</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">그룹 이름</label>
              <input
                required
                placeholder="예: 개발팀"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">설명 (선택)</label>
              <input
                placeholder="그룹 설명"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-purple-700 transition-colors"
            >
              {creating ? '생성 중...' : '그룹 생성'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 shadow-sm">
          <p className="text-sm">생성된 그룹이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => {
            const memberIds = new Set(group.group_members.map(m => m.user_id))
            const nonMembers = users.filter(u => !memberIds.has(u.id))
            const isExpanded = expandedGroup === group.id

            return (
              <div key={group.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                    <div>
                      <p className="font-semibold text-gray-900">{group.name}</p>
                      {group.description && <p className="text-xs text-gray-400 mt-0.5">{group.description}</p>}
                    </div>
                    <span className="ml-2 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                      {group.group_members.length}명
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    삭제
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {/* 현재 구성원 */}
                    <h3 className="text-xs font-medium text-gray-500 mb-2">구성원</h3>
                    {group.group_members.length === 0 ? (
                      <p className="text-xs text-gray-300 mb-4">구성원이 없습니다.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {group.group_members.map(m => (
                          <div
                            key={m.user_id}
                            className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-sm"
                          >
                            <span className="text-gray-700">{m.users.name}</span>
                            <span className="text-gray-400 text-xs">({m.users.team})</span>
                            <button
                              onClick={() => handleRemoveMember(group.id, m.user_id)}
                              className="ml-1 text-gray-400 hover:text-red-500 transition-colors text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 구성원 추가 */}
                    {nonMembers.length > 0 && (
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 mb-2">구성원 추가</h3>
                        <div className="flex flex-wrap gap-2">
                          {nonMembers.map(u => (
                            <button
                              key={u.id}
                              onClick={() => handleAddMember(group.id, u.id)}
                              disabled={addingMember === group.id}
                              className="flex items-center gap-1.5 border border-dashed border-gray-300 rounded-full px-3 py-1 text-sm text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50"
                            >
                              <span>+</span>
                              <span>{u.name}</span>
                              <span className="text-xs text-gray-400">({u.team})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
