import React, { useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { Badge } from './Badge'
import gql from 'graphql-tag'
import { useMutation as useApolloMutation } from '@apollo/client'

const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($taskId: String!, $status: String!) {
    updateTaskStatus(taskId: $taskId, status: $status) {
      id
      status
      completedAt
    }
  }
`

const DELETE_TASK = gql`
  mutation DeleteTask($taskId: String!) {
    deleteTask(taskId: $taskId) {
      success
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

interface TaskListProps {
  tasks: Task[]
  onTaskUpdate: () => void
  onTaskDelete?: (taskId: string) => void
  className?: string
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  className = ''
}) => {
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  const [updateTaskStatusMutation] = useApolloMutation(UPDATE_TASK_STATUS, {
    onCompleted: () => {
      onTaskUpdate()
      setUpdatingTaskId(null)
    },
    onError: (error) => {
      console.error('Update task error:', error)
      setUpdatingTaskId(null)
    }
  })

  const [deleteTaskMutation] = useApolloMutation(DELETE_TASK, {
    onCompleted: () => {
      onTaskUpdate()
    },
    onError: (error) => {
      console.error('Delete task error:', error)
    }
  })

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    setUpdatingTaskId(taskId)
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    updateTaskStatusMutation({
      variables: {
        taskId,
        status: newStatus,
      },
    })
  }

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation({
        variables: { taskId },
      })
      if (onTaskDelete) {
        onTaskDelete(taskId)
      }
    }
  }

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId)
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

  const getStatusOptions = (currentStatus: string) => {
    const options = ['pending', 'in_progress', 'completed']
    return options.filter(option => option !== currentStatus)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {tasks.map((task) => (
        <Card key={task.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <input
                type="checkbox"
                checked={task.status === 'completed'}
                onChange={() => handleToggleTask(task.id, task.status)}
                disabled={updatingTaskId === task.id}
                className="w-5 h-5 text-primary-start rounded focus:ring-primary-start mt-1"
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
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex space-x-1">
                      {task.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Status dropdown */}
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                disabled={updatingTaskId === task.id}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-start"
              >
                <option value={task.status}>{task.status.replace('_', ' ')}</option>
                {getStatusOptions(task.status).map(option => (
                  <option key={option} value={option}>
                    {option.replace('_', ' ')}
                  </option>
                ))}
              </select>
              {/* Delete button */}
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
          <div className="text-sm text-gray-500 mt-2">
            Created: {new Date(task.createdAt).toLocaleDateString()}
            {task.completedAt && (
              <span className="ml-4">
                Completed: {new Date(task.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </Card>
      ))}
      {tasks.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No tasks found.</p>
          <p className="text-sm text-gray-400">Create your first task to get started!</p>
        </Card>
      )}
    </div>
  )
}