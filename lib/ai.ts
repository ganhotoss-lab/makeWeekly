import Anthropic from '@anthropic-ai/sdk'
import { TaskWithEntry, User } from '@/types'

interface UserSummary {
  userId: string
  name: string
  team: string
  summary: string
}

export interface AISummaryResult {
  userSummaries: UserSummary[]
  overallSummary: string
  fullText: string
}

export interface UserWeeklyData {
  user: User
  tasks: TaskWithEntry[]
}

export async function generateWeeklySummary(
  weekLabel: string,
  usersData: UserWeeklyData[]
): Promise<AISummaryResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const dataText = usersData.map(({ user, tasks }) => {
    const taskLines = tasks.map(t => {
      const entry = t.weekly_entries?.[0]
      return `  [${t.category}] ${t.content}
    - 진행상태: 분석/설계(${t.analysis_status}) / 개발(${t.development_status}) / UAT(${t.uat_status}) / OPEN(${t.open_status})
    - This Week: ${entry?.this_week || '(미작성)'}
    - Next Week: ${entry?.next_week || '(미작성)'}${t.note ? `\n    - 비고: ${t.note}` : ''}`
    }).join('\n\n')
    return `### ${user.name} (${user.team})\n${taskLines}`
  }).join('\n\n---\n\n')

  const prompt = `당신은 팀 Weekly 보고서를 작성하는 AI 어시스턴트입니다.
아래는 ${weekLabel} 주간 팀원들의 Weekly 데이터입니다.

${dataText}

다음 형식으로 정확히 요약을 작성해주세요:

[전체 종합 요약]
팀 전체의 이번 주 주요 성과와 현황을 3-5줄로 요약하세요.

[구분별 현황]
- Biz사업:
- 내부개선:
- 상품:
- 기타:

[주의 이슈 / 리스크]
주목할 이슈나 리스크를 나열하세요. 없으면 "없음"으로 표기.

[사용자별 요약]
각 사용자별로 아래 형식으로 2-3줄 요약:
• 이름 (팀명)
  이번 주 수행 내용 및 주요 진행 현황, 다음 주 계획`

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const fullText = message.content[0].type === 'text' ? message.content[0].text : ''

  const userSummaries: UserSummary[] = usersData.map(({ user }) => {
    const escapedName = user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`• ${escapedName}[^•]*`, 's')
    const match = fullText.match(pattern)
    return {
      userId: user.id,
      name: user.name,
      team: user.team,
      summary: match ? match[0].replace(`• ${user.name} (${user.team})`, '').trim() : '',
    }
  })

  const overallMatch = fullText.match(/\[전체 종합 요약\]([\s\S]*?)\[구분별 현황\]/)
  const overallSummary = overallMatch ? overallMatch[1].trim() : ''

  return { userSummaries, overallSummary, fullText }
}
