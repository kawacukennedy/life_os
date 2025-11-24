'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface Routine {
  id: string
  name: string
  description: string
  triggers: string[]
  actions: string[]
  isActive: boolean
  lastRun?: string
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([
    {
      id: '1',
      name: 'Morning Health Check',
      description: 'Automatically log morning vitals and send reminders',
      triggers: ['Time: 8:00 AM', 'Day: Monday-Friday'],
      actions: ['Log heart rate', 'Send reminder to exercise'],
      isActive: true,
      lastRun: '2024-11-24T08:00:00Z'
    },
    {
      id: '2',
      name: 'Weekly Budget Review',
      description: 'Review spending and send budget alerts',
      triggers: ['Time: Sunday 6:00 PM'],
      actions: ['Analyze transactions', 'Send budget report'],
      isActive: true,
      lastRun: '2024-11-17T18:00:00Z'
    },
    {
      id: '3',
      name: 'Learning Streak Reminder',
      description: 'Remind to maintain daily learning habit',
      triggers: ['Time: 7:00 PM', 'Condition: No learning today'],
      actions: ['Send reminder', 'Suggest quick lesson'],
      isActive: false
    }
  ])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    description: '',
    triggers: [''],
    actions: ['']
  })

  const toggleRoutine = (id: string) => {
    setRoutines(prev => prev.map(routine =>
      routine.id === id ? { ...routine, isActive: !routine.isActive } : routine
    ))
  }

  const handleCreateRoutine = () => {
    const routine: Routine = {
      id: Date.now().toString(),
      name: newRoutine.name,
      description: newRoutine.description,
      triggers: newRoutine.triggers.filter(t => t.trim()),
      actions: newRoutine.actions.filter(a => a.trim()),
      isActive: true
    }
    setRoutines(prev => [...prev, routine])
    setNewRoutine({ name: '', description: '', triggers: [''], actions: [''] })
    setShowCreateForm(false)
  }

  const addTrigger = () => {
    setNewRoutine(prev => ({ ...prev, triggers: [...prev.triggers, ''] }))
  }

  const addAction = () => {
    setNewRoutine(prev => ({ ...prev, actions: [...prev.actions, ''] }))
  }

  const updateTrigger = (index: number, value: string) => {
    setNewRoutine(prev => ({
      ...prev,
      triggers: prev.triggers.map((t, i) => i === index ? value : t)
    }))
  }

  const updateAction = (index: number, value: string) => {
    setNewRoutine(prev => ({
      ...prev,
      actions: prev.actions.map((a, i) => i === index ? value : a)
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Autonomous Routines</h1>
            <Button onClick={() => setShowCreateForm(true)}>Create Routine</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <p className="text-gray-600">
              Create automated routines that run based on triggers like time, conditions, or events.
              These routines can perform actions like sending notifications, logging data, or updating your schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routines.map((routine) => (
              <div key={routine.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{routine.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{routine.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={routine.isActive}
                      onChange={() => toggleRoutine(routine.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Triggers</h4>
                    <div className="space-y-1">
                      {routine.triggers.map((trigger, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Actions</h4>
                    <div className="space-y-1">
                      {routine.actions.map((action, index) => (
                        <span key={index} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>

                  {routine.lastRun && (
                    <div className="text-xs text-gray-500">
                      Last run: {new Date(routine.lastRun).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showCreateForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Routine</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={newRoutine.name}
                        onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
                        placeholder="Routine name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={newRoutine.description}
                        onChange={(e) => setNewRoutine({ ...newRoutine, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
                        placeholder="What does this routine do?"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Triggers</label>
                      {newRoutine.triggers.map((trigger, index) => (
                        <input
                          key={index}
                          type="text"
                          value={trigger}
                          onChange={(e) => updateTrigger(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start mb-2"
                          placeholder="e.g., Time: 8:00 AM"
                        />
                      ))}
                      <Button onClick={addTrigger} variant="outline" size="sm">Add Trigger</Button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
                      {newRoutine.actions.map((action, index) => (
                        <input
                          key={index}
                          type="text"
                          value={action}
                          onChange={(e) => updateAction(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start mb-2"
                          placeholder="e.g., Send notification"
                        />
                      ))}
                      <Button onClick={addAction} variant="outline" size="sm">Add Action</Button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <Button onClick={() => setShowCreateForm(false)} variant="outline">Cancel</Button>
                    <Button onClick={handleCreateRoutine}>Create Routine</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}