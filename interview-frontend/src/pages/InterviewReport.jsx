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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-gray-400">正在生成报告...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <Link to="/dashboard" className="btn-primary">返回控制台</Link>
        </div>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600">AI Mock Interview</Link>
          <div className="flex gap-3">
            <Link to="/dashboard" className="btn-secondary text-sm px-4 py-2">控制台</Link>
            <Link to="/interview/setup" className="btn-primary text-sm px-4 py-2">再来一次</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="card text-center">
          <h1 className="text-2xl font-bold mb-2">{report.position} 面试报告</h1>
          <p className="text-gray-500">
            {report.startedAt ? new Date(report.startedAt).toLocaleString() : ''}
            &nbsp;·&nbsp;共 {report.totalQuestions} 题
          </p>
          <div className="mt-6 mb-2">
            <span className="text-6xl font-bold text-primary-600">{report.overallScore}</span>
            <span className="text-2xl text-gray-400 ml-1">分</span>
          </div>
          <div className="text-gray-600">{report.rank}</div>
        </div>

        {report.radarData && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">📊 能力雷达图</h2>
            <RadarChart data={report.radarData} />
          </div>
        )}

        {report.strongPoints && report.strongPoints.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">✅ 优势项</h2>
            <div className="flex flex-wrap gap-2">
              {report.strongPoints.map((point, i) => (
                <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  {point}
                </span>
              ))}
            </div>
          </div>
        )}

        {report.weakPoints && report.weakPoints.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">⚠️ 待提升项</h2>
            <div className="space-y-4">
              {report.weakPoints.map((wp, i) => (
                <div key={i} className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{wp.dimension}</span>
                    <span className="text-lg font-bold text-yellow-600">{wp.score}分</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{wp.analysis}</p>
                  {wp.resources && wp.resources.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {wp.resources.map((r, j) => (
                        <span key={j} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
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
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">💡 学习建议</h2>
            <p className="text-gray-700">{report.nextStepAdvice}</p>
          </div>
        )}

        {report.questionResults && report.questionResults.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">📝 题目回顾</h2>
            <div className="space-y-4">
              {report.questionResults.map((q, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">第 {q.order} 题</span>
                    <span className={`text-lg font-bold ${q.score >= 70 ? 'text-green-600' : q.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {q.score != null ? `${q.score}分` : '-'}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{q.questionText}</p>
                  {q.userAnswer && (
                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-600 mb-2">
                      <span className="text-xs text-gray-400 block mb-1">你的回答：</span>
                      {q.userAnswer}
                    </div>
                  )}
                  {q.standardAnswer && (
                    <div className="bg-green-50 rounded p-3 text-sm text-green-800 mb-2 border border-green-200">
                      <span className="font-medium">标准答案要点：</span>{q.standardAnswer}
                    </div>
                  )}
                  {q.feedback && (
                    <div className="bg-blue-50 rounded p-3 text-sm text-blue-700">
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
