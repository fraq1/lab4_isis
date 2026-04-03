'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userId')
      router.push('/login')
    }
  }

  return (
    <button
      onClick={logout}
      className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left text-purple-100 hover:bg-purple-700/40 transition"
    >
      <span>↩️</span>
      <span>Выйти</span>
    </button>
  )
}
