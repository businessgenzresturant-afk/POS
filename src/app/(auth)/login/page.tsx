import { LoginForm } from "@/components/forms/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Sign in</h2>
          <p className="mt-2 text-center text-gray-600">
            Welcome back to Gen-Z Restaurant POS
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
