import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getCallerAdmin() {
  const supabase = await createClient()
  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', caller.id).single()
  if (profile?.role !== 'admin') return null
  return caller
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const caller = await getCallerAdmin()
  if (!caller) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

  const adminSupabase = await createAdminClient()
  await adminSupabase.from('weekly_entries').delete().eq('task_id', id)
  const { error } = await adminSupabase.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const caller = await getCallerAdmin()
  if (!caller) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

  const body = await req.json()
  const adminSupabase = await createAdminClient()
  const { error } = await adminSupabase
    .from('tasks')
    .update({
      category: body.category,
      title: body.title || null,
      content: body.content,
      analysis_status: body.analysis_status,
      analysis_start_date: body.analysis_start_date || null,
      analysis_end_date: body.analysis_end_date || null,
      development_status: body.development_status,
      development_start_date: body.development_start_date || null,
      development_end_date: body.development_end_date || null,
      uat_status: body.uat_status,
      uat_start_date: body.uat_start_date || null,
      uat_end_date: body.uat_end_date || null,
      open_status: body.open_status,
      open_date: body.open_date || null,
      note: body.note || null,
    })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
