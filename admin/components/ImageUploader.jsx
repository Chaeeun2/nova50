import { useRef, useState } from 'react'
import { imageService } from '../services/imageService'
import './ImageUploader.css'

export default function ImageUploader({
  acceptedTypes = 'image/jpeg,image/jpg,image/png,image/webp,image/gif',
  maxFiles = 100,
  multiple = false,
  deferUpload = false,
  onUploadComplete,
  onFilesSelected,
  showPreview = true,
  uploadMetadata = {},
  validateFile,
  uploadFileFn,
  hintText = 'JPG, PNG, WebP, GIF 지원 (최대 2MB)',
  placeholderTitle = '클릭하거나 파일을 끌어 업로드',
}) {
  const fileInputRef = useRef(null)
  const [error, setError] = useState(null)
  const [previewImages, setPreviewImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleSelectedFiles = (selectedFiles) => {
    const files = Array.from(selectedFiles)

    if (!files.length) {
      return
    }

    if (multiple && files.length > maxFiles) {
      setError(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`)
      return
    }

    const runValidate = validateFile || ((file) => imageService.validateImageFile(file))

    try {
      files.forEach((file) => runValidate(file))
      setError(null)

      const previews = files.map((file) => ({
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      }))

      if (showPreview) {
        setPreviewImages((currentPreviews) => {
          currentPreviews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl))
          return previews
        })
      }

      if (onFilesSelected) {
        onFilesSelected({ files, previews })
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (selectionError) {
      setError(selectionError.message || '파일을 선택할 수 없습니다.')
    }
  }

  const uploadFiles = async (selectedFiles) => {
    const files = Array.from(selectedFiles)

    if (!files.length) {
      return
    }

    if (multiple && files.length > maxFiles) {
      setError(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`)
      return
    }

    let previews = []
    setError(null)
    setUploading(true)
    setUploadProgress(0)

    const runValidate = validateFile || ((file) => imageService.validateImageFile(file))
    const runUpload =
      uploadFileFn ||
      ((file, metadata) => imageService.uploadImage(file, metadata))

    try {
      files.forEach((file) => runValidate(file))

      if (showPreview) {
        previews = files.map((file) => ({
          file,
          name: file.name,
          previewUrl: URL.createObjectURL(file),
        }))
        setPreviewImages(previews)
      }

      const metadata = {
        source: 'admin-panel',
        uploadedAt: new Date().toISOString(),
        ...uploadMetadata,
      }

      const result =
        multiple && files.length > 1
          ? await imageService.uploadMultipleImages(files, metadata)
          : await runUpload(files[0], metadata)

      setUploadProgress(100)

      if (onUploadComplete) {
        onUploadComplete(result.images || (multiple ? [result] : result))
      }
    } catch (uploadError) {
      setError(uploadError.message || '파일 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      previews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl))
      setPreviewImages([])

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const processFiles = (selectedFiles) => {
    if (deferUpload) {
      handleSelectedFiles(selectedFiles)
      return
    }

    uploadFiles(selectedFiles)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    processFiles(event.dataTransfer.files)
  }

  return (
    <div className="admin-image-uploader">
      <div
        className={`admin-upload-area ${uploading ? 'uploading' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          fileInputRef.current?.click()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          multiple={multiple}
          disabled={uploading}
          onChange={(event) => processFiles(event.target.files)}
          style={{ display: 'none' }}
        />

        {uploading ? (
          <div className="admin-upload-status">
            <div className="admin-upload-spinner" />
            <p>업로드 중... {uploadProgress}%</p>
            <div className="admin-progress-bar">
              <div className="admin-progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="admin-upload-placeholder">
            <p>{placeholderTitle}</p>
            <small>{hintText}</small>
          </div>
        )}
      </div>

      {error && <div className="admin-upload-error">{error}</div>}

      {showPreview && previewImages.length > 0 && deferUpload && (
        <div className="admin-preview-container">
          <h4>선택된 파일</h4>
          <div className="admin-preview-grid">
            {previewImages.map((preview) => (
              <div className="admin-preview-item" key={preview.previewUrl}>
                <img className="admin-preview-image" src={preview.previewUrl} alt={preview.name} />
                <span className="admin-preview-name">{preview.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPreview && previewImages.length > 0 && !deferUpload && (
        <div className="admin-preview-container">
          <h4>업로드 미리보기</h4>
          <div className="admin-preview-grid">
            {previewImages.map((preview) => (
              <div className="admin-preview-item" key={preview.previewUrl}>
                <img className="admin-preview-image" src={preview.previewUrl} alt={preview.name} />
                <span className="admin-preview-name">{preview.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
