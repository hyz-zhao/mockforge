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
    completed: { text: '已完成', color: 'bg-green-100 text-green-700' },
    ongoing: { text: '进行中', color: 'bg-yellow-100 text-yellow-700' },
    abandoned: { text: '已放弃', color: 'bg-gray-100 text-gray-500' },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600">AI Mock Interview</Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">欢迎，{username}</span>
            <Link to="/interview/setup" className="btn-primary text-sm px-4 py-2">开始面试</Link>
            <button onClick={handleLogout} className="btn-secondary text-sm px-4 py-2">退出</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中...</div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">📈 进步曲线</h2>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setChartMode('byCount')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        chartMode === 'byCount'
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      按次数
                    </button>
                    <button
                      onClick={() => setChartMode('byDate')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        chartMode === 'byDate'
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      按日期
                    </button>
                  </div>
                </div>
                {progress && progress.dates && progress.dates.length > 0 ? (
                  <ProgressChart data={progress} mode={chartMode} />
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    暂无数据，完成一次面试后查看进步曲线
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold mb-4">📝 面试历史</h2>
                {history.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    暂无面试记录
                    <div className="mt-4">
                      <Link to="/interview/setup" className="btn-primary text-sm">开始第一次面试</Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.sessionId}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => navigate(`/interview/report?sessionId=${item.sessionId}`)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.position}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {item.startedAt ? new Date(item.startedAt).toLocaleString() : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            {item.completedQuestions}/{item.totalQuestions} 题
                          </span>
                          <span className={`text-sm px-2 py-1 rounded ${statusMap[item.status]?.color || 'bg-gray-100'}`}>
                            {statusMap[item.status]?.text || item.status}
                          </span>
                          {item.overallScore != null && (
                            <span className="text-lg font-bold text-primary-600">{item.overallScore}分</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="font-semibold mb-3">🎯 快速开始</h3>
                <Link to="/interview/setup" className="btn-primary w-full block text-center">
                  开始新面试
                </Link>
              </div>

              <div className="card">
                <h3 className="font-semibold mb-3">⚙️ 系统设置</h3>
                <div className="space-y-2">
                  <Link to="/settings/ai-models" className="btn-secondary w-full block text-center text-sm">
                    AI 模型配置
                  </Link>
                  <Link to="/knowledge-base" className="btn-secondary w-full block text-center text-sm">
                    知识库管理
                  </Link>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold mb-3">📊 统计概览</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">总面试次数</span>
                    <span className="font-semibold">{history.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">已完成</span>
                    <span className="font-semibold">
                      {history.filter((h) => h.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">平均分</span>
                    <span className="font-semibold">
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
