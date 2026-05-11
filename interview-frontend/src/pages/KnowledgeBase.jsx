import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { knowledgeApi } from '../services/interviewApi'

export default function KnowledgeBase() {
  const [files, setFiles] = useState([])
  const [fileContent, setFileContent] = useState('')
  const [sources, setSources] = useState([])
  const [selectedSource, setSelectedSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [viewMode, setViewMode] = useState('files')
  const navigate = useNavigate()
  const { username, logout } = useAuthStore()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [filesRes, sourcesRes] = await Promise.all([
        knowledgeApi.getFiles(),
        knowledgeApi.getSources(),
      ])
      setFiles(filesRes.data || [])
      setSources(sourcesRes.data || [])
    } catch (err) {
      console.error('Failed to load knowledge base:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setUploadProgress('正在上传并解析...')
    try {
      const res = await knowledgeApi.upload(file)
      setUploadProgress(`解析成功！共提取 ${res.data} 道题目`)
      loadData()
      setTimeout(() => setUploadProgress(''), 3000)
    } catch (err) {
      setUploadProgress('上传失败：' + (err.message || '未知错误'))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileName) => {
    if (!confirm(`确定删除文件「${fileName}」及其所有题目？`)) return
    try {
      await knowledgeApi.deleteFile(fileName)
      loadData()
      if (selectedSource === fileName) {
        setSelectedSource('')
        setFileContent('')
      }
    } catch (err) {
      console.error('Failed to delete file:', err)
    }
  }

  const handleViewContent = async (sourceFile) => {
    setSelectedSource(sourceFile)
    setViewMode('content')
    try {
      const res = await knowledgeApi.getContent(sourceFile)
      setFileContent(res.data || '')
    } catch (err) {
      console.error('Failed to load content:', err)
      setFileContent('')
    }
  }

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
          <h1 className="text-2xl font-bold">📚 知识库管理</h1>
          <div className="flex items-center gap-3">
            <label className="btn-primary text-sm px-4 py-2 cursor-pointer">
               上传 MD 文件
              <input
                type="file"
                accept=".md"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {uploadProgress && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            uploadProgress.includes('失败') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
          }`}>
            {uploadProgress}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('files')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              viewMode === 'files' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            文件列表
          </button>
          <button
            onClick={() => setViewMode('content')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              viewMode === 'content' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            内容预览
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中...</div>
        ) : viewMode === 'files' ? (
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="card flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">📄 {file.fileName}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {file.questionCount} 道题目 · {(file.fileSize / 1024).toFixed(1)} KB · {new Date(file.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewContent(file.fileName)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    查看内容
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.fileName)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
            {files.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                暂无知识库文件，点击上方按钮上传 MD 文件
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <select
                value={selectedSource}
                onChange={(e) => handleViewContent(e.target.value)}
                className="input-field w-full max-w-xs"
              >
                <option value="">选择文件查看内容</option>
                {sources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {fileContent ? (
              <div className="card">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                  {fileContent}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                {selectedSource ? '该文件暂无内容' : '请先选择文件'}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
