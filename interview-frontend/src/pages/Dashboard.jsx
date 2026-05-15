import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { interviewApi } from '../services/interviewApi'
import ProgressChart from '../components/ProgressChart'

export default function Dashboard() {
  const [history, setHistory] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartMode, setChartMode] = useState('byCount')
  const navigate = useNavigate()
  const { username, logout } = useAuthStore()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [historyRes, progressRes] = await Promise.all([
        interviewApi.getHistory(),
        interviewApi.getProgress(),
      ])
      setHistory(historyRes.data || [])
      setProgress(progressRes.data || null)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const statusMap = {
    completed: { text: '已完成', bg: 'bg-green-50 text-green-700', border: 'border-green-100' },
    ongoing: { text: '进行中', bg: 'bg-amber-50 text-amber-700', border: 'border-amber-100' },
    abandoned: { text: '已放弃', bg: 'bg-warm-100 text-charcoal-500', border: 'border-warm-200' },
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-warm-200/50 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="heading-display text-xl font-bold text-charcoal-900 tracking-tight">
            MockForge
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-charcoal-600">欢迎，<span className="font-medium text-charcoal-900">{username}</span></span>
            <Link to="/interview/setup" className="btn-primary text-sm px-4 py-2">开始面试</Link>
            <button onClick={handleLogout} className="btn-secondary text-sm px-4 py-2">退出</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-charcoal-400">加载中...</div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-charcoal-900">进步曲线</h2>
                  </div>
                  <div className="flex bg-warm-100 rounded-xl p-1">
                    <button
                      onClick={() => setChartMode('byCount')}
                      className={`px-4 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                        chartMode === 'byCount'
                          ? 'bg-white text-charcoal-900 shadow-sm font-medium'
                          : 'text-charcoal-500 hover:text-charcoal-700'
                      }`}
                    >
                      按次数
                    </button>
                    <button
                      onClick={() => setChartMode('byDate')}
                      className={`px-4 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                        chartMode === 'byDate'
                          ? 'bg-white text-charcoal-900 shadow-sm font-medium'
                          : 'text-charcoal-500 hover:text-charcoal-700'
                      }`}
                    >
                      按日期
                    </button>
                  </div>
                </div>
                {progress && progress.dates && progress.dates.length > 0 ? (
                  <ProgressChart data={progress} mode={chartMode} />
                ) : (
                  <div className="text-center py-12 text-charcoal-400">
                    暂无数据，完成一次面试后查看进步曲线
                  </div>
                )}
              </div>

              <div className="card animate-fade-in-up" style={{animationDelay: '100ms'}}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-charcoal-900">面试历史</h2>
                </div>
                {history.length === 0 ? (
                  <div className="text-center py-12 text-charcoal-400">
                    暂无面试记录
                    <div className="mt-4">
                      <Link to="/interview/setup" className="btn-primary text-sm">开始第一次面试</Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item, index) => (
                      <div
                        key={item.sessionId}
                        className="flex items-center justify-between p-4 bg-warm-50 rounded-xl hover:bg-warm-100 cursor-pointer transition-colors border border-warm-200/50"
                        style={{animationDelay: `${index * 50}ms`}}
                        onClick={() => navigate(`/interview/report?sessionId=${item.sessionId}`)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-charcoal-900">{item.position}</div>
                          <div className="text-sm text-charcoal-500 mt-1">
                            {item.startedAt ? new Date(item.startedAt).toLocaleString() : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-charcoal-600">
                            {item.completedQuestions}/{item.totalQuestions} 题
                          </span>
                          <span className={`text-sm px-3 py-1 rounded-lg border ${statusMap[item.status]?.bg || 'bg-warm-100'} ${statusMap[item.status]?.border || 'border-warm-200'}`}>
                            {statusMap[item.status]?.text || item.status}
                          </span>
                          {item.overallScore != null && (
                            <span className="text-lg font-bold text-terracotta-600">{item.overallScore}分</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card animate-fade-in-up">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-charcoal-900">快速开始</h3>
                </div>
                <Link to="/interview/setup" className="btn-primary w-full block text-center">
                  开始新面试
                </Link>
              </div>

              <div className="card animate-fade-in-up" style={{animationDelay: '100ms'}}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-charcoal-900">系统设置</h3>
                </div>
                <div className="space-y-2">
                  <Link to="/settings/ai-models" className="btn-secondary w-full block text-center text-sm">
                    AI 模型配置
                  </Link>
                  <Link to="/knowledge-base" className="btn-secondary w-full block text-center text-sm">
                    知识库管理
                  </Link>
                </div>
              </div>

              <div className="card animate-fade-in-up" style={{animationDelay: '200ms'}}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-charcoal-900">统计概览</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-charcoal-500">总面试次数</span>
                    <span className="font-semibold text-charcoal-900">{history.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-charcoal-500">已完成</span>
                    <span className="font-semibold text-charcoal-900">
                      {history.filter((h) => h.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-charcoal-500">平均分</span>
                    <span className="font-semibold text-charcoal-900">
                      {history.filter((h) => h.overallScore != null).length > 0
                        ? (
                            history
                              .filter((h) => h.overallScore != null)
                              .reduce((sum, h) => sum + h.overallScore, 0) /
                            history.filter((h) => h.overallScore != null).length
                          ).toFixed(1)
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
