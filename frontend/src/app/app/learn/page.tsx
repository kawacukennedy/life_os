'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { LearningAPI, Course, Progress, LearningStats } from '@/lib/api/learning'

export default function LearningPath() {
  const [courses, setCourses] = useState<Course[]>([])
  const [userProgress, setUserProgress] = useState<Progress[]>([])
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLearningData()
  }, [])

  const loadLearningData = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem('userId') || 'user123' // In real app, get from auth context

      const [coursesData, progressData, statsData] = await Promise.all([
        LearningAPI.getCourses(),
        LearningAPI.getUserProgress(userId),
        LearningAPI.getLearningStats(userId),
      ])

      setCourses(coursesData)
      setUserProgress(progressData)
      setLearningStats(statsData)

      if (coursesData.length > 0) {
        setSelectedCourse(coursesData[0])
      }
    } catch (err) {
      setError('Failed to load learning data')
      console.error('Error loading learning data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCourseProgress = (courseId: string) => {
    const progress = userProgress.find(p => p.courseId === courseId)
    return progress ? progress.progressPercent : 0
  }

  const getNextLesson = (courseId: string) => {
    const progress = userProgress.find(p => p.courseId === courseId)
    return progress?.lastLessonId ? `Continue: ${progress.lastLessonId}` : 'Start Course'
  }

  const handleStartCourse = async (courseId: string) => {
    try {
      const userId = localStorage.getItem('userId') || 'user123'
      await LearningAPI.startCourse(userId, courseId)
      await loadLearningData() // Refresh data
    } catch (err) {
      console.error('Error starting course:', err)
      setError('Failed to start course')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-start mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your learning path...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadLearningData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Learning Path</h1>
            <Button>Explore Courses</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Overall Progress */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Learning Journey</h2>
              <span className="text-sm text-gray-500">
                Overall Progress: {learningStats ? Math.round(learningStats.averageProgress) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-start h-3 rounded-full"
                style={{ width: `${learningStats ? learningStats.averageProgress : 0}%` }}
              ></div>
            </div>
            {learningStats && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{learningStats.totalCourses}</p>
                  <p className="text-sm text-gray-500">Total Courses</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{learningStats.completedCourses}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(learningStats.totalTimeSpent / 60)}h</p>
                  <p className="text-sm text-gray-500">Time Spent</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course List */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Courses</h3>
              <div className="space-y-4">
                {courses.map((course) => {
                  const progress = getCourseProgress(course.id)
                  return (
                    <div
                      key={course.id}
                      className={`bg-white p-4 rounded-lg shadow cursor-pointer transition-colors ${
                        selectedCourse?.id === course.id ? 'ring-2 ring-primary-start' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCourse(course)}
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{course.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-primary-start h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Course Details */}
            <div className="lg:col-span-2">
              {selectedCourse && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{selectedCourse.title}</h3>
                  {selectedCourse.description && (
                    <p className="text-gray-600 mb-4">{selectedCourse.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Category</span>
                      <p className="text-sm text-gray-900 capitalize">{selectedCourse.category}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Total Lessons</span>
                      <p className="text-sm text-gray-900">{selectedCourse.totalLessons}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">{Math.round(getCourseProgress(selectedCourse.id))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-primary-start h-3 rounded-full"
                        style={{ width: `${getCourseProgress(selectedCourse.id)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h4 className="font-medium text-blue-900 mb-2">Next Lesson</h4>
                    <p className="text-blue-800 mb-2">{getNextLesson(selectedCourse.id)}</p>
                    <p className="text-sm text-blue-600">Duration: {selectedCourse.duration} minutes</p>
                  </div>

                  <div className="flex space-x-4">
                    <Button onClick={() => handleStartCourse(selectedCourse.id)}>
                      {getCourseProgress(selectedCourse.id) > 0 ? 'Continue Learning' : 'Start Course'}
                    </Button>
                    <Button variant="outline">View All Lessons</Button>
                  </div>
                </div>
              )}

              {/* Achievements */}
              <div className="bg-white shadow rounded-lg p-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Achievements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {learningStats && learningStats.completedCourses > 0 && (
                    <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-yellow-600">🏆</span>
                      </div>
                      <div>
                        <p className="font-medium text-yellow-900">Courses Completed</p>
                        <p className="text-sm text-yellow-700">{learningStats.completedCourses} courses finished</p>
                      </div>
                    </div>
                  )}
                  {learningStats && learningStats.totalTimeSpent > 300 && ( // More than 5 hours
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-green-600">📚</span>
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Dedicated Learner</p>
                        <p className="text-sm text-green-700">{Math.round(learningStats.totalTimeSpent / 60)} hours of learning</p>
                      </div>
                    </div>
                  )}
                  {learningStats && learningStats.averageProgress > 50 && (
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600">🚀</span>
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Progress Champion</p>
                        <p className="text-sm text-blue-700">{Math.round(learningStats.averageProgress)}% average progress</p>
                      </div>
                    </div>
                  )}
                  {courses.length > 0 && (
                    <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-purple-600">🎯</span>
                      </div>
                      <div>
                        <p className="font-medium text-purple-900">Explorer</p>
                        <p className="text-sm text-purple-700">{courses.length} courses available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}