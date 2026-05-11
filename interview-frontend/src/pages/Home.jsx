import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Home() {
  const token = useAuthStore((state) => state.token)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="flex items-center justify-between px-8 py-4">
        <div className="text-xl font-bold text-primary-600">AI Mock Interview</div>
        <div className="flex gap-4">
          {token ? (
            <Link to="/dashboard" className="btn-primary">控制台</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">登录</Link>
              <Link to="/login" className="btn-primary">注册</Link>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI 驱动的
            <span className="text-primary-600"> 面试模拟系统</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            专为在校大学生打造，通过 AI 模拟真实面试场景，
            智能评分反馈，帮你快速定位薄弱点，追踪成长曲线
          </p>
          <Link to={token ? '/interview/setup' : '/login'} className="btn-primary text-lg px-10 py-3">
            开始模拟面试
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">智能出题</h3>
            <p className="text-gray-600">支持上传简历定制化出题，或选择岗位随机组卷，覆盖技术题、行为题、场景题</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-semibold mb-2">流式对话</h3>
            <p className="text-gray-600">WebSocket 实时对话，AI 逐字输出评分反馈，支持文字和语音输入</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">能力分析</h3>
            <p className="text-gray-600">五维雷达图评分，薄弱点精准定位，学习建议个性化推荐</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-8">支持的岗位方向</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {['Java后端工程师', '前端工程师', '数据分析师', '产品经理', '算法工程师'].map((pos) => (
              <div key={pos} className="bg-primary-50 text-primary-700 rounded-lg py-3 px-4 font-medium">
                {pos}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        © 2026 AI Mock Interview - 专为大学生打造的面试模拟平台
      </footer>
    </div>
  )
}
