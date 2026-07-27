'use client'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import TaskForm, { TaskFormData } from '@/components/tasks/TaskForm'

export default function AdminNewTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  async function handleSubmit(data: TaskFormData) {
    const res = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: id, ...data }),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error || '등록 실패')
    }
    router.push(`/admin/users/${id}`)
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">업무 등록 (관리자)</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="등록"
          showWeeklyFields={false}
        />
      </div>
    </div>
  )
}
