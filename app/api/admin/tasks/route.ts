import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { target_user_id, ...taskData } = body

  if (!target_user_id) {
    return NextResponse.json({ error: '대상 사용자 ID가 필요합니다.' }, { status: 400 })
  }
  if (!taskData.content?.trim()) {
    return NextResponse.json({ error: '업무 내용을 입력해주세요.' }, { status: 400 })
  }

  const adminSupabase = await createAdminClient()
  const { data, error } = await adminSupabase
    .from('tasks')
    .insert({
      user_id: target_user_id,
      category: taskData.category || '기타',
      title: taskData.title || null,
      request_dept: taskData.request_dept || null,
      content: taskData.content,
      analysis_status: taskData.analysis_status || '미시작',
      analysis_start_date: taskData.analysis_start_date || null,
      analysis_end_date: taskData.analysis_end_date || null,
      development_status: taskData.development_status || '미시작',
      development_start_date: taskData.development_start_date || null,
      development_end_date: taskData.development_end_date || null,
      uat_status: taskData.uat_status || '미시작',
      uat_start_date: taskData.uat_start_date || null,
      uat_end_date: taskData.uat_end_date || null,
      open_status: taskData.open_status || '미오픈',
      open_date: taskData.open_date || null,
      note: taskData.note || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
