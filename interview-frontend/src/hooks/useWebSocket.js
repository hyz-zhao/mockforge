import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

export function useWebSocket(sessionId, onMessage) {
  const ws = useRef(null)
  const reconnectTimer = useRef(null)
  const onMessageRef = useRef(onMessage)
  const [connected, setConnected] = useState(false)
  const token = useAuthStore((state) => state.token)
  const maxReconnect = 5
  const reconnectCount = useRef(0)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const connect = useCallback(() => {
    if (!sessionId || !token) return

    const wsUrl = `ws://localhost:8080/ws/interview/${sessionId}?token=${token}`
    console.log('Connecting to WebSocket:', wsUrl)

    try {
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setConnected(true)
        reconnectCount.current = 0
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (onMessageRef.current) onMessageRef.current(data)
        } catch (e) {
          console.error('WebSocket message parse error:', e)
        }
      }

      ws.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        setConnected(false)
        if (!event.wasClean && reconnectCount.current < maxReconnect) {
          reconnectCount.current++
          console.log(`Reconnecting... attempt ${reconnectCount.current}/${maxReconnect}`)
          reconnectTimer.current = setTimeout(() => connect(), 3000)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (e) {
      console.error('WebSocket connection failed:', e)
    }
  }, [sessionId, token])

  const sendMessage = useCallback((data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }, [])

  const close = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
    }
    if (ws.current) {
      ws.current.close(1000, 'User closed')
    }
  }, [])

  useEffect(() => {
    connect()
    return () => close()
  }, [connect, close])

  return { connected, sendMessage, close }
}
