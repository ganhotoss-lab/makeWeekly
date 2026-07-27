import ExcelJS from 'exceljs'
import { TaskWithEntry, User } from '@/types'

export interface UserWeeklyData {
  user: User
  tasks: TaskWithEntry[]
}

export async function generateWeeklyExcel(
  weekLabel: string,
  usersData: UserWeeklyData[],
  aiSummaryText: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Weekly Report System'
  workbook.created = new Date()

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  }
  const headerFont: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    size: 10,
  }
  const cellBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  }

  const headers = [
    '완료여부', '구분', '요청부서', '업무 내용',
    '분석/설계 상태', '분석/설계 시작일', '분석/설계 종료일',
    '개발 상태', '개발 시작일', '개발 종료일',
    'UAT 상태', 'UAT 시작일', 'UAT 종료일',
    'OPEN 상태', 'OPEN 예정일',
    'This Week', 'Next Week', '비고',
  ]

  const colWidths = [10, 12, 16, 35, 14, 14, 14, 12, 14, 14, 12, 14, 14, 12, 14, 45, 45, 20]

  for (const { user, tasks } of usersData) {
    const sheetName = `${user.name}_${user.team}`.substring(0, 31)
    const ws = workbook.addWorksheet(sheetName)
    ws.columns = colWidths.map(width => ({ width }))

    const headerRow = ws.addRow(headers)
    headerRow.height = 28
    headerRow.eachCell(cell => {
      cell.fill = headerFill
      cell.font = headerFont
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = cellBorder
    })

    for (const task of tasks) {
      const entry = task.weekly_entries?.[0]
      const row = ws.addRow([
        task.is_completed ? '완료' : '진행중',
        task.category,
        task.request_dept || '',
        task.content,
        task.analysis_status,
        task.analysis_start_date || '',
        task.analysis_end_date || '',
        task.development_status,
        task.development_start_date || '',
        task.development_end_date || '',
        task.uat_status,
        task.uat_start_date || '',
        task.uat_end_date || '',
        task.open_status,
        task.open_date || '',
        entry?.this_week || '',
        entry?.next_week || '',
        task.note || '',
      ])
      row.height = 60
      row.eachCell(cell => {
        cell.alignment = { vertical: 'top', wrapText: true }
        cell.border = cellBorder
        if (task.is_completed) {
          cell.font = { color: { argb: 'FF9CA3AF' } }
        }
      })
    }
  }

  // AI 요약 시트
  const summaryWs = workbook.addWorksheet('AI 요약')
  summaryWs.getColumn(1).width = 120

  const titleRow = summaryWs.addRow([`[${weekLabel} Weekly 종합 요약]`])
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF2563EB' } }
  summaryWs.addRow([])

  aiSummaryText.split('\n').forEach(line => {
    const row = summaryWs.addRow([line])
    const cell = row.getCell(1)
    cell.alignment = { wrapText: true }
    if (line.startsWith('[') && line.endsWith(']')) {
      cell.font = { bold: true, size: 11 }
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
