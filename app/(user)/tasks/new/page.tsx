'use client'
import { useRouter } from 'next/navigation'
import TaskForm, { TaskFormData } from '@/components/tasks/TaskForm'
import { createClient } from '@/lib/supabase/client'
import { getWeekStartDate, getWeekLabel } from '@/lib/week'

export default function NewTaskPage() {
  const router = useRouter()

  async function handleSubmit(data: TaskFormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('로그인이 필요합니다.')

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
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
      .select()
      .single()

    if (taskError) throw new Error(taskError.message)

    const weekStart = getWeekStartDate()
    if (data.this_week || data.next_week) {
      await supabase.from('weekly_entries').insert({
        task_id: task.id,
        user_id: user.id,
        week_start_date: weekStart,
        week_label: getWeekLabel(weekStart),
        this_week: data.this_week,
        next_week: data.next_week,
      })
    }

    router.push('/weekly')
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">신규 업무 등록</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <TaskForm onSubmit={handleSubmit} onCancel={() => router.back()} submitLabel="등록" />
      </div>
    </div>
  )
}
