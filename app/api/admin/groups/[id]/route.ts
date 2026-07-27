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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const adminSupabase = await createAdminClient()
  const { data, error } = await adminSupabase
    .from('groups')
    .select('*, group_members(user_id, users(id, name, team))')
    .eq('id', id)
    .eq('manager_id', auth.user!.id)
    .single()

  if (error || !data) return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const { name, description } = await request.json().catch(() => ({}))
  if (!name?.trim()) return NextResponse.json({ error: '그룹 이름을 입력해주세요.' }, { status: 400 })

  const adminSupabase = await createAdminClient()
  const { data, error } = await adminSupabase
    .from('groups')
    .update({ name: name.trim(), description: description?.trim() || null })
    .eq('id', id)
    .eq('manager_id', auth.user!.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const adminSupabase = await createAdminClient()
  const { error } = await adminSupabase
    .from('groups')
    .delete()
    .eq('id', id)
    .eq('manager_id', auth.user!.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
