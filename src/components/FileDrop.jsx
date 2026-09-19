import { useRef, useState } from 'react'

/** Click-or-drop intake for one file type. Label doubles as the empty state. */
export function FileDrop({ label, accept, value, hint, onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (files) => {
    const file = files?.[0]
    if (file) onFile(file)
  }

  return (
    <>
      <button
        type="button"
        className="filedrop"
        data-dragging={dragging}
        data-loaded={Boolean(value)}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          handleFiles(event.dataTransfer.files)
        }}
      >
        <span className="filedrop__label">{label}</span>
        <span className={`filedrop__value${value ? '' : ' filedrop__value--empty'}`}>
          {value ?? hint}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        aria-label={`${label} file`}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
    </>
  )
}
