'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

type Message = {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
}

type User = {
  id: string
  username: string
  avatar_url?: string | null
}

type Chat = {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
}

export default function ChatDetailPage() {
  const params = useParams()
  const chatId = params?.id
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [chat, setChat] = useState<Chat | null>(null)
  const [users, setUsers] = useState<Record<string, User>>({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

  useEffect(() => {
    const loadChat = async () => {
      if (!currentUserId) {
        setError('Сначала авторизуйтесь, чтобы открыть чат.')
        setLoading(false)
        return
      }

      if (!chatId) {
        setError('Неверный ID чата в URL.')
        setLoading(false)
        return
      }

      const { data: chatData, error: chatError } = await getSupabase()
        .from('chats')
        .select('id,user1_id,user2_id,created_at')
        .eq('id', chatId)
        .single()

      if (chatError || !chatData) {
        setError(`Чат не найден: ${chatError?.message || 'нет данных'}`)
        setLoading(false)
        return
      }

      const typedChatData = chatData as Chat

      if (typedChatData.user1_id !== currentUserId && typedChatData.user2_id !== currentUserId) {
        setError('Нет доступа к этому чату.')
        setLoading(false)
        return
      }

      setChat(typedChatData)

      const partnerId = typedChatData.user1_id === currentUserId ? typedChatData.user2_id : typedChatData.user1_id
      const { data: userData, error: userError } = await getSupabase()
        .from('users')
        .select('id,username,avatar_url')
        .in('id', [currentUserId, partnerId])

      if (userError || !userData) {
        setError('Не удалось загрузить участников чата.')
        setLoading(false)
        return
      }

      setUsers((userData as User[]).reduce((acc, u) => ({ ...acc, [u.id]: u }), {} as Record<string, User>))

      const { data: messagesData, error: messagesError } = await getSupabase()
        .from('messages')
        .select('id,chat_id,sender_id,content,created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        setError('Не удалось загрузить сообщения.')
        setLoading(false)
        return
      }

      setMessages(messagesData as Message[])
      setLoading(false)
    }

    loadChat()
  }, [chatId, currentUserId])

  const sendMessage = async () => {
    if (!input.trim() || !currentUserId) return

    const { error: insertError } = await getSupabase()
      .from('messages')
      .insert([{ chat_id: chatId, sender_id: currentUserId, content: input.trim() }])

    if (insertError) {
      setError('Не удалось отправить сообщение: ' + insertError.message)
      return
    }

    setInput('')

    const { data: messagesData, error: messagesError } = await getSupabase()
      .from('messages')
      .select('id,chat_id,sender_id,content,created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      setError('Не удалось обновить список сообщений.')
      return
    }

    setMessages(messagesData as Message[])
  }

  if (loading) {
    return <div className="p-6 text-purple-100">Загрузка чата...</div>
  }

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>
  }

  const partnerId = chat?.user1_id === currentUserId ? chat?.user2_id : chat?.user1_id
  const partner = partnerId ? users[partnerId] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white p-6">
      <div className="max-w-4xl mx-auto bg-[#1b0e3c] rounded-2xl p-6 border border-purple-700">
        <button className="text-sm text-purple-300 mb-4" onClick={() => router.back()}>
          ← Назад
        </button>
        <h1 className="text-2xl font-bold mb-2">Чат с {partner ? partner.username : 'пользователем'}</h1>
        <div className="h-[60vh] overflow-auto space-y-2 p-2 bg-purple-900/20 rounded-xl mb-4">
          {messages.length === 0 ? (
            <p className="text-purple-200">Пока нет сообщений. Напишите первым.</p>
          ) : (
            messages.map((message) => {
              const isMe = message.sender_id === currentUserId
              return (
                <div key={message.id} className={`p-2 rounded-lg ${isMe ? 'text-right bg-emerald-500/30 border border-emerald-500/30' : 'text-left bg-purple-700/30 border border-purple-500/30'}`}>
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs text-purple-300">{new Date(message.created_at).toLocaleString()}</span>
                </div>
              )
            })
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Написать сообщение..."
            className="flex-1 rounded-lg border border-purple-500 bg-[#160a31] px-3 py-2 text-white outline-none focus:border-blue-400"
          />
          <button onClick={sendMessage} className="px-4 py-2 rounded-lg bg-emerald-500 font-semibold hover:bg-emerald-400">
            Отправить
          </button>
        </div>
      </div>
    </div>
  )
}
