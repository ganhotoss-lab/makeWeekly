'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const EMAIL_SUFFIX = '@makeweekly.local'

export default function LoginForm() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const email = userId.includes('@') ? userId : userId + EMAIL_SUFFIX
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }
    router.push('/weekly')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">아이디</label>
        <input
          type="text"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          required
          placeholder="예: hong123"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="비밀번호 입력"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}
