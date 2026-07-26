import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, name, team, role, password } = await request.json()

    const supabase = await createClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const adminSupabase = await createAdminClient()
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, team, role },
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // 생성된 사용자에 manager_id 배정 (트리거가 users 행을 생성한 후)
    await adminSupabase
      .from('users')
      .update({ manager_id: caller.id })
      .eq('id', data.user.id)

    return NextResponse.json({ user: data.user })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
