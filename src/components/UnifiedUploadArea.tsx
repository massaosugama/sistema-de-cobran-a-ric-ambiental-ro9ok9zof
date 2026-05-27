import React, { useState, useRef, DragEvent, ClipboardEvent, useEffect } from 'react'
import {
  Paperclip,
  File as FileIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  CloudUpload,
  Download,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  name: string
  url: string
  type?: string
  caption?: string
  section?: string
}

interface UploadState {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
}

interface UnifiedUploadAreaProps {
  value?: UploadedFile[]
  onChange?: (files: UploadedFile[]) => void
  onRemoveFile?: (index: number, file: UploadedFile) => Promise<boolean> | boolean
  className?: string
}

export function UnifiedUploadArea({
  value = [],
  onChange,
  onRemoveFile,
  className,
}: UnifiedUploadAreaProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadState[]>([])
  const [localFiles, setLocalFiles] = useState<UploadedFile[]>(value || [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const latestFiles = useRef<UploadedFile[]>(value || [])

  useEffect(() => {
    const newFiles = value || []
    setLocalFiles(newFiles)
    latestFiles.current = newFiles
  }, [value])

  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)

  const processFiles = (files: File[]) => {
    const newUploads = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'uploading' as const,
    }))

    setUploads((prev) => [...prev, ...newUploads])

    newUploads.forEach((upload) => {
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += Math.random() * 20 + 10
        if (currentProgress >= 100) {
          currentProgress = 100
          clearInterval(interval)

          setUploads((prev) =>
            prev.map((u) => (u.id === upload.id ? { ...u, progress: 100, status: 'success' } : u)),
          )

          const file = upload.file
          const isImage = file.type.startsWith('image/')

          if (isImage) {
            const reader = new FileReader()
            reader.onload = (e) => {
              const img = new Image()
              img.onload = () => {
                const canvas = document.createElement('canvas')
                const MAX_WIDTH = 800
                const MAX_HEIGHT = 800
                let width = img.width
                let height = img.height

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width
                    width = MAX_WIDTH
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height
                    height = MAX_HEIGHT
                  }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                if (ctx) {
                  ctx.fillStyle = '#FFFFFF'
                  ctx.fillRect(0, 0, width, height)
                  ctx.drawImage(img, 0, 0, width, height)
                }

                const dataUrl = canvas.toDataURL('image/jpeg', 0.6)

                const uploadedFile: UploadedFile = {
                  name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                  url: dataUrl,
                  type: 'image/jpeg',
                }

                const nextFiles = [...latestFiles.current, uploadedFile]
                latestFiles.current = nextFiles
                setLocalFiles(nextFiles)
                onChange?.(nextFiles)

                setTimeout(() => {
                  setUploads((prev) => prev.filter((u) => u.id !== upload.id))
                }, 2000)
              }
              img.src = e.target?.result as string
            }
            reader.readAsDataURL(file)
          } else {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64Url = reader.result as string
              const uploadedFile: UploadedFile = {
                name: file.name,
                url: base64Url,
                type: file.type,
              }

              const nextFiles = [...latestFiles.current, uploadedFile]
              latestFiles.current = nextFiles
              setLocalFiles(nextFiles)
              onChange?.(nextFiles)

              setTimeout(() => {
                setUploads((prev) => prev.filter((u) => u.id !== upload.id))
              }, 2000)
            }
            reader.readAsDataURL(file)
          }
        } else {
          setUploads((prev) =>
            prev.map((u) => (u.id === upload.id ? { ...u, progress: currentProgress } : u)),
          )
        }
      }, 150)
    })
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault()
      processFiles(Array.from(e.clipboardData.files))
    }
  }

  const handleContainerClick = () => {
    containerRef.current?.focus()
  }

  const handlePaperclipClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const removeFile = async (index: number) => {
    const fileToRemove = latestFiles.current[index]
    if (!fileToRemove) return

    if (onRemoveFile) {
      try {
        const confirmed = await onRemoveFile(index, fileToRemove)
        if (!confirmed) return
      } catch (err) {
        console.error('Error confirming file deletion:', err)
        return
      }
    }

    const newFiles = [...latestFiles.current]
    const actualIndex = newFiles.indexOf(fileToRemove)
    if (actualIndex !== -1) {
      newFiles.splice(actualIndex, 1)
    } else {
      newFiles.splice(index, 1)
    }

    latestFiles.current = newFiles
    setLocalFiles(newFiles)
    onChange?.(newFiles)
  }

  const updateCaption = (index: number, caption: string) => {
    const newFiles = [...latestFiles.current]
    newFiles[index] = { ...newFiles[index], caption }
    latestFiles.current = newFiles
    setLocalFiles(newFiles)
    onChange?.(newFiles)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        ref={containerRef}
        tabIndex={0}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onPaste={onPaste}
        onClick={handleContainerClick}
        className={cn(
          'relative w-full rounded-lg border-2 border-dashed p-6 transition-all duration-200 outline-none cursor-text flex flex-col items-center justify-center gap-2',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-slate-300 bg-slate-50 hover:bg-slate-100',
          isFocused ? 'ring-2 ring-primary ring-offset-2 border-primary bg-primary/5' : '',
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileChange}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10"
          onClick={handlePaperclipClick}
          title="Abrir explorador de arquivos"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <div className="flex flex-col items-center text-center text-slate-500 max-w-[80%] pointer-events-none">
          <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 mb-2">
            <CloudUpload className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">Arraste e solte arquivos aqui</p>
          <p className="text-xs mt-1 text-slate-500">
            Ou clique na área e pressione{' '}
            <kbd className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono">Ctrl+V</kbd>{' '}
            para colar
          </p>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="flex flex-col gap-2">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="bg-white border rounded-md p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate font-medium text-slate-700">{upload.file.name}</span>
                </div>
                {upload.status === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                {upload.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                {upload.status === 'uploading' && (
                  <span className="text-xs text-slate-500 font-medium">
                    {Math.round(upload.progress)}%
                  </span>
                )}
              </div>
              <Progress value={upload.progress} className="h-1.5" />
            </div>
          ))}
        </div>
      )}

      {localFiles.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Anexos ({localFiles.length})
          </span>
          <div className="grid grid-cols-1 gap-3">
            {localFiles.map((file, idx) => {
              const isImage =
                file.type?.startsWith('image/') ||
                file.type === 'image' ||
                file.url?.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i) ||
                file.name?.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i)
              return (
                <div
                  key={idx}
                  className="group relative flex flex-col sm:flex-row items-start gap-3 p-3 bg-white border border-slate-200 rounded-md hover:border-primary/30 transition-colors"
                >
                  <div className="h-32 w-full sm:h-20 sm:w-20 bg-slate-100 rounded flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                    {isImage ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src =
                            'https://img.usecurling.com/p/200/200?q=broken%20link&color=red'
                          e.currentTarget.style.opacity = '0.5'
                        }}
                      />
                    ) : (
                      <FileIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-2 w-full">
                    <p className="text-sm font-semibold text-slate-700 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <Input
                      placeholder="Descrição do anexo (opcional, máx 200 carac.)"
                      maxLength={200}
                      value={file.caption || ''}
                      onChange={(e) => updateCaption(idx, e.target.value)}
                      className="h-8 text-xs bg-slate-50"
                    />
                  </div>
                  <div className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto flex gap-1 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/80 sm:bg-transparent">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-blue-50 shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const link = document.createElement('a')
                        link.href = file.url
                        link.download = file.name || 'download'
                        link.target = '_blank'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                      title="Fazer download"
                    >
                      <Download className="w-4 h-4 pointer-events-none" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        removeFile(idx)
                      }}
                      title="Remover anexo"
                    >
                      <X className="w-4 h-4 pointer-events-none" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
