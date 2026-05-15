import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Home() {
  const token = useAuthStore((state) => state.token)

  return (
    <div className="min-h-screen bg-warm-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-warm-200/50 px-8 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="heading-display text-2xl font-bold text-charcoal-900 tracking-tight">
            MockForge
          </Link>
          <div className="flex items-center gap-4">
            {token ? (
              <Link to="/dashboard" className="btn-primary text-sm px-5 py-2.5">控制台</Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm px-5 py-2.5">登录</Link>
                <Link to="/login" className="btn-primary text-sm px-5 py-2.5">注册</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-20 animate-fade-in-up">
          <h1 className="heading-display text-5xl font-bold text-charcoal-900 mb-6 tracking-tight">
            告别面试焦虑
          </h1>
          <p className="text-xl text-charcoal-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            专为大学生打造的面试模拟平台，通过真实场景演练、
            智能评分反馈，帮你快速定位薄弱点，追踪成长曲线
          </p>
          <Link to={token ? '/interview/setup' : '/login'} className="btn-primary text-lg px-12 py-4">
            开始模拟面试
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="card text-center hover:shadow-warm-lg transition-shadow duration-300">
            <div className="w-14 h-14 rounded-2xl bg-terracotta-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-3">智能出题</h3>
            <p className="text-charcoal-500 leading-relaxed">支持上传简历定制化出题，或选择岗位随机组卷，覆盖技术题、行为题、场景题</p>
          </div>
          <div className="card text-center hover:shadow-warm-lg transition-shadow duration-300">
            <div className="w-14 h-14 rounded-2xl bg-terracotta-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-3">实时对话</h3>
            <p className="text-charcoal-500 leading-relaxed">WebSocket 实时对话，AI 逐字输出评分反馈，支持文字和语音输入</p>
          </div>
          <div className="card text-center hover:shadow-warm-lg transition-shadow duration-300">
            <div className="w-14 h-14 rounded-2xl bg-terracotta-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-3">能力分析</h3>
            <p className="text-charcoal-500 leading-relaxed">五维雷达图评分，薄弱点精准定位，学习建议个性化推荐</p>
          </div>
        </div>

        <div className="card">
          <h2 className="heading-display text-2xl font-bold text-center mb-8 text-charcoal-900">支持的岗位方向</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {['Java后端工程师', '前端工程师', '数据分析师', '产品经理', '算法工程师'].map((pos) => (
              <div key={pos} className="bg-terracotta-50 text-terracotta-700 rounded-xl py-3 px-4 font-medium hover:bg-terracotta-100 transition-colors cursor-default">
                {pos}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-charcoal-400 text-sm">
        © 2026 MockForge - 专为大学生打造的面试模拟平台
      </footer>
    </div>
  )
}
