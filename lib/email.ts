import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendWeeklyReport(params: {
  to: string
  weekLabel: string
  aiSummaryText: string
  excelBuffer: Buffer
  fileName: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlBody = params.aiSummaryText
      .split('\n')
      .map(line => {
        if (line.startsWith('[') && line.endsWith(']')) {
          return `<h3 style="margin-top:20px;color:#1e40af;">${line}</h3>`
        }
        if (line.startsWith('•')) {
          return `<p style="margin:4px 0;font-weight:600;">${line}</p>`
        }
        if (line.startsWith('- ')) {
          return `<p style="margin:2px 0 2px 16px;color:#374151;">${line}</p>`
        }
        if (line.trim() === '') {
          return '<br/>'
        }
        return `<p style="margin:4px 0;color:#374151;">${line}</p>`
      })
      .join('\n')

    const { error } = await resend.emails.send({
      from: 'Weekly Report <onboarding@resend.dev>',
      to: [params.to],
      subject: `[Weekly Report] ${params.weekLabel} 팀 Weekly 종합 보고`,
      html: `
        <div style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:24px;">
          <h2 style="color:#2563EB;border-bottom:2px solid #E5E7EB;padding-bottom:12px;">
            ${params.weekLabel} Weekly 종합 보고
          </h2>
          ${htmlBody}
          <hr style="border:none;border-top:1px solid #E5E7EB;margin-top:32px;" />
          <p style="color:#9CA3AF;font-size:12px;margin-top:12px;">
            이 메일은 Weekly Report 시스템에서 자동 발송되었습니다.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: params.fileName,
          content: params.excelBuffer,
        },
      ],
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
