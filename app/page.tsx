'use client'
import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email || !username || !password || !confirmPassword) {
      setErrorMessage('Пожалуйста, заполните все поля.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Пароли не совпадают.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Пароль должен содержать минимум 6 символов.')
      return
    }

    setIsLoading(true)

    const { data, error } = await ((getSupabase() as any)
      .from('users')
      .insert([
        {
          email,
          username,
          password_hash: password,
          skill_level: 'beginner',
          trust_rating: 50,
        },
      ])
      .select() as any)

    setIsLoading(false)

    if (error) {
      setErrorMessage(error.message || 'Ошибка регистрации. Попробуйте позже.')
      return
    }

    if (data && data.length > 0) {
      localStorage.setItem('userId', data[0].id)
      setSuccessMessage('Успешно! Перенаправляем на страницу профиля...')
      setTimeout(() => router.push('/profile'), 1000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-slate-100 p-6">
      <div className="w-full max-w-lg bg-[#1b0e3c] shadow-[0_20px_60px_rgba(55,0,110,0.55)] rounded-2xl border border-purple-700 p-8">
        <h1 className="text-3xl font-extrabold text-purple-200 mb-2 text-center tracking-widest">Регистрация</h1>
        <p className="text-sm text-purple-300 mb-6 text-center">Создайте профиль для доступа к целям, отчетам и чатам.</p>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-700 bg-red-100 p-3 rounded">{errorMessage}</div>
        )}

        {successMessage && (
          <div className="mb-4 text-sm text-green-700 bg-green-100 p-3 rounded">{successMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="border border-purple-500 bg-purple-900 text-purple-100 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Имя пользователя"
            className="border border-purple-500 bg-purple-900 text-purple-100 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            className="border border-purple-500 bg-purple-900 text-purple-100 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Подтвердите пароль"
            className="border border-purple-500 bg-purple-900 text-purple-100 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-2 rounded-lg text-white font-semibold transition-all duration-200 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Создать профиль'}
          </button>
        </form>

        <p className="mt-4 text-xs text-purple-300 text-center">
          Уже есть аккаунт? <a href="/login" className="text-purple-100 underline">Войдите</a>
        </p>
      </div>
    </div>
  )
}
