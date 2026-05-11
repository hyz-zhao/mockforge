import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { aiModelApi } from '../services/interviewApi'

const PROVIDER_OPTIONS = [
  { value: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com' },
  { value: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com' },
  { value: 'glm', label: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn' },
  { value: 'qwen', label: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com' },
  { value: 'baidu', label: '文心一言', baseUrl: 'https://aip.baidubce.com' },
  { value: 'moonshot', label: 'Kimi 月之暗面', baseUrl: 'https://api.moonshot.cn' },
  { value: 'minimax', label: 'MiniMax', baseUrl: 'https://api.minimax.chat' },
  { value: 'custom', label: '自定义', baseUrl: '' },
]

export default function AiModelSettings() {
  const [models, setModels] = useState([])
  const [activeModel, setActiveModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '', provider: 'deepseek', modelId: '', apiKey: '', baseUrl: '',
    temperature: 0.7, maxTokens: 4096, sortOrder: 0, remark: '',
  })
  const [formError, setFormError] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const navigate = useNavigate()
  const { username, logout } = useAuthStore()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const modelsRes = await aiModelApi.getAll()
      setModels(modelsRes.data || [])

      try {
        const activeRes = await aiModelApi.getActive()
        setActiveModel(activeRes.data || null)
      } catch {
        setActiveModel(null)
      }
    } catch (err) {
      console.error('Failed to load AI models:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleActivate = async (id) => {
    try {
      await aiModelApi.activate(id)
      loadData()
    } catch (err) {
      console.error('Failed to activate model:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除此模型配置？')) return
    try {
      await aiModelApi.delete(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete model:', err)
    }
  }

  const handleEdit = (model) => {
    setEditingId(model.id)
    setFormData({
      name: model.name,
      provider: model.provider,
      modelId: model.modelId,
      apiKey: model.apiKey,
      baseUrl: model.baseUrl,
      temperature: model.temperature || 0.7,
      maxTokens: model.maxTokens || 4096,
      sortOrder: model.sortOrder || 0,
      remark: model.remark || '',
    })
    setTestResult(null)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      name: '', provider: 'deepseek', modelId: '', apiKey: '', baseUrl: '',
      temperature: 0.7, maxTokens: 4096, sortOrder: 0, remark: '',
    })
    setTestResult(null)
    setShowForm(true)
  }

  const handleProviderChange = (provider) => {
    const opt = PROVIDER_OPTIONS.find((o) => o.value === provider)
    setFormData((prev) => ({
      ...prev,
      provider,
      baseUrl: opt ? opt.baseUrl : prev.baseUrl,
    }))
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    if (!formData.modelId || !formData.apiKey || !formData.baseUrl) {
      setTestResult({ success: false, message: '请先填写模型ID、API Key和API地址' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      await aiModelApi.testConnection(formData)
      setTestResult({ success: true, message: '连接成功！配置有效' })
    } catch (err) {
      setTestResult({ success: false, message: err.message || '连接失败' })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name || !formData.provider || !formData.modelId || !formData.apiKey || !formData.baseUrl) {
      setFormError('请填写所有必填字段')
      return
    }

    try {
      if (editingId) {
        await aiModelApi.update(editingId, formData)
      } else {
        await aiModelApi.create(formData)
      }
      setShowForm(false)
      loadData()
    } catch (err) {
      setFormError(err.message || '操作失败')
    }
  }

  const providerLabels = Object.fromEntries(PROVIDER_OPTIONS.map((o) => [o.value, o.label]))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600">AI Mock Interview</Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">欢迎，{username}</span>
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">← 返回控制台</Link>
            <button onClick={handleLogout} className="btn-secondary text-sm px-4 py-2">退出</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">🤖 AI 模型配置</h1>
          <button onClick={handleAdd} className="btn-primary text-sm px-4 py-2">+ 添加模型</button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中...</div>
        ) : (
          <div className="space-y-3">
            {models.map((model) => (
              <div
                key={model.id}
                className={`card flex items-center justify-between ${
                  model.isActive === 1 ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{model.name}</span>
                    {model.isActive === 1 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">当前使用</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {providerLabels[model.provider] || model.provider} · {model.modelId} · {model.baseUrl}
                  </div>
                  {model.remark && (
                    <div className="text-xs text-gray-400 mt-1">{model.remark}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {model.isActive !== 1 && (
                    <button
                      onClick={() => handleActivate(model.id)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                    >
                      启用
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(model)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    编辑
                  </button>
                  {model.isActive !== 1 && (
                    <button
                      onClick={() => handleDelete(model.id)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
            {models.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                暂无模型配置，点击上方按钮添加
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                {editingId ? '编辑模型' : '添加模型'}
              </h2>

              {formError && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">供应商 *</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="input-field w-full"
                  >
                    {PROVIDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模型名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="如：DeepSeek Chat"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模型ID *</label>
                  <input
                    type="text"
                    value={formData.modelId}
                    onChange={(e) => setFormData((p) => ({ ...p, modelId: e.target.value }))}
                    placeholder="如：deepseek-chat"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key *</label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData((p) => ({ ...p, apiKey: e.target.value }))}
                    placeholder="sk-xxx"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API 地址 *</label>
                  <input
                    type="text"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData((p) => ({ ...p, baseUrl: e.target.value }))}
                    placeholder="https://api.deepseek.com"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className={`w-full py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      testing
                        ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {testing ? '测试中...' : ' 测试连接'}
                  </button>
                  {testResult && (
                    <div className={`mt-2 text-xs p-2 rounded ${
                      testResult.success
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {testResult.success ? '✅' : '❌'} {testResult.message}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={formData.temperature}
                      onChange={(e) => setFormData((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxTokens}
                      onChange={(e) => setFormData((p) => ({ ...p, maxTokens: parseInt(e.target.value) }))}
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData((p) => ({ ...p, sortOrder: parseInt(e.target.value) }))}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <input
                    type="text"
                    value={formData.remark}
                    onChange={(e) => setFormData((p) => ({ ...p, remark: e.target.value }))}
                    placeholder="可选"
                    className="input-field w-full"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary flex-1"
                  >
                    取消
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingId ? '保存' : '添加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
