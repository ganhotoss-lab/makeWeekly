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

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const adminSupabase = await createAdminClient()
  const { data: groups, error } = await adminSupabase
    .from('groups')
    .select('*, group_members(user_id)')
    .eq('manager_id', auth.user!.id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(groups || [])
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { name, description } = await request.json().catch(() => ({}))
  if (!name?.trim()) return NextResponse.json({ error: '그룹 이름을 입력해주세요.' }, { status: 400 })

  const adminSupabase = await createAdminClient()
  const { data, error } = await adminSupabase
    .from('groups')
    .insert({ manager_id: auth.user!.id, name: name.trim(), description: description?.trim() || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
