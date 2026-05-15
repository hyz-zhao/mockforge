import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useInterviewStore } from '../stores/interviewStore'
import { interviewApi, positionApi, resumeApi, knowledgeApi } from '../services/interviewApi'
import ResumeUploader from '../components/ResumeUploader'

export default function InterviewSetup() {
  const [positions, setPositions] = useState([])
  const [selectedPosition, setSelectedPosition] = useState('')
  const [isCustomPosition, setIsCustomPosition] = useState(false)
  const [customPosition, setCustomPosition] = useState('')
  const [questionCount, setQuestionCount] = useState(8)
  const [customCount, setCustomCount] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [difficulty, setDifficulty] = useState('mixed')
  const [resumeId, setResumeId] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [sourceType, setSourceType] = useState('database')
  const [knowledgeSources, setKnowledgeSources] = useState([])
  const [selectedKnowledgeSource, setSelectedKnowledgeSource] = useState('')
  const [relevanceCheck, setRelevanceCheck] = useState({ status: 'idle', result: null })
  const [positionNameCheck, setPositionNameCheck] = useState({ status: 'idle', result: null })
  const [interviewMode, setInterviewMode] = useState('qa')
  const navigate = useNavigate()
  const setInterview = useInterviewStore((state) => state.setInterview)

  useEffect(() => {
    loadPositions()
    loadKnowledgeSources()
  }, [])

  const loadPositions = async () => {
    try {
      const res = await positionApi.getAll()
      setPositions(res.data || [])
    } catch (err) {
      console.error('Failed to load positions:', err)
    }
  }

  const loadKnowledgeSources = async () => {
    try {
      const res = await knowledgeApi.getSources()
      setKnowledgeSources(res.data || [])
    } catch (err) {
      console.error('Failed to load knowledge sources:', err)
    }
  }

  const handleUpload = async (file) => {
    setUploadedFile(file)
    try {
      const res = await resumeApi.upload(file)
      setResumeId(res.data.resumeId)
    } catch (err) {
      setError('简历上传失败：' + (err.message || '未知错误'))
    }
  }

  const checkFileRelevance = async (fileName, position) => {
    if (!isCustomPosition || sourceType !== 'knowledge' || !fileName) {
      setRelevanceCheck({ status: 'idle', result: null })
      return
    }
    setRelevanceCheck({ status: 'checking', result: null })
    try {
      const res = await knowledgeApi.checkRelevance(fileName, position)
      setRelevanceCheck({ status: 'done', result: res.data })
    } catch (err) {
      setRelevanceCheck({ status: 'error', result: null })
    }
  }

  let positionCheckTimer = null
  const handleCustomPositionChange = (value) => {
    setCustomPosition(value)
    setPositionNameCheck({ status: 'idle', result: null })

    if (positionCheckTimer) clearTimeout(positionCheckTimer)
    if (!value.trim()) return

    positionCheckTimer = setTimeout(async () => {
      setPositionNameCheck({ status: 'checking', result: null })
      try {
        const res = await knowledgeApi.checkPositionName(value.trim())
        setPositionNameCheck({ status: 'done', result: res.data })
      } catch (err) {
        setPositionNameCheck({ status: 'error', result: null })
      }
    }, 800)
  }

  const handleStartInterview = async () => {
    const position = isCustomPosition ? customPosition.trim() : selectedPosition
    if (!position) {
      setError('请选择或输入岗位')
      return
    }

    if (isCustomPosition && positionNameCheck.status !== 'done') {
      setError('请先等待岗位名称验证完成')
      return
    }

    if (isCustomPosition && !positionNameCheck.result) {
      setError('输入的岗位名称不规范，请输入合理的职业名称')
      return
    }

    if (sourceType === 'knowledge' && !selectedKnowledgeSource) {
      setError('请选择知识库文件')
      return
    }

    if (isCustomPosition && sourceType === 'knowledge' && selectedKnowledgeSource) {
      if (relevanceCheck.status !== 'done' || !relevanceCheck.result) {
        setError('知识库文件内容与岗位无关，请更换文件或选择其他出题来源')
        return
      }
    }

    if (isCustom) {
      const n = parseInt(customCount)
      if (isNaN(n) || n < 1 || n > 60) {
        setError('自定义题数请输入1-60之间的整数')
        return
      }
      setQuestionCount(n)
    }

    setLoading(true)
    setError('')

    try {
      const res = await interviewApi.start({
        position,
        questionCount: isCustom ? parseInt(customCount) : questionCount,
        difficulty,
        resumeId,
        sourceType,
        knowledgeSource: sourceType === 'knowledge' ? selectedKnowledgeSource : null,
        interviewMode,
      })

      setInterview({
        sessionId: res.data.sessionId,
        position: res.data.position,
        interviewMode: res.data.interviewMode,
        totalQuestions: res.data.totalQuestions,
        questions: res.data.questions,
      })

      navigate('/interview/room')
    } catch (err) {
      setError(err.message || '开始面试失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-warm-200/50 px-8 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="heading-display text-2xl font-bold text-charcoal-900 tracking-tight">
            MockForge
          </Link>
          <Link to="/dashboard" className="text-sm text-charcoal-500 hover:text-terracotta-600 transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回控制台
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="heading-display text-4xl font-bold text-charcoal-900 mb-3">
            准备开始面试
          </h1>
          <p className="text-charcoal-500">选择一个岗位，让我们开始模拟面试</p>
        </div>

        <div className="flex justify-center mb-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-terracotta-600' : 'text-charcoal-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= 1 ? 'bg-terracotta-600 text-white' : 'bg-warm-200 text-charcoal-500'}`}>1</div>
              <span className="text-sm font-medium">选择岗位</span>
            </div>
            <div className="w-16 h-px bg-warm-300"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-terracotta-600' : 'text-charcoal-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= 2 ? 'bg-terracotta-600 text-white' : 'bg-warm-200 text-charcoal-500'}`}>2</div>
              <span className="text-sm font-medium">配置</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-charcoal-900">选择目标岗位</h2>
                  <p className="text-sm text-charcoal-500">从预设岗位中选择或自定义</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {positions.map((pos, idx) => (
                  <button
                    key={pos.name}
                    onClick={() => { setSelectedPosition(pos.name); setIsCustomPosition(false) }}
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 animate-fade-in-up ${
                      selectedPosition === pos.name && !isCustomPosition
                        ? 'border-terracotta-500 bg-terracotta-50/50'
                        : 'border-warm-200 hover:border-warm-300 bg-white hover:shadow-warm'
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="font-semibold text-charcoal-900">{pos.name}</div>
                    <div className="text-sm text-charcoal-500 mt-1">{pos.description}</div>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-warm-200">
                <button
                  onClick={() => { setIsCustomPosition(true); setSelectedPosition('') }}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                    isCustomPosition
                      ? 'border-terracotta-500 bg-terracotta-50/50'
                      : 'border-warm-200 hover:border-warm-300 bg-white hover:shadow-warm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-charcoal-900">自定义岗位</div>
                      <div className="text-sm text-charcoal-500">输入任意岗位名称</div>
                    </div>
                  </div>
                </button>
                {isCustomPosition && (
                  <div className="mt-4 animate-fade-in-up">
                    <input
                      type="text"
                      value={customPosition}
                      onChange={(e) => handleCustomPositionChange(e.target.value)}
                      placeholder="例如：Python 后端开发工程师"
                      className="input-field"
                      autoFocus
                    />
                    {positionNameCheck.status === 'checking' && (
                      <p className="text-xs text-terracotta-600 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        正在验证岗位名称...
                      </p>
                    )}
                    {positionNameCheck.status === 'done' && positionNameCheck.result && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        岗位名称有效
                      </p>
                    )}
                    {positionNameCheck.status === 'done' && !positionNameCheck.result && (
                      <p className="text-xs text-red-500 mt-2">
                        请输入合理的职业名称（如"Java开发工程师"）
                      </p>
                    )}
                    {positionNameCheck.status === 'error' && (
                      <p className="text-xs text-red-500 mt-2">验证失败，请重试</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-charcoal-900">上传简历</h2>
                  <p className="text-sm text-charcoal-500">可选，上传后获取个性化题目</p>
                </div>
              </div>
              <ResumeUploader onUpload={handleUpload} uploadedFile={uploadedFile} />
            </div>

            <button
              onClick={() => {
                const position = isCustomPosition ? customPosition.trim() : selectedPosition
                if (!position) { setError('请选择或输入岗位'); return }
                if (isCustomPosition && positionNameCheck.status !== 'done') {
                  setError('请先等待岗位名称验证完成'); return
                }
                if (isCustomPosition && !positionNameCheck.result) {
                  setError('请输入合理的职业名称'); return
                }
                setStep(2)
                setError('')
              }}
              className="btn-primary w-full text-base py-4"
            >
              下一步 →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-charcoal-900">面试配置</h2>
                  <p className="text-sm text-charcoal-500">自定义你的面试体验</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">已选岗位</label>
                  <div className="px-4 py-3 bg-warm-50 rounded-xl text-charcoal-900 font-medium border border-warm-200">
                    {isCustomPosition ? customPosition : selectedPosition}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-3">出题来源</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'database', label: '题库', icon: '📦' },
                      { value: 'knowledge', label: '知识库', icon: '📚' },
                      { value: 'ai_resume', label: 'AI+简历', icon: '✨' },
                    ].map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSourceType(s.value)}
                        className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                          sourceType === s.value
                            ? 'border-terracotta-500 bg-terracotta-50/50'
                            : 'border-warm-200 hover:border-warm-300 bg-white'
                        }`}
                      >
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <div className="text-sm font-medium text-charcoal-900">{s.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {sourceType === 'knowledge' && (
                  <div className="animate-fade-in-up">
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">选择知识库文件</label>
                    <div className="relative">
                      <select
                        value={selectedKnowledgeSource}
                        onChange={(e) => {
                          const fileName = e.target.value
                          setSelectedKnowledgeSource(fileName)
                          checkFileRelevance(fileName, isCustomPosition ? customPosition.trim() : selectedPosition)
                        }}
                        className="select-field pr-10"
                      >
                        <option value="">请选择文件</option>
                        {knowledgeSources.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {knowledgeSources.length === 0 && (
                      <p className="text-xs text-charcoal-400 mt-2">
                        暂无知识库文件，请先到 <Link to="/knowledge-base" className="text-terracotta-600 hover:underline">知识库管理</Link> 上传
                      </p>
                    )}
                    {isCustomPosition && selectedKnowledgeSource && relevanceCheck.status === 'checking' && (
                      <p className="text-xs text-terracotta-600 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        正在检查相关性...
                      </p>
                    )}
                    {isCustomPosition && selectedKnowledgeSource && relevanceCheck.status === 'done' && relevanceCheck.result && (
                      <p className="text-xs text-green-600 mt-2">✓ 文件内容与岗位相关</p>
                    )}
                    {isCustomPosition && selectedKnowledgeSource && relevanceCheck.status === 'done' && !relevanceCheck.result && (
                      <p className="text-xs text-red-500 mt-2">文件内容与岗位无关，请更换文件</p>
                    )}
                  </div>
                )}

                {sourceType === 'ai_resume' && resumeId && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-4 rounded-xl border border-green-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    已关联简历，AI 将结合简历内容出题
                  </div>
                )}
                {sourceType === 'ai_resume' && !resumeId && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    未上传简历，AI 将仅根据岗位出题
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-3">题目数量</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[5, 8, 10, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => { setQuestionCount(n); setIsCustom(false); setCustomCount('') }}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                          !isCustom && questionCount === n
                            ? 'border-terracotta-500 bg-terracotta-50/50 text-terracotta-700'
                            : 'border-warm-200 hover:border-warm-300 bg-white text-charcoal-700'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => { setIsCustom(true); setCustomCount('') }}
                      className={`py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                        isCustom
                          ? 'border-terracotta-500 bg-terracotta-50/50 text-terracotta-700'
                          : 'border-warm-200 hover:border-warm-300 bg-white text-charcoal-700'
                      }`}
                    >
                      自定义
                    </button>
                  </div>
                  {isCustom && (
                    <div className="mt-3 flex items-center gap-3 animate-fade-in-up">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={customCount}
                        onChange={(e) => {
                          const v = e.target.value
                          setCustomCount(v)
                          const n = parseInt(v)
                          if (!isNaN(n) && n >= 1 && n <= 60) {
                            setQuestionCount(n)
                          }
                        }}
                        placeholder="1-60"
                        className="input-field w-28 text-center"
                      />
                      <span className="text-sm text-charcoal-500">题</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-3">面试模式</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'qa', label: '问答模式', desc: '文字输入', icon: '💬' },
                      { value: 'voice', label: '语音模式', desc: '麦克风', icon: '🎙️' },
                      { value: 'video', label: '视频模式', desc: '即将上线', icon: '📹', disabled: true },
                    ].map((m) => (
                      <button
                        key={m.value}
                        onClick={() => !m.disabled && setInterviewMode(m.value)}
                        disabled={m.disabled}
                        className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                          interviewMode === m.value && !m.disabled
                            ? 'border-terracotta-500 bg-terracotta-50/50'
                            : m.disabled
                            ? 'border-warm-100 bg-warm-50/50 cursor-not-allowed opacity-60'
                            : 'border-warm-200 hover:border-warm-300 bg-white'
                        }`}
                      >
                        <div className="text-2xl mb-1">{m.icon}</div>
                        <div className={`text-sm font-medium ${m.disabled ? 'text-charcoal-400' : 'text-charcoal-900'}`}>{m.label}</div>
                        <div className="text-xs text-charcoal-500 mt-0.5">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-3">难度偏好</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'mixed', label: '混合' },
                      { value: 'easy', label: '简单' },
                      { value: 'medium', label: '中等' },
                      { value: 'hard', label: '困难' },
                    ].map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDifficulty(d.value)}
                        className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                          difficulty === d.value
                            ? 'border-terracotta-500 bg-terracotta-50/50 text-terracotta-700'
                            : 'border-warm-200 hover:border-warm-300 bg-white text-charcoal-700'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 animate-fade-in">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                ← 上一步
              </button>
              <button
                onClick={handleStartInterview}
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    准备中...
                  </>
                ) : (
                  '开始面试 🚀'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}