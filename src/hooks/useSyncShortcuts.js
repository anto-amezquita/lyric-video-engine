import { useEffect } from 'react'

const EDITABLE = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function isTyping(target) {
  return EDITABLE.has(target?.tagName) || target?.isContentEditable
}

/**
 * Keyboard sync pass.
 *
 * Space taps the timestamp for the cursor line and steps forward, so a whole
 * song can be synced in one playthrough without leaving the keyboard. It never
 * touches text, so a tap can't disturb a line you already fixed.
 *
 * Play/pause moves to K, because Space is worth more as the tap key. Shortcuts
 * go quiet while a field has focus.
 */
export function useSyncShortcuts({ enabled, engine, lines, cursor, dispatch }) {
  useEffect(() => {
    if (!enabled) return undefined

    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          dispatch({ type: 'stamp-cursor', time: engine.getTime() })
          break
        case 'KeyK':
          event.preventDefault()
          engine.toggle()
          break
        case 'ArrowDown':
          event.preventDefault()
          dispatch({ type: 'move-cursor', delta: 1 })
          break
        case 'ArrowUp':
          event.preventDefault()
          dispatch({ type: 'move-cursor', delta: -1 })
          break
        case 'ArrowRight':
          event.preventDefault()
          engine.nudge(event.shiftKey ? 10 : 2)
          break
        case 'ArrowLeft':
          event.preventDefault()
          engine.nudge(event.shiftKey ? -10 : -2)
          break
        case 'Enter': {
          const time = lines[cursor]?.time
          if (time != null) {
            event.preventDefault()
            engine.seek(time)
          }
          break
        }
        case 'Backspace':
        case 'Delete': {
          const line = lines[cursor]
          if (line) {
            event.preventDefault()
            dispatch({ type: 'set-time', id: line.id, time: null })
          }
          break
        }
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, engine, lines, cursor, dispatch])
}
