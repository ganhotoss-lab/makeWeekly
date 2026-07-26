export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  team: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export type Category = 'Biz사업' | '내부개선' | '상품' | '기타'
export type StageStatus = '미시작' | '진행중' | '완료'
export type OpenStatus = '미오픈' | '오픈완료'

export interface Task {
  id: string
  user_id: string
  category: Category
  title: string | null
  content: string
  analysis_status: StageStatus
  analysis_start_date: string | null
  analysis_end_date: string | null
  development_status: StageStatus
  development_start_date: string | null
  development_end_date: string | null
  uat_status: StageStatus
  uat_start_date: string | null
  uat_end_date: string | null
  open_status: OpenStatus
  open_date: string | null
  note: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface WeeklyEntry {
  id: string
  task_id: string
  user_id: string
  week_start_date: string
  week_label: string
  this_week: string
  next_week: string
  created_at: string
  updated_at: string
}

export interface EmailLog {
  id: string
  week_start_date: string
  recipient_email: string
  file_name: string
  ai_summary: string
  status: 'success' | 'failed'
  error_message: string | null
  sent_at: string
}

export interface TaskWithEntry extends Task {
  weekly_entries: WeeklyEntry[]
  users?: User
}
