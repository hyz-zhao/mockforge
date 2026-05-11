import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export default function ResumeUploader({ onUpload, uploadedFile }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      alert('仅支持 PDF 和 DOCX 格式')
      return
    }

    setUploading(true)
    try {
      await onUpload(file)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div>
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-500">上传中...</p>
          </div>
        ) : uploadedFile ? (
          <div>
            <div className="text-3xl mb-2">📄</div>
            <p className="text-gray-700 font-medium">{uploadedFile.name}</p>
            <p className="text-sm text-gray-400 mt-1">
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB · 上传成功
            </p>
          </div>
        ) : (
          <div>
            <div className="text-3xl mb-2">📎</div>
            <p className="text-gray-700 font-medium">
              {isDragActive ? '松开鼠标上传文件' : '拖拽简历文件到此处，或点击选择'}
            </p>
            <p className="text-sm text-gray-400 mt-1">支持 PDF、DOCX，最大 10MB</p>
          </div>
        )}
      </div>
    </div>
  )
}
