import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.', status: 401 as const, user: null }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: '관리자 권한이 필요합니다.', status: 403 as const, user: null }
  return { error: null, status: 200 as const, user }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id: group_id } = await params
  const { user_id } = await request.json().catch(() => ({}))
  if (!user_id) return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })

  const adminSupabase = await createAdminClient()

  // 그룹 소유자 확인
  const { data: group } = await adminSupabase.from('groups').select('id').eq('id', group_id).eq('manager_id', auth.user!.id).single()
  if (!group) return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 })

  const { error } = await adminSupabase.from('group_members').insert({ group_id, user_id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 201 })
}
