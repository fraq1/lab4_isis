'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Добавляем тип для Goal
type Goal = {
  id: string
  title: string
  topic: string
  start_date: string
  end_date: string
  created_by: string
  status: string
  created_at: string
}

export default function ReportPage() {
  const [goals, setGoals] = useState<Goal[]>([])  // ✅ вместо any[]
  const [selectedGoal, setSelectedGoal] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [reportDate, setReportDate] = useState('')

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      supabase.from('goals').select('*').eq('created_by', userId).then(({ data }) => {
        if (data) setGoals(data as Goal[])  // ✅ явное приведение типа
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('Сначала зарегистрируйся')
      return
    }

    const { error } = await supabase.from('reports').insert([{
      goal_id: selectedGoal,
      user_id: userId,
      report_date: reportDate,
      task_description: taskDescription,
      is_completed: true
    }])

    if (error) {
      alert('Ошибка: ' + error.message)
    } else {
      alert('Отчёт отправлен!')
      // Очищаем форму
      setSelectedGoal('')
      setTaskDescription('')
      setReportDate('')
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Отправить отчёт</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select 
          className="border p-2 w-full" 
          value={selectedGoal} 
          onChange={(e) => setSelectedGoal(e.target.value)} 
          required
        >
          <option value="">Выбери цель</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>
        
        <textarea 
          placeholder="Что сделал?" 
          className="border p-2 w-full"
          value={taskDescription} 
          onChange={(e) => setTaskDescription(e.target.value)} 
          required 
        />
        
        <input 
          type="date" 
          className="border p-2 w-full"
          value={reportDate} 
          onChange={(e) => setReportDate(e.target.value)} 
          required 
        />
        
        <button type="submit" className="bg-purple-500 text-white p-2 rounded w-full">
          Отправить
        </button>
      </form>
    </div>
  )
}