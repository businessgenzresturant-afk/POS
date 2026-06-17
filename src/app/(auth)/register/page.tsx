import { RegisterForm } from "@/components/forms/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Create Account</h2>
          <p className="mt-2 text-center text-gray-600">
            Sign up for RAGSPRO POS
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
