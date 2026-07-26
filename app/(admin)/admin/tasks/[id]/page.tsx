'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TaskForm, { TaskFormData } from '@/components/tasks/TaskForm'
import { Task } from '@/types'

export default function AdminTaskEditPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)

  useEffect(() => {
    createClient().from('tasks').select('*').eq('id', id).single()
      .then(({ data }) => setTask(data))
  }, [id])

  async function handleSubmit(data: TaskFormData) {
    const res = await fetch(`/api/admin/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error || '저장 실패')
    }
    router.push(userId ? `/admin/users/${userId}` : '/admin/dashboard')
  }

  if (!task) {
    return <div className="flex items-center justify-center py-16 text-gray-400">불러오는 중...</div>
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">업무 수정 (관리자)</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <TaskForm
          initialData={task}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="수정 저장"
          showWeeklyFields={false}
        />
      </div>
    </div>
  )
}
