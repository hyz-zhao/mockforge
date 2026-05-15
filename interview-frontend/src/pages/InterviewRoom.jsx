import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterviewStore } from '../stores/interviewStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { speechApi } from '../services/interviewApi'
import TypewriterText from '../components/TypewriterText'

export default function InterviewRoom() {
  const {
    sessionId, position, interviewMode, totalQuestions, currentIndex, currentQuestion,
    evaluations, isFinished, nextQuestion, addEvaluation, finishInterview, reset
  } = useInterviewStore()

  const [answer, setAnswer] = useState('')
  const [streamContent, setStreamContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentEval, setCurrentEval] = useState(null)
  const [waitingForNext, setWaitingForNext] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const chatEndRef = useRef(null)
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])
  const audioContext = useRef(null)
  const analyser = useRef(null)
  const animFrameRef = useRef(null)
  const navigate = useNavigate()

  const handleWsMessage = useCallback((data) => {
    switch (data.type) {
      case 'evaluating':
        setWaitingForNext(true)
        break
      case 'stream_chunk':
        setIsStreaming(true)
        setStreamContent((prev) => prev + (data.content || ''))
        break
      case 'stream_end':
        setIsStreaming(false)
        break
      case 'evaluation':
        setCurrentEval(data)
        addEvaluation(data)
        setWaitingForNext(true)
        setStreamContent('')
        break
      case 'interview_end':
        finishInterview()
        break
      case 'question':
        setCurrentEval(null)
        setWaitingForNext(false)
        setStreamContent('')
        setAnswer('')
        setVoiceText('')
        break
      case 'error':
        console.error('Server error:', data.message)
        break
    }
  }, [addEvaluation, finishInterview])

  const { connected, sendMessage, close } = useWebSocket(sessionId, handleWsMessage)

  useEffect(() => {
    if (!sessionId) {
      navigate('/interview/setup')
    }
  }, [sessionId, navigate])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [streamContent, currentEval])

  const recognitionRef = useRef(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert('您的浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器')
        return
      }

      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.lang = 'zh-CN'
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      let finalTranscript = ''

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        setVoiceText(finalTranscript + interimTranscript)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          alert('语音识别出错: ' + event.error)
        }
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        if (isRecording) {
          try {
            recognitionRef.current.start()
          } catch (e) {
            console.error('Restart failed:', e)
          }
        }
      }

      recognitionRef.current.start()
      setIsRecording(true)
      setVoiceText('')

      audioContext.current = new (window.AudioContext || window.webkitAudioContext)()
      const analyserNode = audioContext.current.createAnalyser()
      analyserNode.fftSize = 256
      analyser.current = analyserNode

      const dataArray = new Uint8Array(analyserNode.frequencyBinCount)
      const updateLevel = () => {
        if (analyserNode) {
          analyserNode.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
          setAudioLevel(avg / 255)
          animFrameRef.current = requestAnimationFrame(updateLevel)
        }
      }
      updateLevel()
    } catch (err) {
      console.error('Microphone access denied:', err)
      alert('请允许麦克风权限以使用语音输入')
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
    if (audioContext.current) {
      audioContext.current.close()
      audioContext.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }
  }

  const handleSubmitAnswer = () => {
    const finalAnswer = interviewMode === 'voice' ? voiceText.trim() : answer.trim()
    if (!finalAnswer || !currentQuestion) return

    sendMessage({
      type: 'answer',
      sessionId: sessionId,
      questionId: currentQuestion.id,
      questionOrder: currentQuestion.order || currentIndex + 1,
      content: finalAnswer,
      inputType: interviewMode === 'voice' ? 'voice' : 'text',
    })

    setAnswer('')
    setVoiceText('')
  }

  const handleNextQuestion = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentEval(null)
      setWaitingForNext(false)
      setStreamContent('')
      setAnswer('')
      setVoiceText('')
      nextQuestion()
      sendMessage({ type: 'next_question' })
    }
  }

  const handleEndInterview = () => {
    sendMessage({ type: 'end_interview' })
    finishInterview()
  }

  useEffect(() => {
    if (isFinished && sessionId) {
      close()
      navigate(`/interview/report?sessionId=${sessionId}`)
    }
  }, [isFinished, sessionId, close, navigate])

  if (!sessionId || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="text-charcoal-400">正在加载面试...</div>
      </div>
    )
  }

  if (interviewMode === 'voice') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
        <nav className="bg-gray-900/80 backdrop-blur border-b border-gray-700 px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-lg font-semibold text-white">{position} 面试</span>
              <span className="ml-3 text-sm text-gray-400">
                第 {currentIndex + 1} / {totalQuestions} 题
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-400">{connected ? '已连接' : '连接中...'}</span>
              <button onClick={handleEndInterview} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors">
                结束面试
              </button>
            </div>
          </div>
        </nav>

        <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-6 flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 mb-4">
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-blue-400">题目 {currentQuestion.order || currentIndex + 1}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">{currentQuestion.category}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">{currentQuestion.difficulty}</span>
              </div>
              <div className="text-white text-lg">{currentQuestion.questionText}</div>
            </div>

            {streamContent && (
              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">AI 正在分析...</div>
                <TypewriterText text={streamContent} isTyping={isStreaming} />
              </div>
            )}

            {currentEval && (
              <div className="bg-gray-800/50 rounded-xl p-5 border border-green-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-green-400">评分结果</span>
                  <span className="text-2xl font-bold text-green-400">{currentEval.overallScore}分</span>
                </div>

                {currentEval.scores && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {Object.entries(currentEval.scores).map(([key, val]) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-semibold text-white">{val}/10</div>
                        <div className="text-xs text-gray-400">
                          {key === 'accuracy' ? '准确性' : key === 'depth' ? '深度' : key === 'fluency' ? '流畅度' : '紧张度'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentEval.standardAnswer && (
                  <div className="bg-gray-700/50 rounded-lg p-4 mb-3 border border-green-700/30">
                    <div className="text-sm font-medium text-green-400 mb-2">标准答案要点</div>
                    <div className="text-gray-300 text-sm whitespace-pre-line">{currentEval.standardAnswer}</div>
                  </div>
                )}

                <div className="bg-gray-700/50 rounded-lg p-4 mb-3 border border-gray-600/50">
                  <div className="text-sm font-medium text-gray-300 mb-2">详细反馈</div>
                  <div className="text-gray-400 text-sm whitespace-pre-line">{currentEval.feedback}</div>
                </div>

                {currentEval.followUp && (
                  <div className="bg-yellow-500/10 rounded-lg p-3 text-sm text-yellow-400 border border-yellow-500/20">
                    <span className="font-medium">追问：</span>{currentEval.followUp}
                  </div>
                )}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            {!waitingForNext ? (
              <div className="space-y-4">
                {voiceText && (
                  <div className="bg-gray-700/50 rounded-lg p-4 text-sm text-gray-300 border border-gray-600/50">
                    <span className="text-xs text-gray-500 block mb-1">语音识别结果：</span>
                    {voiceText}
                  </div>
                )}

                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording
                        ? 'bg-red-500/20 border-4 border-red-500 shadow-lg shadow-red-500/20'
                        : 'bg-gray-700/50 border-4 border-gray-600'
                    }`}>
                      {isRecording && (
                        <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping"></div>
                      )}
                      <svg className={`w-10 h-10 ${isRecording ? 'text-red-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0m14 0v1a7 7 0 01-14 0v-1m7-4v5m-4 0h8" />
                      </svg>
                    </div>
                  </div>

                  {isRecording && (
                    <div className="w-full max-w-xs">
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 transition-all duration-100 rounded-full"
                          style={{ width: `${audioLevel * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-center text-xs text-gray-500 mt-1">正在录音...</div>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                      <span className="text-sm">语音识别中...</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!isRecording && !isProcessing && (
                      <button
                        onClick={startRecording}
                        className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0m14 0v1a7 7 0 01-14 0v-1m7-4v5m-4 0h8" />
                        </svg>
                        开始录音
                      </button>
                    )}

                    {isRecording && (
                      <button
                        onClick={stopRecording}
                        className="px-6 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors"
                      >
                        停止录音
                      </button>
                    )}

                    {voiceText && !isRecording && !isProcessing && (
                      <button
                        onClick={handleSubmitAnswer}
                        className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
                      >
                        提交回答
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">
                  {currentIndex + 1 < totalQuestions ? '点击下一题继续' : '已完成所有题目'}
                </span>
                <div className="flex gap-3">
                  {currentIndex + 1 < totalQuestions && (
                    <button onClick={handleNextQuestion} className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors">
                      下一题 →
                    </button>
                  )}
                  <button onClick={handleEndInterview} className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-colors">
                    结束面试
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-warm-200/50 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-semibold text-charcoal-900">{position} 面试</span>
              <span className="ml-3 text-sm text-charcoal-500">
                第 {currentIndex + 1} / {totalQuestions} 题
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-charcoal-500">{connected ? '已连接' : '连接中...'}</span>
            <button onClick={handleEndInterview} className="btn-secondary text-sm px-3 py-1.5">
              结束面试
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-6 flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 mb-4">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-warm-200/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-terracotta-600">题目 {currentQuestion.order || currentIndex + 1}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-terracotta-50 text-terracotta-700">{currentQuestion.category}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-warm-100 text-charcoal-600">{currentQuestion.difficulty}</span>
            </div>
            <div className="text-charcoal-800 text-lg leading-relaxed">{currentQuestion.questionText}</div>
          </div>

          {streamContent && (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-warm-200/50 animate-fade-in-up">
              <div className="text-sm text-charcoal-400 mb-2">AI 正在分析...</div>
              <TypewriterText text={streamContent} isTyping={isStreaming} />
            </div>
          )}

          {waitingForNext && !streamContent && !currentEval && (
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent"></div>
              <span className="text-amber-700">AI 正在评分中，请稍候...</span>
            </div>
          )}

          {currentEval && (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-green-200/50 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-green-700">评分结果</span>
                <span className="text-3xl font-bold text-green-600">{currentEval.overallScore}分</span>
              </div>

              {currentEval.scores && (
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {Object.entries(currentEval.scores).map(([key, val]) => (
                    <div key={key} className="text-center bg-green-50 rounded-xl p-3">
                      <div className="text-xl font-semibold text-charcoal-900">{val}/10</div>
                      <div className="text-xs text-charcoal-500 mt-1">
                        {key === 'accuracy' ? '准确性' : key === 'depth' ? '深度' : key === 'expression' ? '表达' : '应用'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentEval.standardAnswer && (
                <div className="bg-green-50 rounded-xl p-4 mb-3 border border-green-100">
                  <div className="text-sm font-medium text-green-800 mb-2">标准答案要点</div>
                  <div className="text-charcoal-700 text-sm whitespace-pre-line leading-relaxed">{currentEval.standardAnswer}</div>
                </div>
              )}

              <div className="bg-warm-50 rounded-xl p-4 mb-3 border border-warm-200">
                <div className="text-sm font-medium text-charcoal-700 mb-2">详细反馈</div>
                <div className="text-charcoal-600 text-sm whitespace-pre-line leading-relaxed">{currentEval.feedback}</div>
              </div>

              {currentEval.followUp && (
                <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800 border border-amber-100">
                  <span className="font-medium">追问：</span>{currentEval.followUp}
                </div>
              )}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="bg-white rounded-2xl border border-warm-200/50 p-5 shadow-card">
          {!waitingForNext ? (
            <div className="space-y-4">
              {voiceText && (
                <div className="bg-warm-50 rounded-xl p-4 text-sm text-charcoal-600 border border-warm-200">
                  <span className="text-xs text-charcoal-400 block mb-1 font-medium">语音识别结果：</span>
                  {voiceText}
                </div>
              )}

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="输入你的回答..."
                className="w-full px-4 py-3 border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent resize-none bg-warm-50 text-charcoal-800 placeholder:text-charcoal-400"
                rows={4}
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                      const recorder = new MediaRecorder(stream)
                      const chunks = []
                      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
                      recorder.onstop = async () => {
                        const blob = new Blob(chunks, { type: 'audio/webm' })
                        const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
                        try {
                          const res = await speechApi.transcribe(file)
                          setVoiceText(res.data)
                        } catch (err) {
                          alert('语音识别失败')
                        }
                        stream.getTracks().forEach((track) => track.stop())
                      }
                      recorder.start()
                      setTimeout(() => recorder.stop(), 30000)
                    } catch (err) {
                      alert('请允许麦克风权限')
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-charcoal-700 text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0m14 0v1a7 7 0 01-14 0v-1m7-4v5m-4 0h8" />
                  </svg>
                  语音输入
                </button>
                <button onClick={handleSubmitAnswer} className="btn-primary" disabled={!answer.trim() && !voiceText.trim()}>
                  提交回答
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-charcoal-500">
                {currentIndex + 1 < totalQuestions ? '点击下一题继续' : '已完成所有题目'}
              </span>
              <div className="flex gap-3">
                {currentIndex + 1 < totalQuestions && (
                  <button onClick={handleNextQuestion} className="btn-primary">
                    下一题 →
                  </button>
                )}
                <button onClick={handleEndInterview} className="btn-secondary">
                  结束面试
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
