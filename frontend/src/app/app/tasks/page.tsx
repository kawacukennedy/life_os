'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import { format } from 'date-fns'

const GET_TASKS = gql`
  query GetTasks($userId: String!, $status: String, $limit: Int) {
    tasks(userId: $userId, status: $status, limit: $limit) {
      id
      title
      description
      status
      priority
      dueAt
      durationMinutes
      isRecurring
      recurrenceType
      tags
      createdAt
    }
  }
`

const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      status
      priority
      dueAt
      createdAt
    }
  }
`

const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      status
      priority
    }
  }
`

const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`

interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueAt?: string
  durationMinutes?: number
  isRecurring: boolean
  recurrenceType?: string
  tags?: string[]
  createdAt: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const { addToast } = useToast()

  const userId = localStorage.getItem('userId') || 'user123'

  const { data, loading, refetch } = useQuery(GET_TASKS, {
    variables: {
      userId,
      status: filter === 'all' ? undefined : filter,
      limit: 50
    },
    onCompleted: (data) => {
      if (data?.tasks) {
        setTasks(data.tasks)
      }
    }
  })

  const [createTask] = useMutation(CREATE_TASK, {
    onCompleted: () => {
      refetch()
      setIsCreateModalOpen(false)
      addToast({
        title: 'Task Created',
        description: 'Your task has been created successfully.',
        variant: 'default'
      })
    },
    onError: (error) => {
      addToast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const [updateTask] = useMutation(UPDATE_TASK, {
    onCompleted: () => {
      refetch()
      setEditingTask(null)
      addToast({
        title: 'Task Updated',
        description: 'Your task has been updated successfully.',
        variant: 'default'
      })
    }
  })

  const [deleteTask] = useMutation(DELETE_TASK, {
    onCompleted: () => {
      refetch()
      addToast({
        title: 'Task Deleted',
        description: 'Your task has been deleted successfully.',
        variant: 'default'
      })
    }
  })

  const handleCreateTask = (taskData: Partial<Task>) => {
    createTask({
      variables: {
        input: {
          ...taskData,
          userId
        }
      }
    })
  }

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    updateTask({
      variables: {
        id,
        input: updates
      }
    })
  }

  const handleDeleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask({
        variables: { id }
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Task
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  onClick={() => setFilter(status as any)}
                  className="capitalize"
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <li key={task.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                        <div className="ml-2 flex space-x-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          {task.isRecurring && (
                            <Badge className="bg-purple-100 text-purple-800">
                              Recurring
                            </Badge>
                          )}
                        </div>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        {task.dueAt && (
                          <span className="mr-4">
                            Due: {format(new Date(task.dueAt), 'PPP')}
                          </span>
                        )}
                        {task.durationMinutes && (
                          <span className="mr-4">
                            Duration: {task.durationMinutes} min
                          </span>
                        )}
                        <span>
                          Created: {format(new Date(task.createdAt), 'PP')}
                        </span>
                      </div>
                      {task.tags && task.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {task.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateTask(task.id, { status: 'completed' })}
                        >
                          Complete
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTask(task)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {tasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No tasks found. Create your first task!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <TaskModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTask}
          title="Create New Task"
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={(updates) => handleUpdateTask(editingTask.id, updates)}
          title="Edit Task"
        />
      )}
    </div>
  )
}

interface TaskModalProps {
  task?: Task
  onClose: () => void
  onSubmit: (taskData: Partial<Task>) => void
  title: string
}

function TaskModal({ task, onClose, onSubmit, title }: TaskModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    dueAt: task?.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '',
    durationMinutes: task?.durationMinutes || undefined,
    tags: task?.tags || [],
    ...task
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...formData,
      dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : undefined,
      durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : undefined
    }
    onSubmit(submitData)
  }

  return (
    <Modal onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-start focus:border-primary-start"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-start focus:border-primary-start"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <Input
              type="number"
              value={formData.durationMinutes || ''}
              onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Due Date</label>
          <Input
            type="datetime-local"
            value={formData.dueAt}
            onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
          <Input
            type="text"
            value={formData.tags?.join(', ') || ''}
            onChange={(e) => setFormData({
              ...formData,
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
            })}
            placeholder="work, personal, urgent"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {task ? 'Update' : 'Create'} Task
          </Button>
        </div>
      </form>
    </Modal>
  )
}