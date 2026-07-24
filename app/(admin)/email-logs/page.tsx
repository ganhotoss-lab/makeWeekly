import { createClient } from '@/lib/supabase/server'
import { EmailLog } from '@/types'

export default async function EmailLogsPage() {
  const supabase = await createClient()
  const { data: logs } = await supabase
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">이메일 발송 이력</h1>

      {!logs?.length ? (
        <p className="text-gray-400 text-center py-16">발송 이력이 없습니다.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['주차', '수신자', '파일명', '상태', '발송일시', '오류'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(logs as EmailLog[]).map(log => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-gray-600">{log.week_start_date}</td>
                  <td className="px-4 py-3 text-gray-500">{log.recipient_email}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{log.file_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      log.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {log.status === 'success' ? '성공' : '실패'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(log.sent_at).toLocaleString('ko-KR', {
                      year: 'numeric', month: 'numeric', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-red-500 text-xs max-w-xs truncate">
                    {log.error_message || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
