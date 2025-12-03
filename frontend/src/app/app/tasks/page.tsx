'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'
import { useLazyQuery } from '@apollo/client'

const GET_TASKS = gql`
  query GetTasks($userId: String!) {
    getTasks(userId: $userId) {
      tasks {
        id
        title
        description
        status
        priority
        dueAt
        durationMinutes
        createdAt
        completedAt
        tags
      }
      totalCount
    }
  }
`

const CREATE_TASK = gql`
  mutation CreateTask($userId: String!, $input: TaskInput!) {
    createTask(userId: $userId, input: $input) {
      id
      title
      status
      createdAt
    }
  }
`

const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($taskId: String!, $status: String!) {
    updateTaskStatus(taskId: $taskId, status: $status) {
      id
      status
      completedAt
    }
  }
`

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: number
  dueAt: string | null
  durationMinutes: number
  createdAt: string
  completedAt: string | null
  tags: string[]
}

export default function TasksPage() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: tasksData, isLoading, error, refetch } = useLazyQuery(GET_TASKS, {
    variables: { userId },
    onCompleted: (data) => {
      trackEvent('tasks_loaded', { count: data?.getTasks?.totalCount })
    },
    onError: (error) => {
      console.error('Tasks error:', error)
      addToast({
        title: 'Tasks Error',
        description: 'Unable to load tasks. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const [createTaskMutation] = useMutation(CREATE_TASK, {
    onCompleted: () => {
      refetch()
      setNewTaskTitle('')
      setShowNewTaskForm(false)
      addToast({
        title: 'Task Created',
        description: 'New task has been added to your list.',
      })
    },
    onError: (error) => {
      console.error('Create task error:', error)
      addToast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const [updateTaskStatusMutation] = useMutation(UPDATE_TASK_STATUS, {
    onCompleted: (data) => {
      refetch()
      if (data.updateTaskStatus.status === 'completed') {
        addToast({
          title: 'Task Completed',
          description: 'Great job! Task marked as completed.',
        })
        trackEvent('task_completed', { taskId: data.updateTaskStatus.id })
      }
    },
    onError: (error) => {
      console.error('Update task error:', error)
      addToast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive'
      })
    }
  })

  useEffect(() => {
    refetch()
  }, [])

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return

    createTaskMutation({
      variables: {
        userId,
        input: {
          title: newTaskTitle,
          description: '',
          priority: 3,
          durationMinutes: 30,
        },
      },
    })
    trackEvent('task_created', { title: newTaskTitle })
  }

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    updateTaskStatusMutation({
      variables: {
        taskId,
        status: newStatus,
      },
    })
  }

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'bg-red-100 text-red-800'
    if (priority <= 3) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load tasks</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const tasks = tasksData?.getTasks?.tasks || []
  const filteredTasks = tasks.filter(task =>
    selectedFilter === 'all' || task.status === selectedFilter
  )

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
            <p className="mt-2 text-gray-600">Organize and track your productivity</p>
          </div>

          {/* Task Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Tasks</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex space-x-2">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter(filter)}
                  className="capitalize"
                >
                  {filter.replace('_', ' ')}
                </Button>
              ))}
            </div>
            <Button onClick={() => setShowNewTaskForm(true)}>
              + New Task
            </Button>
          </div>

          {/* New Task Form */}
          {showNewTaskForm && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
                    placeholder="Enter task title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
                    Create Task
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewTaskForm(false)
                      setNewTaskTitle('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.map((task: Task) => (
              <Card key={task.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => handleToggleTask(task.id, task.status)}
                      className="w-5 h-5 text-primary-start rounded focus:ring-primary-start"
                    />
                    <div className="flex-1">
                      <h3 className={`text-lg font-medium ${
                        task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          Priority {task.priority}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        {task.dueAt && (
                          <span className="text-sm text-gray-500">
                            Due: {new Date(task.dueAt).toLocaleDateString()}
                          </span>
                        )}
                        {task.durationMinutes && (
                          <span className="text-sm text-gray-500">
                            {task.durationMinutes}min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
            {filteredTasks.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-gray-500 mb-4">No tasks found.</p>
                <Button onClick={() => setShowNewTaskForm(true)}>
                  Create Your First Task
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}