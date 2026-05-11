import { useState, useRef } from 'react'
import { speechApi } from '../services/interviewApi'

export default function VoiceRecorder({ onResult }) {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      chunks.current = []

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' })

        setProcessing(true)
        try {
          const res = await speechApi.transcribe(file)
          if (onResult) onResult(res.data)
        } catch (err) {
          console.error('Transcription failed:', err)
          alert('语音识别失败，请重试')
        } finally {
          setProcessing(false)
        }

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.current.start()
      setRecording(true)
    } catch (err) {
      console.error('Microphone access denied:', err)
      alert('请允许麦克风权限以使用语音输入')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
      setRecording(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!recording && !processing && (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0m14 0v1a7 7 0 01-14 0v-1m7-4v5m-4 0h8" />
          </svg>
          语音输入
        </button>
      )}

      {recording && (
        <button
          onClick={stopRecording}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm transition-colors"
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          停止录音
        </button>
      )}

      {processing && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-500 text-sm">
          <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
          识别中...
        </div>
      )}
    </div>
  )
}
