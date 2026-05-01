import { useState } from 'react'
import { Upload } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminUploadCv } from '../../services/api'

export default function CV() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { data } = await adminUploadCv(file)
      setResult(data.cv_url)
      setFile(null)
    } catch {
      setError('Upload failed. Ensure the file is a PDF under 5MB.')
    } finally { setUploading(false) }
  }

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-semibold text-accent mb-8">CV / Resume</h1>
      <div className="glass rounded-xl p-8 max-w-md">
        <p className="text-sm text-accent-muted mb-6">
          Upload a PDF to replace the current downloadable CV. The file will always be served as <code className="text-accent bg-surface-2 px-1 rounded">cv.pdf</code>.
        </p>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => { setFile(e.target.files[0]); setResult(null) }}
          className="text-sm text-accent-muted mb-4 block"
        />
        {file && <p className="text-xs text-accent-muted mb-4">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
        {result && (
          <p className="text-sm text-green-400 mb-4">
            Uploaded! <a href={result} target="_blank" rel="noreferrer" className="underline">View CV</a>
          </p>
        )}
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg text-sm hover:bg-accent/90 disabled:opacity-50"
        >
          <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload CV'}
        </button>
      </div>
    </AdminLayout>
  )
}
