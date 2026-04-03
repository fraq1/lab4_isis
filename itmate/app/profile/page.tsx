'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [techStack, setTechStack] = useState('')
  const [skillLevel, setSkillLevel] = useState('beginner')
  const [trustRating, setTrustRating] = useState(50)
  const [avatarFileName, setAvatarFileName] = useState('')

  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setAvatarFileName(file.name)

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setAvatarUrl(result)
    }
    reader.readAsDataURL(file)
  }

  const router = useRouter()

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    if (!stored) {
      // Ведём неинтерактивную инициализацию, чтобы сервер и клиент дали одинаковый результат
      setTimeout(() => {
        setErrorMessage('Пользователь не найден. Сначала зарегистрируйтесь.')
        setLoading(false)
      }, 0)
      return
    }

    const loadUser = async () => {
      const { data, error } = await getSupabase()
        .from('users')
        .select('email,username,avatar_url,bio,tech_stack,skill_level,trust_rating')
        .eq('id', stored)
        .single()

      if (error || !data) {
        setErrorMessage(error?.message || 'Не удалось загрузить профиль.')
        setLoading(false)
        return
      }

      setEmail(data.email ?? '')
      setUsername(data.username ?? '')
      setAvatarUrl(data.avatar_url ?? '')
      setBio(data.bio ?? '')
      setTechStack(Array.isArray(data.tech_stack) ? data.tech_stack.join(', ') : '')
      setSkillLevel(data.skill_level ?? 'beginner')
      setTrustRating(data.trust_rating ?? 50)
      setLoading(false)
    }

    loadUser()
  }, [])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    if (!currentUserId) {
      setErrorMessage('Неизвестный пользователь.')
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setSaving(true)

    const techArray = techStack
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const { error } = await getSupabase()
      .from('users')
      .update({
        username,
        avatar_url: avatarUrl,
        bio,
        tech_stack: techArray,
        skill_level: skillLevel,
      })
      .eq('id', currentUserId)

    setSaving(false)

    if (error) {
      setErrorMessage(error.message || 'Не удалось сохранить профиль.')
      return
    }

    setSuccessMessage('Изменения сохранены успешно!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-950 text-purple-100">
        Загрузка профиля...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-purple-100 p-6">
      <div className="max-w-3xl mx-auto bg-[#1b0e3c] border border-purple-700 rounded-2xl shadow-[0_20px_60px_rgba(55,0,110,0.55)] p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold tracking-widest">Профиль</h1>
          <button
            className="text-sm px-4 py-2 rounded-lg border border-purple-500 bg-purple-900 hover:bg-purple-800"
            onClick={() => router.push('/goals')}
          >
            Перейти к целям
          </button>
        </div>

        {errorMessage && <div className="p-3 rounded bg-red-900 text-red-300">{errorMessage}</div>}
        {successMessage && <div className="p-3 rounded bg-green-900 text-green-300">{successMessage}</div>}

        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-purple-300">Email (только просмотр)</label>
              <input
                type="email"
                value={email}
                readOnly
                className="mt-1 w-full bg-purple-900 text-purple-100 border border-purple-600 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-purple-300">Никнейм</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1 w-full bg-purple-900 text-purple-100 border border-purple-600 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 bg-purple-900/30 border border-purple-600 rounded-xl p-4">
            <span className="text-sm text-purple-300">Аватарка</span>
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-purple-500 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="avatar preview"
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-300 text-xs text-center p-2">Нажмите на кнопку, чтобы выбрать</div>
              )}
            </div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-700 hover:bg-purple-600 border border-purple-500">
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarFileChange}
                className="hidden"
              />
              Выбрать файл
            </label>
            {avatarFileName && <span className="text-xs text-purple-300">{avatarFileName}</span>}
          </div>

          <div>
            <label className="text-sm text-purple-300">О себе</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="mt-1 w-full bg-purple-900 text-purple-100 border border-purple-600 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-purple-300">Технологический стек (через запятую)</label>
            <input
              type="text"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="React, Node.js, PostgreSQL"
              className="mt-1 w-full bg-purple-900 text-purple-100 border border-purple-600 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-purple-300">Уровень навыка</label>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="mt-1 w-full bg-purple-900 text-purple-100 border border-purple-600 rounded-lg px-3 py-2"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="text-sm text-purple-300">Рейтинг доверия: {trustRating}</div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 rounded-lg text-white font-semibold border border-purple-400 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  )
}
