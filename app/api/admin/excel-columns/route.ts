import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ALL_COLUMN_DEFAULTS } from '@/lib/excel'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

  const adminSupabase = await createAdminClient()
  const { data: saved } = await adminSupabase
    .from('excel_columns')
    .select('*')
    .eq('manager_id', user.id)
    .order('sort_order')

  if (saved && saved.length > 0) {
    return NextResponse.json(saved)
  }

  // 저장된 설정 없으면 기본값 반환
  return NextResponse.json(ALL_COLUMN_DEFAULTS)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

  const columns = await request.json()
  if (!Array.isArray(columns)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  const adminSupabase = await createAdminClient()
  const { error } = await adminSupabase
    .from('excel_columns')
    .upsert(
      columns.map((c, i) => ({
        manager_id: user.id,
        column_key: c.column_key,
        label: c.label,
        enabled: c.enabled,
        sort_order: i,
      })),
      { onConflict: 'manager_id,column_key' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
