'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  taskId: string
  userId: string
}

export default function AdminTaskActions({ taskId, userId }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/admin/tasks/${taskId}`, { method: 'DELETE' })
    router.refresh()
  }

  if (confirm) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="text-xs text-red-400">삭제할까요?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg disabled:opacity-50"
        >
          {deleting ? '삭제중...' : '예'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs border border-gray-300 px-2.5 py-1 rounded-lg text-gray-500"
        >
          취소
        </button>
      </span>
    )
  }

  return (
    <div className="flex gap-1.5">
      <Link
        href={`/admin/tasks/${taskId}?userId=${userId}`}
        className="text-xs border border-gray-200 px-2.5 py-1 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
      >
        수정
      </Link>
      <button
        onClick={() => setConfirm(true)}
        className="text-xs border border-red-200 px-2.5 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
      >
        삭제
      </button>
    </div>
  )
}
