import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../services/interviewApi'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isRegister) {
        await authApi.register(form)
        const res = await authApi.login({ username: form.username, password: form.password })
        setAuth(res.data)
      } else {
        const res = await authApi.login({ username: form.username, password: form.password })
        setAuth(res.data)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || err.response?.data?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 px-4">
      <div className="card w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-terracotta-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="heading-display text-2xl font-bold text-charcoal-900">MockForge</h1>
          <p className="text-charcoal-500 mt-2">{isRegister ? '创建新账号' : '欢迎回来'}</p>
        </div>

        <div className="flex mb-8 bg-warm-100 rounded-xl p-1">
          <button
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              !isRegister ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
            onClick={() => { setIsRegister(false); setError('') }}
          >
            登录
          </button>
          <button
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isRegister ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
            onClick={() => { setIsRegister(true); setError('') }}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">用户名</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="input-field"
              placeholder="请输入用户名"
              required
              minLength={2}
              maxLength={20}
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">邮箱</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="请输入邮箱"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">密码</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="input-field"
              placeholder="请输入密码"
              required
              minLength={6}
              maxLength={20}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100">{error}</div>
          )}

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
