'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPw.length < 6) {
      setError('새 비밀번호는 6자 이상이어야 합니다.')
      return
    }
    if (newPw !== confirmPw) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    if (currentPw === newPw) {
      setError('현재 비밀번호와 동일합니다.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // 현재 비밀번호 검증
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setError('사용자 정보를 불러올 수 없습니다.')
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPw,
    })
    if (signInError) {
      setError('현재 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    // 새 비밀번호 변경
    const { error: updateError } = await supabase.auth.updateUser({ password: newPw })
    setLoading(false)
    if (updateError) {
      setError('비밀번호 변경에 실패했습니다: ' + updateError.message)
      return
    }

    setSuccess(true)
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">비밀번호 변경</h1>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-green-700 font-medium mb-1">비밀번호가 변경되었습니다.</p>
          <p className="text-sm text-green-600 mb-4">다음 로그인부터 새 비밀번호를 사용하세요.</p>
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:underline"
          >
            돌아가기
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
            <input
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              required
              placeholder="현재 비밀번호 입력"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              required
              placeholder="6자 이상"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              required
              placeholder="새 비밀번호 재입력"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
