'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'

const EMAIL_SUFFIX = '@makeweekly.local'
const toUserId = (email: string) => email.endsWith(EMAIL_SUFFIX) ? email.slice(0, -EMAIL_SUFFIX.length) : email
const toEmail = (userId: string) => userId.includes('@') ? userId : userId + EMAIL_SUFFIX

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
      role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {role === 'admin' ? '관리자' : '일반'}
    </span>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
      isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
    }`}>
      {isActive ? '활성' : '비활성'}
    </span>
  )
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [managerId, setManagerId] = useState<string | null>(null)

  // 사용자 추가 폼
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ userId: '', name: '', team: '', role: 'user', password: '' })
  const [creating, setCreating] = useState(false)

  // 비밀번호 변경
  const [pwUserId, setPwUserId] = useState<string | null>(null)
  const [pwValue, setPwValue] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  // 메시지
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setManagerId(user?.id || null)
    })
  }, [])

  const loadUsers = useCallback(async () => {
    if (!managerId) return
    const { data } = await createClient()
      .from('users')
      .select('*')
      .eq('manager_id', managerId)
      .order('team')
      .order('name')
    setUsers(data || [])
    setLoading(false)
  }, [managerId])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    setSuccess('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: toEmail(form.userId),
        name: form.name,
        team: form.team,
        role: form.role,
        password: form.password,
      }),
    })
    const json = await res.json()
    setCreating(false)
    if (!res.ok) { setError(json.error || '사용자 생성에 실패했습니다.'); return }
    setSuccess(`${form.name} 사용자가 생성되었습니다.`)
    setShowForm(false)
    setForm({ userId: '', name: '', team: '', role: 'user', password: '' })
    loadUsers()
  }

  async function toggleActive(user: User) {
    await createClient().from('users').update({ is_active: !user.is_active }).eq('id', user.id)
    loadUsers()
  }

  async function handlePwChange(userId: string) {
    if (pwValue.length < 6) return
    setPwSaving(true)
    setError('')
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwValue }),
    })
    const json = await res.json()
    setPwSaving(false)
    if (!res.ok) { setError(json.error || '변경 실패'); return }
    setSuccess('비밀번호가 변경되었습니다.')
    setPwUserId(null)
    setPwValue('')
  }

  function openPwForm(userId: string) {
    setPwUserId(userId)
    setPwValue('')
    setError('')
    setSuccess('')
  }

  function closePwForm() {
    setPwUserId(null)
    setPwValue('')
  }

  if (loading) {
    return <div className="flex justify-center py-16 text-gray-400">불러오는 중...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">사용자 관리</h1>
        <button
          onClick={() => { setShowForm(v => !v); setError(''); setSuccess('') }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          + 사용자 추가
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">신규 사용자 등록</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
              <input
                required
                placeholder="홍길동"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">아이디</label>
              <input
                required
                type="text"
                placeholder="예: hong123"
                value={form.userId}
                onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">소속 팀</label>
              <input
                required
                placeholder="개발팀"
                value={form.team}
                onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">초기 비밀번호</label>
              <input
                required
                type="password"
                placeholder="8자 이상"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">권한</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="user">일반 사용자</option>
                <option value="admin">관리자</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-purple-700 transition-colors"
            >
              {creating ? '생성 중...' : '사용자 생성'}
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

      {/* 모바일: 카드 리스트 */}
      <div className="sm:hidden space-y-3">
        {users.map(u => (
          <div key={u.id} className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${!u.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{toUserId(u.email)}</p>
              </div>
              <button
                onClick={() => toggleActive(u)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  u.is_active ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {u.is_active ? '비활성화' : '활성화'}
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">{u.team}</span>
              <RoleBadge role={u.role} />
              <StatusBadge isActive={u.is_active} />
              <span className="text-xs text-gray-400 ml-auto">{new Date(u.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
            {pwUserId === u.id ? (
              <div className="flex gap-2 items-center mt-1">
                <input
                  type="password"
                  placeholder="새 비밀번호 (6자 이상)"
                  value={pwValue}
                  onChange={e => setPwValue(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => handlePwChange(u.id)}
                  disabled={pwSaving || pwValue.length < 6}
                  className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 whitespace-nowrap"
                >
                  {pwSaving ? '변경 중...' : '변경'}
                </button>
                <button onClick={closePwForm} className="text-xs text-gray-400 px-1 py-1.5 whitespace-nowrap">취소</button>
              </div>
            ) : (
              <button
                onClick={() => openPwForm(u.id)}
                className="text-xs text-gray-400 hover:text-purple-600 underline"
              >
                비밀번호 변경
              </button>
            )}
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">등록된 파트원이 없습니다.</p>
        )}
      </div>

      {/* 데스크탑: 테이블 */}
      <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">이름</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">아이디</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">팀</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">권한</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">가입일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className={u.is_active ? '' : 'opacity-50 bg-gray-50'}>
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{toUserId(u.email)}</td>
                <td className="px-4 py-3 text-gray-600">{u.team}</td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3"><StatusBadge isActive={u.is_active} /></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toggleActive(u)}
                      className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition-colors whitespace-nowrap"
                    >
                      {u.is_active ? '비활성화' : '활성화'}
                    </button>
                    {pwUserId === u.id ? (
                      <>
                        <input
                          type="password"
                          placeholder="새 비밀번호"
                          value={pwValue}
                          onChange={e => setPwValue(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => handlePwChange(u.id)}
                          disabled={pwSaving || pwValue.length < 6}
                          className="text-xs bg-purple-600 text-white px-2 py-1 rounded disabled:opacity-50 whitespace-nowrap"
                        >
                          {pwSaving ? '...' : '변경'}
                        </button>
                        <button onClick={closePwForm} className="text-xs text-gray-400 whitespace-nowrap">취소</button>
                      </>
                    ) : (
                      <button
                        onClick={() => openPwForm(u.id)}
                        className="text-xs text-gray-400 hover:text-purple-600 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        비밀번호
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-8 text-sm">등록된 파트원이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
