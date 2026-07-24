import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateWeeklyExcel } from '@/lib/excel'
import { sendWeeklyReport } from '@/lib/email'

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

    const { weekStart, weekLabel, usersData, aiSummaryText } = await request.json()
    const recipientEmail = process.env.ADMIN_EMAIL!
    const fileName = `Weekly_${weekStart.replace(/-/g, '')}.xlsx`

    const excelBuffer = await generateWeeklyExcel(weekLabel, usersData, aiSummaryText)

    const result = await sendWeeklyReport({
      to: recipientEmail,
      weekLabel,
      aiSummaryText,
      excelBuffer,
      fileName,
    })

    const adminSupabase = await createAdminClient()
    await adminSupabase.from('email_logs').insert({
      week_start_date: weekStart,
      recipient_email: recipientEmail,
      file_name: fileName,
      ai_summary: aiSummaryText,
      status: result.success ? 'success' : 'failed',
      error_message: result.error || null,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ success: true, fileName })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
