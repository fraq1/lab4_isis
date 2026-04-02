'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewGoalPage() {
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    if (!userId) {
      setError('Сначала авторизуйтесь в профиле.')
      return
    }

    if (!title.trim()) {
      setError('Название цели не может быть пустым.')
      return
    }

    if (!startDate || !endDate) {
      setError('Укажите дату начала и окончания.')
      return
    }

    if (endDate < startDate) {
      setError('Дата окончания должна быть позже даты начала.')
      return
    }

    setIsSaving(true)

    const { error: insertError } = await supabase.from('goals').insert([
      {
        title: title.trim(),
        topic: topic.trim() || 'Без темы',
        start_date: startDate,
        end_date: endDate,
        created_by: userId,
        status: 'active',
      },
    ])

    setIsSaving(false)

    if (insertError) {
      setError(insertError.message || 'Не удалось создать цель.')
      return
    }

    setSuccess('Цель успешно создана! Перенаправляем...')
    setTimeout(() => router.push('/reports'), 1200)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 p-6 text-purple-100">
      <div className="max-w-4xl mx-auto grid gap-6 lg:grid-cols-[1fr_1fr]">
        <aside className="rounded-2xl border border-purple-700 bg-[#1b0e3c] p-6 shadow-[0_4px_20px_rgba(25,0,75,0.65)]">
          <h2 className="text-2xl font-extrabold mb-3">Что такое цель?</h2>
          <p className="text-sm text-purple-300 leading-relaxed mb-3">
            Цель позволяет вам планировать результат и следить за прогрессом. Хорошая цель:
            конкретна, измерима и ограничена временем.
          </p>
          <ul className="list-disc ml-5 text-sm text-purple-300 space-y-2">
            <li>Название: чётко и кратко</li>
            <li>Тема: язык, фреймворк, направление (опционально)</li>
            <li>Даты: старт и срок выполнения</li>
          </ul>
          <p className="text-xs text-purple-400 mt-4">Пример: &quot;Изучить основы Next.js к 1 мая&quot;</p>
        </aside>

        <section className="rounded-2xl border border-purple-700 bg-[#1a0c3a] p-6 shadow-[0_4px_20px_rgba(30,0,90,0.65)]">
          {error && <div className="mb-4 rounded-lg bg-rose-900/50 p-3 text-rose-300">{error}</div>}
          {success && <div className="mb-4 rounded-lg bg-emerald-900/50 p-3 text-emerald-300">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-purple-300">Название цели *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например, изучить Next.js"
                className="mt-1 w-full rounded-lg border border-purple-600 bg-purple-900/70 px-3 py-2 text-purple-100 focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-purple-300">Тема (необязательно)</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Python, React, Backend, AI"
                className="mt-1 w-full rounded-lg border border-purple-600 bg-purple-900/70 px-3 py-2 text-purple-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-purple-300">Дата начала *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-purple-600 bg-purple-900/70 px-3 py-2 text-purple-100 focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-purple-300">Дата окончания *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-purple-600 bg-purple-900/70 px-3 py-2 text-purple-100 focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-semibold text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              {isSaving ? 'Сохраняем...' : 'Создать цель'}
            </button>

            <p className="text-xs text-purple-400">* Обязательные поля</p>
          </form>
        </section>
      </div>
    </div>
  )
}