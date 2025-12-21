import React, { useState } from 'react'
import { Button } from './Button'
import { Card, CardContent, CardHeader } from './Card'
import { Badge } from './Badge'
import { Input } from './Input'

export interface Task {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  duration?: number // in minutes
}

export interface AgendaPanelProps {
  tasks: Task[]
  selectedDate: Date
  onDateChange: (date: Date) => void
  onTaskToggle: (taskId: string) => void
  onTaskAdd: (title: string) => void
  onTaskEdit?: (taskId: string) => void
  className?: string
}

export function AgendaPanel({
  tasks,
  selectedDate,
  onDateChange,
  onTaskToggle,
  onTaskAdd,
  onTaskEdit,
  className = ''
}: AgendaPanelProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onTaskAdd(newTaskTitle.trim())
      setNewTaskTitle('')
      setShowAddForm(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      return task.dueDate.toDateString() === date.toDateString()
    })
  }

  const currentDateTasks = getTasksForDate(selectedDate)
  const completedTasks = currentDateTasks.filter(task => task.completed)
  const pendingTasks = currentDateTasks.filter(task => !task.completed)

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    onDateChange(newDate)
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Agenda</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {formatDate(selectedDate)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>{pendingTasks.length} pending</span>
          <span>{completedTasks.length} completed</span>
        </div>

        {/* Tasks List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {pendingTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onTaskToggle(task.id)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                }`}>
                  {task.title}
                </p>
                {task.duration && (
                  <p className="text-xs text-gray-500">
                    {task.duration} min
                  </p>
                )}
              </div>
              <Badge
                variant={
                  task.priority === 'high' ? 'destructive' :
                  task.priority === 'medium' ? 'default' : 'secondary'
                }
                className="text-xs"
              >
                {task.priority}
              </Badge>
              {onTaskEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTaskEdit(task.id)}
                  className="p-1 h-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
              )}
            </div>
          ))}

          {completedTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg opacity-75"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onTaskToggle(task.id)}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate line-through text-gray-500">
                  {task.title}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                done
              </Badge>
            </div>
          ))}

          {currentDateTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No tasks for this date</p>
            </div>
          )}
        </div>

        {/* Quick Add */}
        <div className="border-t pt-4">
          {showAddForm ? (
            <div className="space-y-2">
              <Input
                placeholder="Enter task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                autoFocus
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewTaskTitle('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}