import { useRef } from 'react'
import { useImages, addImage, deleteImage } from '../../db/hooks/useImages'

interface ImagePasteZoneProps {
  entityType: string
  entityKey: string
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target!.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ImagePasteZone({ entityType, entityKey }: ImagePasteZoneProps) {
  const images = useImages(entityType, entityKey)
  const zoneRef = useRef<HTMLDivElement>(null)

  async function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = Array.from(e.clipboardData.items)
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue
        const dataUrl = await fileToDataUrl(file)
        await addImage(entityType, entityKey, dataUrl)
      }
    }
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const dataUrl = await fileToDataUrl(file)
      await addImage(entityType, entityKey, dataUrl)
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function downloadImage(dataUrl: string, index: number) {
    const ext = dataUrl.split(';')[0].split('/')[1] || 'png'
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `imagen-${index + 1}.${ext}`
    a.click()
  }

  function openImage(dataUrl: string) {
    const [header, base64] = dataUrl.split(',')
    const mimeMatch = header.match(/:(.*?);/)
    if (!mimeMatch) return
    const mime = mimeMatch[1]
    const bytes = atob(base64)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    const blob = new Blob([arr], { type: mime })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Paste / drop zone */}
      <div
        ref={zoneRef}
        tabIndex={0}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="
          flex items-center justify-center
          border border-dashed border-[#3d4b6e] rounded-md
          px-4 py-3 text-xs text-slate-500
          cursor-pointer select-none
          hover:border-slate-500 hover:text-slate-400
          focus:outline-none focus:border-blue-500 focus:text-blue-400
          transition-colors
        "
        onClick={() => zoneRef.current?.focus()}
      >
        📋 Haz clic aquí y pega una imagen (Ctrl+V) o arrástrala
      </div>

      {/* Thumbnail gallery */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={img.id} className="relative group">
              <img
                src={img.data}
                alt="captura"
                className="w-16 h-16 object-cover rounded border border-[#2e3650] cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => openImage(img.data)}
                title="Click para ver a tamaño completo"
              />
              {/* Botón descargar */}
              <button
                type="button"
                onClick={() => downloadImage(img.data, i)}
                className="
                  absolute -top-1.5 -left-1.5
                  w-4 h-4 flex items-center justify-center
                  bg-blue-700 hover:bg-blue-500 text-white rounded-full
                  text-[9px] leading-none
                  opacity-0 group-hover:opacity-100 transition-opacity
                "
                title="Descargar imagen"
              >
                ↓
              </button>
              {/* Botón eliminar */}
              <button
                type="button"
                onClick={() => deleteImage(img.id!)}
                className="
                  absolute -top-1.5 -right-1.5
                  w-4 h-4 flex items-center justify-center
                  bg-red-600 hover:bg-red-500 text-white rounded-full
                  text-[9px] leading-none
                  opacity-0 group-hover:opacity-100 transition-opacity
                "
                title="Eliminar imagen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
