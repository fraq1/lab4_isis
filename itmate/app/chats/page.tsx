'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'

type Chat = {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
}

type User = {
  id: string
  username: string
  avatar_url?: string | null
}

type Message = {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
}

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadChats = async () => {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (!userId) {
        setError('Сначала авторизуйтесь')
        setLoading(false)
        return
      }

      const { data: chatsData, error: chatsError } = await getSupabase()
        .from('chats')
        .select('id,user1_id,user2_id,created_at')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (chatsError) {
        setError(chatsError.message)
        setLoading(false)
        return
      }

      if (!chatsData || chatsData.length === 0) {
        setChats([])
        setLoading(false)
        return
      }

      setChats(chatsData as Chat[])

      const partnerIds = Array.from(new Set((chatsData as Chat[]).flatMap((chat) => [chat.user1_id, chat.user2_id]).filter((id) => id !== userId)))

      const { data: usersData, error: usersError } = await getSupabase()
        .from('users')
        .select('id,username,avatar_url')
        .in('id', partnerIds)

      if (usersError) {
        setError(usersError.message)
        setLoading(false)
        return
      }

      setUsers((usersData as User[]).reduce((acc, u) => ({ ...acc, [u.id]: u }), {} as Record<string, User>))

      const chatIds = (chatsData as Chat[]).map((chat) => chat.id)
      const { data: messagesData, error: messagesError } = await getSupabase()
        .from('messages')
        .select('id,chat_id,sender_id,content,created_at')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false })

      if (messagesError) {
        setError(messagesError.message)
        setLoading(false)
        return
      }

      const lastByChat: Record<string, Message> = {}
      ;(messagesData as Message[]).forEach((msg) => {
        if (!lastByChat[msg.chat_id]) {
          lastByChat[msg.chat_id] = msg
        }
      })

      setLastMessages(lastByChat)
      setLoading(false)
    }

    loadChats()
  }, [])

  if (loading) {
    return <div className="p-6 text-purple-100 text-lg">Загрузка чатов...</div>
  }

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white p-6">
      <div className="max-w-4xl mx-auto bg-[#1b0e3c] rounded-2xl p-6 border border-purple-700">
        <h1 className="text-2xl font-bold mb-4">Список чатов</h1>

        {chats.length === 0 ? (
          <p>Чатов нет. Предложите цель в разделе «Найти партнера».</p>
        ) : (
          <ul className="space-y-3">
            {chats.map((chat) => {
              const partnerId = chat.user1_id === localStorage.getItem('userId') ? chat.user2_id : chat.user1_id
              const partner = users[partnerId]
              const lastMessage = lastMessages[chat.id]

              return (
                <li key={chat.id} className="p-4 rounded-xl bg-purple-900/30 border border-purple-600">
                  <Link href={`/chats/${chat.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">{partner ? partner.username : 'Партнер'}</h2>
                        <p className="text-sm text-purple-200">{lastMessage ? lastMessage.content : 'Нет сообщений'}</p>
                      </div>
                      <span className="text-xs text-purple-300">{new Date(chat.created_at).toLocaleString()}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
