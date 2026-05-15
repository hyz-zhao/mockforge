import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { interviewApi } from '../services/interviewApi'
import RadarChart from '../components/RadarChart'

export default function InterviewReport() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionId) {
      navigate('/dashboard')
      return
    }
    loadReport()
  }, [sessionId])

  const loadReport = async () => {
    setLoading(true)
    try {
      const res = await interviewApi.getReport(sessionId)
      setReport(res.data)
    } catch (err) {
      setError(err.message || '报告加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-terracotta-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-charcoal-400">正在生成报告...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="card text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Link to="/dashboard" className="btn-primary">返回控制台</Link>
        </div>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="min-h-screen bg-warm-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-warm-200/50 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="heading-display text-xl font-bold text-charcoal-900 tracking-tight">
            MockForge
          </Link>
          <div className="flex gap-3">
            <Link to="/dashboard" className="btn-secondary text-sm px-4 py-2">控制台</Link>
            <Link to="/interview/setup" className="btn-primary text-sm px-4 py-2">再来一次</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="card text-center animate-fade-in-up">
          <h1 className="heading-display text-2xl font-bold mb-2 text-charcoal-900">{report.position} 面试报告</h1>
          <p className="text-charcoal-500">
            {report.startedAt ? new Date(report.startedAt).toLocaleString() : ''}
            &nbsp;·&nbsp;共 {report.totalQuestions} 题
          </p>
          <div className="mt-6 mb-2">
            <span className="text-6xl font-bold text-terracotta-600">{report.overallScore}</span>
            <span className="text-2xl text-charcoal-400 ml-1">分</span>
          </div>
          <div className="text-charcoal-600">{report.rank}</div>
        </div>

        {report.radarData && (
          <div className="card animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-charcoal-900">能力雷达图</h2>
            </div>
            <RadarChart data={report.radarData} />
          </div>
        )}

        {report.strongPoints && report.strongPoints.length > 0 && (
          <div className="card animate-fade-in-up" style={{animationDelay: '150ms'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-charcoal-900">优势项</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.strongPoints.map((point, i) => (
                <span key={i} className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium border border-green-100">
                  {point}
                </span>
              ))}
            </div>
          </div>
        )}

        {report.weakPoints && report.weakPoints.length > 0 && (
          <div className="card animate-fade-in-up" style={{animationDelay: '200ms'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-charcoal-900">待提升项</h2>
            </div>
            <div className="space-y-4">
              {report.weakPoints.map((wp, i) => (
                <div key={i} className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-charcoal-900">{wp.dimension}</span>
                    <span className="text-lg font-bold text-amber-600">{wp.score}分</span>
                  </div>
                  <p className="text-sm text-charcoal-600 mb-2">{wp.analysis}</p>
                  {wp.resources && wp.resources.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {wp.resources.map((r, j) => (
                        <span key={j} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {report.nextStepAdvice && (
          <div className="card animate-fade-in-up" style={{animationDelay: '250ms'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-charcoal-900">学习建议</h2>
            </div>
            <p className="text-charcoal-700 leading-relaxed">{report.nextStepAdvice}</p>
          </div>
        )}

        {report.questionResults && report.questionResults.length > 0 && (
          <div className="card animate-fade-in-up" style={{animationDelay: '300ms'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-charcoal-900">题目回顾</h2>
            </div>
            <div className="space-y-4">
              {report.questionResults.map((q, i) => (
                <div key={i} className="border border-warm-200 rounded-xl p-5 hover:shadow-warm transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-charcoal-900">第 {q.order} 题</span>
                    <span className={`text-lg font-bold ${q.score >= 70 ? 'text-green-600' : q.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {q.score != null ? `${q.score}分` : '-'}
                    </span>
                  </div>
                  <p className="text-charcoal-700 text-sm mb-3 leading-relaxed">{q.questionText}</p>
                  {q.userAnswer && (
                    <div className="bg-warm-50 rounded-lg p-4 text-sm text-charcoal-600 mb-3 border border-warm-200">
                      <span className="text-xs text-charcoal-400 block mb-1 font-medium">你的回答：</span>
                      {q.userAnswer}
                    </div>
                  )}
                  {q.standardAnswer && (
                    <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800 mb-3 border border-green-200">
                      <span className="font-medium">标准答案要点：</span>{q.standardAnswer}
                    </div>
                  )}
                  {q.feedback && (
                    <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 border border-blue-100">
                      <span className="font-medium">反馈：</span>{q.feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
