'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'
import { useQuery as useApolloQuery, useMutation as useApolloMutation } from '@apollo/client'

export const dynamic = 'force-dynamic'

const REQUEST_DATA_EXPORT = gql`
  mutation RequestDataExport($userId: String!, $format: String!, $includeSensitive: Boolean!) {
    requestDataExport(userId: $userId, format: $format, includeSensitive: $includeSensitive) {
      requestId
      estimatedCompletion
      status
      downloadUrl
    }
  }
`

const GET_EXPORT_HISTORY = gql`
  query GetExportHistory($userId: String!) {
    getExportHistory(userId: $userId) {
      exports {
        id
        requestedAt
        completedAt
        format
        status
        downloadUrl
        fileSize
        includesSensitive
      }
    }
  }
`

interface ExportRequest {
  id: string
  requestedAt: string
  completedAt?: string
  format: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
  fileSize?: number
  includesSensitive: boolean
}

export default function DataExportPage() {
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'pdf'>('json')
  const [includeSensitive, setIncludeSensitive] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: historyData, refetch: refetchHistory } = useApolloQuery(GET_EXPORT_HISTORY, {
    variables: { userId },
    onError: (error) => {
      console.error('Export history error:', error)
      addToast({
        title: 'Error',
        description: 'Unable to load export history.',
        variant: 'destructive'
      })
    }
  })

  const [requestExportMutation] = useApolloMutation(REQUEST_DATA_EXPORT, {
    onCompleted: (data) => {
      addToast({
        title: 'Export Requested',
        description: `Your data export has been requested. Request ID: ${data.requestDataExport.requestId}`,
      })
      trackEvent('data_export_requested', { format: selectedFormat, includeSensitive })
      refetchHistory()
    },
    onError: (error) => {
      addToast({
        title: 'Export Failed',
        description: 'Failed to request data export.',
        variant: 'destructive'
      })
    },
    onSettled: () => {
      setIsRequesting(false)
    }
  })

  useEffect(() => {
    refetchHistory()
  }, [])

  const handleRequestExport = async () => {
    setIsRequesting(true)
    await requestExportMutation({
      variables: {
        userId,
        format: selectedFormat,
        includeSensitive
      }
    })
  }

  const handleDownload = (exportItem: ExportRequest) => {
    if (exportItem.downloadUrl) {
      window.open(exportItem.downloadUrl, '_blank')
      trackEvent('data_export_downloaded', { exportId: exportItem.id })
    }
  }

  const exportHistory = historyData?.getExportHistory?.exports || []

  const formatOptions = [
    {
      value: 'json' as const,
      label: 'JSON',
      description: 'Complete data in JSON format, best for developers',
      fileSize: '~2-5 MB'
    },
    {
      value: 'csv' as const,
      label: 'CSV',
      description: 'Tabular data format, compatible with spreadsheets',
      fileSize: '~1-3 MB'
    },
    {
      value: 'pdf' as const,
      label: 'PDF Report',
      description: 'Human-readable summary with charts and insights',
      fileSize: '~5-10 MB'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Data Export</h1>
            <p className="mt-2 text-gray-600">Download your LifeOS data for backup, analysis, or portability</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Export Request */}
            <div>
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Request New Export</h2>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Export Format
                    </label>
                    <div className="space-y-3">
                      {formatOptions.map(option => (
                        <div
                          key={option.value}
                          onClick={() => setSelectedFormat(option.value)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedFormat === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{option.label}</h3>
                              <p className="text-sm text-gray-600">{option.description}</p>
                              <p className="text-xs text-gray-500 mt-1">Estimated size: {option.fileSize}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              selectedFormat === option.value
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sensitive Data Option */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="includeSensitive"
                        checked={includeSensitive}
                        onChange={(e) => setIncludeSensitive(e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <label htmlFor="includeSensitive" className="text-sm font-medium text-gray-900">
                          Include Sensitive Data
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          Include financial data, health metrics, and personal notes. This data will be encrypted in the export.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Request Button */}
                  <Button
                    onClick={handleRequestExport}
                    disabled={isRequesting}
                    className="w-full"
                  >
                    {isRequesting ? 'Requesting Export...' : 'Request Data Export'}
                  </Button>

                  <div className="text-sm text-gray-600">
                    <p>• Exports typically take 5-15 minutes to process</p>
                    <p>• You'll receive a notification when ready</p>
                    <p>• Download links expire after 7 days</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export History */}
            <div>
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Export History</h2>
                </CardHeader>
                <CardContent>
                  {exportHistory.length > 0 ? (
                    <div className="space-y-4">
                      {exportHistory.map((exportItem: ExportRequest) => (
                        <div key={exportItem.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {exportItem.format.toUpperCase()} Export
                              </h3>
                              <p className="text-sm text-gray-600">
                                Requested {new Date(exportItem.requestedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                exportItem.status === 'completed' ? 'default' :
                                exportItem.status === 'failed' ? 'destructive' :
                                'secondary'
                              }
                            >
                              {exportItem.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              {exportItem.includesSensitive && (
                                <span className="inline-block mr-2">🔒 Sensitive data included</span>
                              )}
                              {exportItem.fileSize && (
                                <span>{(exportItem.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                              )}
                            </div>
                            {exportItem.status === 'completed' && exportItem.downloadUrl && (
                              <Button
                                size="sm"
                                onClick={() => handleDownload(exportItem)}
                              >
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No export history yet</p>
                      <p className="text-sm text-gray-400 mt-1">Your data exports will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Data Categories Info */}
          <Card className="mt-8">
            <CardHeader>
              <h2 className="text-xl font-semibold">What&apos;s Included in Your Export</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Always Included</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Profile information and preferences</li>
                    <li>• Task lists and completion history</li>
                    <li>• Learning progress and courses</li>
                    <li>• Social connections and interactions</li>
                    <li>• App usage analytics and settings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Optional (Sensitive Data)</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Financial transactions and balances</li>
                    <li>• Health metrics and wearable data</li>
                    <li>• Personal notes and journal entries</li>
                    <li>• Location history and travel data</li>
                    <li>• AI conversation history</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Privacy & Security</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• All exports are encrypted during transfer and storage</li>
                  <li>• Sensitive data is additionally encrypted within the export file</li>
                  <li>• Export files are automatically deleted after 7 days</li>
                  <li>• You can request deletion of your data at any time</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}