import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateWeeklySummary } from '@/lib/ai'
import { getWeekStartDate, getWeekLabel } from '@/lib/week'
import { User, TaskWithEntry } from '@/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const { data: callerProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single()
    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const weekStart = body.week_start_date || getWeekStartDate()
    const weekLabel = getWeekLabel(weekStart)
    const userIds: string[] | undefined = body.user_ids

    const adminSupabase = await createAdminClient()

    // 이 관리자가 관리하는 파트원만 대상으로 함
    let usersQuery = adminSupabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .eq('manager_id', caller.id)

    // 선택된 user_ids가 있으면 해당 파트원만 필터
    if (userIds && userIds.length > 0) {
      usersQuery = usersQuery.in('id', userIds)
    }

    const [{ data: users }, { data: tasks }] = await Promise.all([
      usersQuery,
      adminSupabase
        .from('tasks')
        .select('*, weekly_entries!inner(*)')
        .eq('weekly_entries.week_start_date', weekStart),
    ])

    const usersData = (users || []).map((user: User) => ({
      user,
      tasks: (tasks || []).filter((t: TaskWithEntry) => t.user_id === user.id),
    })).filter(ud => ud.tasks.length > 0)

    if (usersData.length === 0) {
      return NextResponse.json(
        { error: '선택된 파트원의 이번 주 작성된 Weekly가 없습니다.' },
        { status: 400 }
      )
    }

    const result = await generateWeeklySummary(weekLabel, usersData)
    return NextResponse.json({ ...result, weekLabel, weekStart, usersData })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
