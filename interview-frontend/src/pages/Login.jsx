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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Mock Interview</h1>
          <p className="text-gray-500 mt-2">{isRegister ? '创建新账号' : '欢迎回来'}</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              !isRegister ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
            onClick={() => { setIsRegister(false); setError('') }}
          >
            登录
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              isRegister ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
            onClick={() => { setIsRegister(true); setError('') }}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
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
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
