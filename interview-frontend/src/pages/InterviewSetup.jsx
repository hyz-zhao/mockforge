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
  const [interviewMode, setInterviewMode] = useState('qa')
  const [knowledgeSources, setKnowledgeSources] = useState([])
  const [selectedKnowledgeSource, setSelectedKnowledgeSource] = useState('')
  const [relevanceCheck, setRelevanceCheck] = useState({ status: 'idle', result: null })
  const [positionNameCheck, setPositionNameCheck] = useState({ status: 'idle', result: null })
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600">AI Mock Interview</Link>
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">← 返回控制台</Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-center mb-8">准备面试</h1>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <span className="text-sm text-gray-500">选择岗位</span>
            <div className="w-12 h-px bg-gray-300 mx-2"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            <span className="text-sm text-gray-500">配置面试</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">📋 选择面试岗位</h2>
              <div className="grid grid-cols-2 gap-3">
                {positions.map((pos) => (
                  <button
                    key={pos.name}
                    onClick={() => { setSelectedPosition(pos.name); setIsCustomPosition(false) }}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedPosition === pos.name && !isCustomPosition
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{pos.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{pos.description}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setIsCustomPosition(true); setSelectedPosition('') }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                    isCustomPosition
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">✏️ 自定义岗位</div>
                  <div className="text-sm text-gray-500 mt-1">输入任意岗位名称</div>
                </button>
                {isCustomPosition && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={customPosition}
                      onChange={(e) => handleCustomPositionChange(e.target.value)}
                      placeholder="请输入岗位名称，如：Python开发工程师"
                      className="input-field w-full"
                      autoFocus
                    />
                    {positionNameCheck.status === 'checking' && (
                      <p className="text-xs text-blue-500 mt-1"> 正在验证岗位名称...</p>
                    )}
                    {positionNameCheck.status === 'done' && positionNameCheck.result && (
                      <p className="text-xs text-green-600 mt-1">✅ 岗位名称有效</p>
                    )}
                    {positionNameCheck.status === 'done' && !positionNameCheck.result && (
                      <p className="text-xs text-red-500 mt-1">❌ 请输入合理的职业名称（如"Java开发工程师"）</p>
                    )}
                    {positionNameCheck.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1">❌ 验证失败，请重试</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4">📄 上传简历（可选）</h2>
              <p className="text-sm text-gray-500 mb-3">上传简历可获取个性化定制题目</p>
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
              className="btn-primary w-full"
            >
              下一步
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">⚙️ 面试配置</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">已选岗位</label>
                  <div className="input-field bg-gray-50">
                    {isCustomPosition ? customPosition : selectedPosition}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">出题来源</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'database', label: '📦 数据库题目' },
                      { value: 'knowledge', label: '📚 知识库' },
                      { value: 'ai_resume', label: '🤖 AI+简历' },
                    ].map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSourceType(s.value)}
                        className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                          sourceType === s.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {sourceType === 'knowledge' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择知识库文件</label>
                    <select
                      value={selectedKnowledgeSource}
                      onChange={(e) => {
                        const fileName = e.target.value
                        setSelectedKnowledgeSource(fileName)
                        checkFileRelevance(fileName, isCustomPosition ? customPosition.trim() : selectedPosition)
                      }}
                      className="input-field w-full"
                    >
                      <option value="">请选择文件</option>
                      {knowledgeSources.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {knowledgeSources.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        暂无知识库文件，请先到 <Link to="/knowledge-base" className="text-primary-600 hover:underline">知识库管理</Link> 上传
                      </p>
                    )}
                    {isCustomPosition && selectedKnowledgeSource && relevanceCheck.status === 'checking' && (
                      <p className="text-xs text-blue-500 mt-1">⏳ 正在检查文件与岗位的相关性...</p>
                    )}
                    {isCustomPosition && selectedKnowledgeSource && relevanceCheck.status === 'done' && relevanceCheck.result && (
                      <p className="text-xs text-green-600 mt-1">✅ 文件内容与岗位相关</p>
                    )}
                    {isCustomPosition && selectedKnowledgeSource && relevanceCheck.status === 'done' && !relevanceCheck.result && (
                      <p className="text-xs text-red-500 mt-1"> 文件内容与岗位无关，请更换文件或选择其他出题来源</p>
                    )}
                    {isCustomPosition && selectedKnowledgeSource && relevanceCheck.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1">❌ 相关性检查失败，请重试</p>
                    )}
                  </div>
                )}

                {sourceType === 'ai_resume' && resumeId && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                    ✅ 已关联简历，AI 将结合简历内容出题
                  </div>
                )}
                {sourceType === 'ai_resume' && !resumeId && (
                  <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                    ⚠️ 未上传简历，AI 将仅根据岗位出题
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">题目数量</label>
                  <div className="flex gap-3 flex-wrap">
                    {[5, 8, 10, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => { setQuestionCount(n); setIsCustom(false); setCustomCount('') }}
                        className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                          !isCustom && questionCount === n
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {n} 题
                      </button>
                    ))}
                    <button
                      onClick={() => { setIsCustom(true); setCustomCount('') }}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        isCustom
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      自定义
                    </button>
                  </div>
                  {isCustom && (
                    <div className="mt-3 flex items-center gap-2">
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
                        placeholder="输入题数（1-60）"
                        className="input-field flex-1"
                      />
                      <span className="text-sm text-gray-500">题</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">面试模式</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'qa', label: '💬 问答模式', desc: '文字输入回答' },
                      { value: 'voice', label: '🎙️ 语音模式', desc: '麦克风语音回答' },
                      { value: 'video', label: '📹 视频模式', desc: '即将上线' },
                    ].map((m) => (
                      <button
                        key={m.value}
                        onClick={() => m.value !== 'video' && setInterviewMode(m.value)}
                        disabled={m.value === 'video'}
                        className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          interviewMode === m.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : m.value === 'video'
                            ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div>{m.label}</div>
                        <div className="text-xs font-normal mt-1 opacity-70">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">难度偏好</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'mixed', label: '混合' },
                      { value: 'easy', label: '简单' },
                      { value: 'medium', label: '中等' },
                      { value: 'hard', label: '困难' },
                    ].map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDifficulty(d.value)}
                        className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                          difficulty === d.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
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
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">上一步</button>
              <button onClick={handleStartInterview} className="btn-primary flex-1" disabled={loading}>
                {loading ? '准备中...' : '开始面试'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
