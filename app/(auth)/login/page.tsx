import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Weekly Report</h1>
          <p className="text-sm text-gray-500 mt-1">팀 주간 보고 시스템</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
