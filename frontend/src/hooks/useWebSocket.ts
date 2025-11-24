import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useWebSocket(userId?: string) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (userId) {
      const token = localStorage.getItem('token')
      socketRef.current = io('http://localhost:3005', {
        auth: { token },
      })

      socketRef.current.on('connect', () => {
        console.log('Connected to notification WebSocket')
        // Join notification room
        socketRef.current?.emit('join', { userId })
      })

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from notification WebSocket')
      })

      socketRef.current.on('notification', (data) => {
        console.log('New notification:', data)
        // Handle real-time notifications - could trigger toast or update notification list
      })

      socketRef.current.on('joined', (data) => {
        console.log('Joined notification room:', data)
      })
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [userId])

  const emit = (event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data)
    }
  }

  return { socket: socketRef.current, emit }
}