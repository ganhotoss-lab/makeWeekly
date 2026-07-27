import ExcelJS from 'exceljs'
import { TaskWithEntry, User } from '@/types'

export interface UserWeeklyData {
  user: User
  tasks: TaskWithEntry[]
}

export interface ExcelColumnConfig {
  column_key: string
  label: string
  enabled: boolean
  sort_order: number
}

const DEFAULT_COLUMNS: ExcelColumnConfig[] = [
  { column_key: 'is_completed', label: '완료여부', enabled: true, sort_order: 0 },
  { column_key: 'category', label: '구분', enabled: true, sort_order: 1 },
  { column_key: 'request_dept', label: '요청부서', enabled: true, sort_order: 2 },
  { column_key: 'content', label: '업무 내용', enabled: true, sort_order: 3 },
  { column_key: 'analysis_status', label: '분석/설계 상태', enabled: true, sort_order: 4 },
  { column_key: 'analysis_start_date', label: '분석/설계 시작일', enabled: true, sort_order: 5 },
  { column_key: 'analysis_end_date', label: '분석/설계 종료일', enabled: true, sort_order: 6 },
  { column_key: 'development_status', label: '개발 상태', enabled: true, sort_order: 7 },
  { column_key: 'development_start_date', label: '개발 시작일', enabled: true, sort_order: 8 },
  { column_key: 'development_end_date', label: '개발 종료일', enabled: true, sort_order: 9 },
  { column_key: 'uat_status', label: 'UAT 상태', enabled: true, sort_order: 10 },
  { column_key: 'uat_start_date', label: 'UAT 시작일', enabled: true, sort_order: 11 },
  { column_key: 'uat_end_date', label: 'UAT 종료일', enabled: true, sort_order: 12 },
  { column_key: 'open_status', label: 'OPEN 상태', enabled: true, sort_order: 13 },
  { column_key: 'open_date', label: 'OPEN 예정일', enabled: true, sort_order: 14 },
  { column_key: 'this_week', label: 'This Week', enabled: true, sort_order: 15 },
  { column_key: 'next_week', label: 'Next Week', enabled: true, sort_order: 16 },
  { column_key: 'note', label: '비고', enabled: true, sort_order: 17 },
]

const COL_WIDTHS: Record<string, number> = {
  is_completed: 10,
  category: 12,
  request_dept: 16,
  content: 35,
  analysis_status: 14,
  analysis_start_date: 14,
  analysis_end_date: 14,
  development_status: 12,
  development_start_date: 14,
  development_end_date: 14,
  uat_status: 12,
  uat_start_date: 14,
  uat_end_date: 14,
  open_status: 12,
  open_date: 14,
  this_week: 45,
  next_week: 45,
  note: 20,
}

function getCellValue(key: string, task: TaskWithEntry): string | boolean {
  const entry = task.weekly_entries?.[0]
  switch (key) {
    case 'is_completed': return task.is_completed ? '완료' : '진행중'
    case 'category': return task.category
    case 'request_dept': return task.request_dept || ''
    case 'content': return task.content
    case 'analysis_status': return task.analysis_status
    case 'analysis_start_date': return task.analysis_start_date || ''
    case 'analysis_end_date': return task.analysis_end_date || ''
    case 'development_status': return task.development_status
    case 'development_start_date': return task.development_start_date || ''
    case 'development_end_date': return task.development_end_date || ''
    case 'uat_status': return task.uat_status
    case 'uat_start_date': return task.uat_start_date || ''
    case 'uat_end_date': return task.uat_end_date || ''
    case 'open_status': return task.open_status
    case 'open_date': return task.open_date || ''
    case 'this_week': return entry?.this_week || ''
    case 'next_week': return entry?.next_week || ''
    case 'note': return task.note || ''
    default: return ''
  }
}

export const ALL_COLUMN_DEFAULTS = DEFAULT_COLUMNS

export async function generateWeeklyExcel(
  weekLabel: string,
  usersData: UserWeeklyData[],
  aiSummaryText: string,
  columnConfig?: ExcelColumnConfig[]
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

  const activeCols = (columnConfig && columnConfig.length > 0 ? columnConfig : DEFAULT_COLUMNS)
    .filter(c => c.enabled)
    .sort((a, b) => a.sort_order - b.sort_order)

  const headers = activeCols.map(c => c.label)
  const colWidths = activeCols.map(c => COL_WIDTHS[c.column_key] ?? 14)

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
      const row = ws.addRow(activeCols.map(c => getCellValue(c.column_key, task)))
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
