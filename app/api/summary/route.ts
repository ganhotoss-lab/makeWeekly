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
    const taskIds: string[] | undefined = body.task_ids

    if (!taskIds || taskIds.length === 0) {
      return NextResponse.json({ error: '취합할 업무 항목이 없습니다.' }, { status: 400 })
    }

    const adminSupabase = await createAdminClient()

    const [{ data: tasks }, { data: entries }] = await Promise.all([
      adminSupabase
        .from('tasks')
        .select('*')
        .in('id', taskIds),
      adminSupabase
        .from('weekly_entries')
        .select('*')
        .eq('week_start_date', weekStart)
        .in('task_id', taskIds),
    ])

    const entryMap = new Map((entries || []).map(e => [e.task_id, e]))

    // task_id로 조회한 user_id 목록으로 users 가져오기
    const userIds = [...new Set((tasks || []).map(t => t.user_id))]
    const { data: users } = await adminSupabase
      .from('users')
      .select('*')
      .in('id', userIds)

    const userMap = new Map((users || []).map(u => [u.id, u]))

    // 유저별로 task 그룹핑
    const usersDataMap = new Map<string, { user: User; tasks: TaskWithEntry[] }>()
    for (const task of tasks || []) {
      const u = userMap.get(task.user_id)
      if (!u) continue
      if (!usersDataMap.has(task.user_id)) {
        usersDataMap.set(task.user_id, { user: u, tasks: [] })
      }
      const entry = entryMap.get(task.id)
      usersDataMap.get(task.user_id)!.tasks.push({
        ...task,
        weekly_entries: entry ? [entry] : [],
      })
    }

    const usersData = Array.from(usersDataMap.values())

    if (usersData.length === 0) {
      return NextResponse.json(
        { error: '선택된 업무의 데이터를 불러올 수 없습니다.' },
        { status: 400 }
      )
    }

    const result = await generateWeeklySummary(weekLabel, usersData)

    // 사용자별 요약 upsert (사용자가 본인 파트 조회용)
    if (result.userSummaries.length > 0) {
      await adminSupabase
        .from('user_summaries')
        .upsert(
          result.userSummaries.map(s => ({
            user_id: s.userId,
            week_start_date: weekStart,
            summary_text: s.summary,
          })),
          { onConflict: 'user_id,week_start_date' }
        )
    }

    return NextResponse.json({ ...result, weekLabel, weekStart, usersData })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
