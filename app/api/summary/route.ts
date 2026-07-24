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

    const adminSupabase = await createAdminClient()

    const [{ data: users }, { data: tasks }] = await Promise.all([
      adminSupabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .neq('role', 'admin'),
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
        { error: '이번 주 작성된 Weekly가 없습니다.' },
        { status: 400 }
      )
    }

    const result = await generateWeeklySummary(weekLabel, usersData)
    return NextResponse.json({ ...result, weekLabel, weekStart, usersData })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
