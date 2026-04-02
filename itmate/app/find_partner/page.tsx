'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User = {
  id: string
  email: string
  username: string
  avatar_url?: string | null
  bio?: string | null
  tech_stack?: string[] | null
  skill_level?: string | null
  trust_rating?: number | null
}

type Goal = {
  id: string
  title: string
}

function shuffle<T>(arr: T[]) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function FindPartnerPage() {
  const [users, setUsers] = useState<User[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [myGoals, setMyGoals] = useState<Goal[]>([])
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [partnerToPropose, setPartnerToPropose] = useState<User | null>(null)
  const router = useRouter()

  const currentUserId = useMemo(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('userId')
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUserId) {
        setError('Сначала авторизуйтесь через профиль.')
        setLoading(false)
        return
      }

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id,email,username,avatar_url,bio,tech_stack,skill_level,trust_rating')
        .neq('id', currentUserId)

      if (usersError) {
        setError(usersError.message || 'Ошибка при загрузке пользователей.')
        setLoading(false)
        return
      }

      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('id,title')
        .eq('created_by', currentUserId)

      if (goalsError) {
        setError(goalsError.message || 'Ошибка при загрузке целей.')
        setLoading(false)
        return
      }

      setUsers(usersData ? shuffle(usersData as User[]) : [])
      setMyGoals(goalsData ? (goalsData as Goal[]) : [])
      setLoading(false)
    }

    fetchUsers()
  }, [currentUserId])

  const currentUser = users[index]

  const onDislike = async () => {
    if (!currentUserId || !currentUser) return
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('likes')
      .insert([{ from_user_id: currentUserId, to_user_id: currentUser.id, status: 'rejected' }])

    if (error) {
      setError('Не удалось сохранить дизлайк: ' + error.message)
      return
    }

    setMessage('Пользователь пропущен.')
    setIndex((prev) => prev + 1)
  }

  const onSkip = () => {
    setMessage('Пропуск...')
    setIndex((prev) => prev + 1)
  }

  const onPropose = () => {
    if (!currentUser) return
    setPartnerToPropose(currentUser)
    setIsGoalDialogOpen(true)
    setMessage('')
    setError('')
  }

  const createChatWithGoal = async (goal: Goal) => {
    if (!currentUserId || !partnerToPropose) {
      setError('Нет данных для создания чата.')
      return
    }

    setError('')
    setMessage('')

    const { error: likeError } = await supabase
      .from('likes')
      .insert([{ from_user_id: currentUserId, to_user_id: partnerToPropose.id, status: 'pending' }])

    if (likeError) {
      setError('Не удалось сохранить предложение: ' + likeError.message)
      return
    }

    const existingChatFilter = `and(user1_id.eq.${currentUserId},user2_id.eq.${partnerToPropose.id}),and(user1_id.eq.${partnerToPropose.id},user2_id.eq.${currentUserId})`
    const { data: existingChats, error: existingChatError } = await supabase
      .from('chats')
      .select('id,user1_id,user2_id')
      .or(existingChatFilter)

    if (existingChatError) {
      setError('Не удалось получить чаты: ' + existingChatError.message)
      return
    }

    let chatId = existingChats?.find((chat: any) =>
      (chat.user1_id === currentUserId && chat.user2_id === partnerToPropose.id) ||
      (chat.user2_id === currentUserId && chat.user1_id === partnerToPropose.id)
    )?.id

    if (!chatId) {
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert([{ user1_id: currentUserId, user2_id: partnerToPropose.id }])
        .select()
        .single()

      if (chatError || !newChat) {
        setError('Не удалось создать чат: ' + (chatError?.message || 'ошибка'))
        return
      }

      chatId = newChat.id
    }

    const messageText = `Предлагаю вместе достигнуть цели: ${goal.title}`
    const { error: messageError } = await supabase
      .from('messages')
      .insert([{ chat_id: chatId, sender_id: currentUserId, content: messageText }])

    if (messageError) {
      setError('Не удалось отправить первое сообщение: ' + messageError.message)
      return
    }

    setMessage('Цель предложена, чат создан.')
    setIsGoalDialogOpen(false)
    setIndex((prev) => prev + 1)
    router.push('/chats')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-purple-100">
        Загрузка пользователей для подбора...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-purple-100 p-6">
        <div className="bg-[#1b0e3c] p-6 rounded-2xl border border-purple-700 shadow-lg">
          <p className="text-red-300">{error}</p>
          <button className="mt-4 bg-purple-600 px-4 py-2 rounded-lg" onClick={() => router.push('/profile')}>
            Вернуться к профилю
          </button>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-purple-100 p-6">
        <div className="bg-[#1b0e3c] p-6 rounded-2xl border border-purple-700 shadow-lg text-center">
          <h2 className="text-xl font-bold">Партнёров пока нет</h2>
          <p className="text-purple-300 mt-2">Вернитесь позже, когда появятся новые участники.</p>
          <button className="mt-4 bg-purple-600 px-4 py-2 rounded-lg" onClick={() => router.push('/profile')}>
            К профилю
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-purple-100 p-6">
      <div className="max-w-4xl mx-auto bg-[#1b0e3c] border border-purple-700 rounded-2xl shadow-[0_20px_60px_rgba(55,0,110,0.55)] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-widest">Найти партнера</h1>
          <span className="text-sm text-purple-300">{index + 1} / {users.length}</span>
        </div>

        {message && <div className="p-3 rounded bg-green-900 text-green-300">{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          <div className="flex flex-col items-center gap-3 bg-purple-900/30 border border-purple-600 rounded-2xl p-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-purple-500 bg-purple-950">
              {currentUser.avatar_url ? (
                <Image
                  src={currentUser.avatar_url}
                  alt={`${currentUser.username} avatar`}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-300 text-xs">Нет фото</div>
              )}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">{currentUser.username}</h2>
              <p className="text-xs text-purple-300">{currentUser.email}</p>
            </div>
            <div className="text-xs leading-relaxed text-purple-300 bg-purple-900/40 rounded-lg p-2 min-h-[80px]">
              {currentUser.bio || 'Без описания'}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="px-4 py-3 rounded-xl border border-purple-700 bg-purple-900/30">
                <h3 className="text-xs text-purple-300">Уровень</h3>
                <p className="text-sm font-semibold text-white">{currentUser.skill_level || 'beginner'}</p>
              </div>
              <div className="px-4 py-3 rounded-xl border border-purple-700 bg-purple-900/30">
                <h3 className="text-xs text-purple-300">Траст</h3>
                <p className="text-sm font-semibold text-white">{currentUser.trust_rating ?? 50}</p>
              </div>
            </div>

            <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-4">
              <h3 className="text-sm text-purple-200 font-semibold mb-2">Технологический стек</h3>
              <div className="flex flex-wrap gap-2">
                {(currentUser.tech_stack && currentUser.tech_stack.length > 0
                  ? currentUser.tech_stack
                  : ['не указан']).map((tech) => (
                  <span key={tech} className="text-xs px-2 py-1 bg-purple-800 rounded-md">{tech}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={onPropose}
                className="py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
              >
                Предложить цель
              </button>
              <button
                type="button"
                onClick={onDislike}
                className="py-2 rounded-lg font-semibold bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400"
              >
                Дизлайк
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="py-2 rounded-lg font-semibold border border-purple-500 bg-purple-800 hover:bg-purple-700"
              >
                Скип
              </button>
            </div>
          </div>
        </div>
      </div>

      {isGoalDialogOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-purple-700 bg-[#1b0e3c] p-6">
            <h3 className="text-lg font-bold text-purple-100 mb-3">Выберите свою цель</h3>
            {myGoals.length === 0 ? (
              <div className="text-purple-300 text-sm">У вас нет целей. Сначала создайте цель.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {myGoals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => createChatWithGoal(goal)}
                    className="w-full text-left rounded-lg border border-purple-600 bg-purple-900/60 px-3 py-2 hover:bg-purple-800"
                  >
                    {goal.title}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setIsGoalDialogOpen(false)} className="mt-4 text-sm text-purple-300 hover:text-purple-100">
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
