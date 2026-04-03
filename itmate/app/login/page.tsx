'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email || !password) {
      setErrorMessage('Пожалуйста, заполните email и пароль.')
      return
    }

    setIsLoading(true)

    const { data, error } = await getSupabase()
      .from('users')
      .select('id,email,username,password_hash')
      .eq('email', email)
      .eq('password_hash', password)
      .single()

    setIsLoading(false)

    if (error || !data) {
      setErrorMessage('Неверная почта или пароль.')
      return
    }

    localStorage.setItem('userId', data.id)
    router.push('/profile')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-slate-100 p-6">
      <div className="w-full max-w-lg bg-[#1b0e3c] rounded-2xl border border-purple-700 p-8 shadow-[0_20px_60px_rgba(55,0,110,0.55)]">
        <h1 className="text-3xl font-extrabold text-purple-200 mb-2 text-center tracking-widest">Вход</h1>
        <p className="text-sm text-purple-300 mb-6 text-center">Введите данные, чтобы войти в свой аккаунт.</p>

        {errorMessage && <div className="mb-4 text-sm text-red-700 bg-red-100 p-3 rounded">{errorMessage}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-purple-500 bg-purple-900 text-purple-100 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-purple-500 bg-purple-900 text-purple-100 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
            required
          />
          <button
            type="submit"
            className="w-full py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="mt-4 text-xs text-purple-300 text-center">
          Нет аккаунта? <Link href="/" className="text-purple-100 underline">Зарегистрируйтесь</Link>
        </p>
      </div>
    </div>
  )
}
