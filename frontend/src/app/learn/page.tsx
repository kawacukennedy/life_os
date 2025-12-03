'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'
import { print } from 'graphql'
import { useQuery as useApolloQuery } from '@apollo/client'

export const dynamic = 'force-dynamic'

const GET_LEARNING_DATA = gql`
  query GetLearningData($userId: String!) {
    getLearningProgress(userId: $userId) {
      userId
      totalCourses
      completedCourses
      totalTimeSpent
      currentStreak
      averageProgress
      courses {
        id
        title
        description
        progress
        totalModules
        completedModules
        estimatedTime
        category
        difficulty
        lastAccessedAt
      }
      recentAchievements {
        id
        title
        description
        earnedAt
        type
      }
    }
  }
`

const GET_LEARNING_RECOMMENDATIONS = gql`
  query GetLearningRecommendations($userId: String!) {
    getLearningRecommendations(userId: $userId) {
      recommendations {
        id
        title
        description
        category
        difficulty
        estimatedTime
        reason
        priority
      }
    }
  }
`

interface Course {
  id: string
  title: string
  description: string
  progress: number
  totalModules: number
  completedModules: number
  estimatedTime: number
  category: string
  difficulty: string
  lastAccessedAt: string
}

interface Achievement {
  id: string
  title: string
  description: string
  earnedAt: string
  type: string
}

interface LearningData {
  userId: string
  totalCourses: number
  completedCourses: number
  totalTimeSpent: number
  currentStreak: number
  averageProgress: number
  courses: Course[]
  recentAchievements: Achievement[]
}

export default function LearnPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: learningData, loading, error, refetch } = useApolloQuery(GET_LEARNING_DATA, {
    variables: { userId },
    onCompleted: (data) => {
      trackEvent('learning_data_loaded', { courses: data?.getLearningProgress?.totalCourses })
    },
    onError: (error) => {
      console.error('Learning data error:', error)
      addToast({
        title: 'Learning Data Error',
        description: 'Unable to load learning data. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const { data: recommendationsData } = useApolloQuery(GET_LEARNING_RECOMMENDATIONS, {
    variables: { userId },
  })

  useEffect(() => {
    refetch()
  }, [])

  const handleStartCourse = (courseId: string, courseTitle: string) => {
    trackEvent('course_started', { courseId, courseTitle })
    addToast({
      title: 'Course Started',
      description: `Started learning: ${courseTitle}`,
    })
  }

  const handleContinueCourse = (courseId: string, courseTitle: string) => {
    trackEvent('course_continued', { courseId, courseTitle })
    addToast({
      title: 'Continuing Course',
      description: `Resuming: ${courseTitle}`,
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
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
          <p className="text-red-600 mb-4">Failed to load learning data</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const data = learningData?.getLearningProgress
  const recommendations = recommendationsData?.getLearningRecommendations?.recommendations || []

  const filteredCourses = data?.courses?.filter((course: any) =>
    selectedCategory === 'all' || course.category === selectedCategory
  ) || []

  const categories: string[] = ['all', ...Array.from(new Set(data?.courses?.map((c: any) => c.category) || [])) as string[]]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Learning Hub</h1>
            <p className="mt-2 text-gray-600">Personalized courses and skill development</p>
          </div>

          {/* Learning Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.totalCourses || 0}</p>
                </div>
                <div className="text-2xl">📚</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{data?.completedCourses || 0}</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Study Streak</p>
                  <p className="text-2xl font-bold text-orange-600">{data?.currentStreak || 0} days</p>
                </div>
                <div className="text-2xl">🔥</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{data?.averageProgress?.toFixed(1) || 0}%</p>
                </div>
                <div className="text-2xl">📈</div>
              </div>
            </Card>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category: string) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Recent Achievements */}
          {data?.recentAchievements && data.recentAchievements.length > 0 && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Recent Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.recentAchievements.map((achievement: Achievement) => (
                  <div key={achievement.id} className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🏆</span>
                      <h3 className="font-medium text-yellow-900">{achievement.title}</h3>
                    </div>
                    <p className="text-yellow-700 text-sm">{achievement.description}</p>
                    <p className="text-yellow-600 text-xs mt-2">
                      Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Course Library */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">My Courses</h2>
              <div className="space-y-4">
                {filteredCourses.map((course: Course) => (
                  <div key={course.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{course.title}</h3>
                      <Badge className={getDifficultyColor(course.difficulty)}>
                        {course.difficulty}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(course.progress)}`}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {course.completedModules}/{course.totalModules} modules • {course.estimatedTime}min
                      </span>
                      <Button
                        size="sm"
                        onClick={() => course.progress > 0
                          ? handleContinueCourse(course.id, course.title)
                          : handleStartCourse(course.id, course.title)
                        }
                      >
                        {course.progress > 0 ? 'Continue' : 'Start'}
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredCourses.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No courses found in this category.</p>
                )}
              </div>
            </Card>

            {/* AI Recommendations */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recommended for You</h2>
              <div className="space-y-4">
                {recommendations.map((rec: any) => (
                  <div key={rec.id} className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-blue-900">{rec.title}</h3>
                      <Badge className={getDifficultyColor(rec.difficulty)}>
                        {rec.difficulty}
                      </Badge>
                    </div>
                    <p className="text-blue-700 text-sm mb-2">{rec.description}</p>
                    <p className="text-blue-600 text-xs mb-3">{rec.reason}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-600">
                        {rec.category} • {rec.estimatedTime}min
                      </span>
                      <Button size="sm" variant="outline">
                        Explore
                      </Button>
                    </div>
                  </div>
                ))}
                {recommendations.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No recommendations available yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}