'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/contexts/ToastContext'

const GET_ROUTINES = gql`
  query GetRoutines($userId: String!) {
    routines(userId: $userId) {
      id
      name
      description
      triggers
      actions
      isActive
      schedule
      createdAt
    }
  }
`

const CREATE_ROUTINE = gql`
  mutation CreateRoutine($input: CreateRoutineInput!) {
    createRoutine(input: $input) {
      id
      name
      isActive
      createdAt
    }
  }
`

const UPDATE_ROUTINE = gql`
  mutation UpdateRoutine($id: ID!, $input: UpdateRoutineInput!) {
    updateRoutine(id: $id, input: $input) {
      id
      isActive
    }
  }
`

const DELETE_ROUTINE = gql`
  mutation DeleteRoutine($id: ID!) {
    deleteRoutine(id: $id)
  }
`

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
  const [routines, setRoutines] = useState<Routine[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    description: '',
    triggers: [''],
    actions: ['']
  })
  const { addToast } = useToast()

  const userId = localStorage.getItem('userId') || 'user123'

  const { data, loading, refetch } = useQuery(GET_ROUTINES, {
    variables: { userId },
    onCompleted: (data) => {
      if (data?.routines) {
        setRoutines(data.routines)
      }
    }
  })

  const [createRoutine] = useMutation(CREATE_ROUTINE, {
    onCompleted: () => {
      refetch()
      setShowCreateForm(false)
      setNewRoutine({ name: '', description: '', triggers: [''], actions: [''] })
      addToast({
        title: 'Routine Created',
        description: 'Your routine has been created successfully.',
        variant: 'default'
      })
    },
    onError: () => {
      addToast({
        title: 'Error',
        description: 'Failed to create routine.',
        variant: 'destructive'
      })
    }
  })

  const [updateRoutine] = useMutation(UPDATE_ROUTINE, {
    onCompleted: () => {
      refetch()
      addToast({
        title: 'Routine Updated',
        description: 'Your routine has been updated successfully.',
        variant: 'default'
      })
    }
  })

  const [deleteRoutine] = useMutation(DELETE_ROUTINE, {
    onCompleted: () => {
      refetch()
      addToast({
        title: 'Routine Deleted',
        description: 'Your routine has been deleted successfully.',
        variant: 'default'
      })
    }
  })

  const toggleRoutine = (id: string, currentStatus: boolean) => {
    updateRoutine({
      variables: {
        id,
        input: { isActive: !currentStatus }
      }
    })
  }

  const handleCreateRoutine = () => {
    createRoutine({
      variables: {
        input: {
          userId,
          name: newRoutine.name,
          description: newRoutine.description,
          triggers: newRoutine.triggers.filter(t => t.trim()),
          actions: newRoutine.actions.filter(a => a.trim()).map(action => ({ type: 'notification', payload: action }))
        }
      }
    })
  }

  const handleDeleteRoutine = (id: string) => {
    if (confirm('Are you sure you want to delete this routine?')) {
      deleteRoutine({
        variables: { id }
      })
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-start"></div>
      </div>
    )
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
                  <div className="flex space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routine.isActive}
                        onChange={() => toggleRoutine(routine.id, routine.isActive)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRoutine(routine.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </Button>
                  </div>
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
                      {Array.isArray(routine.actions) && routine.actions.map((action, index) => (
                        <span key={index} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1">
                          {typeof action === 'string' ? action : action.type || 'Action'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showCreateForm && (
            <Modal onClose={() => setShowCreateForm(false)} title="Create New Routine">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateRoutine(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <Input
                      type="text"
                      value={newRoutine.name}
                      onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                      placeholder="Routine name"
                      required
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
                      <Input
                        key={index}
                        type="text"
                        value={trigger}
                        onChange={(e) => updateTrigger(index, e.target.value)}
                        className="mb-2"
                        placeholder="e.g., Time: 8:00 AM"
                      />
                    ))}
                    <Button onClick={addTrigger} variant="outline" size="sm">Add Trigger</Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
                    {newRoutine.actions.map((action, index) => (
                      <Input
                        key={index}
                        type="text"
                        value={action}
                        onChange={(e) => updateAction(index, e.target.value)}
                        className="mb-2"
                        placeholder="e.g., Send notification"
                      />
                    ))}
                    <Button onClick={addAction} variant="outline" size="sm">Add Action</Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button type="button" onClick={() => setShowCreateForm(false)} variant="outline">Cancel</Button>
                  <Button type="submit">Create Routine</Button>
                </div>
              </form>
            </Modal>
          )}
        </div>
      </main>
    </div>
  )
}