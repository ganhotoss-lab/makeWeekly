'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/types'
import TaskForm, { TaskFormData } from '@/components/tasks/TaskForm'

export default function TaskEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('tasks').select('*').eq('id', id).single()
      .then(({ data }) => setTask(data))
  }, [id])

  async function handleSubmit(data: TaskFormData) {
    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({
        category: data.category,
        title: data.title || null,
        request_dept: data.request_dept || null,
        content: data.content,
        analysis_status: data.analysis_status,
        analysis_start_date: data.analysis_start_date || null,
        analysis_end_date: data.analysis_end_date || null,
        development_status: data.development_status,
        development_start_date: data.development_start_date || null,
        development_end_date: data.development_end_date || null,
        uat_status: data.uat_status,
        uat_start_date: data.uat_start_date || null,
        uat_end_date: data.uat_end_date || null,
        open_status: data.open_status,
        open_date: data.open_date || null,
        note: data.note || null,
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    router.push('/weekly')
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        불러오는 중...
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">업무 항목 수정</h1>
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
