import { useState, useEffect, useRef } from 'react'

export default function TypewriterText({ text, isTyping = false, speed = 30 }) {
  const [displayedText, setDisplayedText] = useState('')
  const indexRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    setDisplayedText('')
    indexRef.current = 0
  }, [text])

  useEffect(() => {
    if (!text) return

    if (indexRef.current < text.length) {
      timerRef.current = setInterval(() => {
        if (indexRef.current < text.length) {
          setDisplayedText(text.substring(0, indexRef.current + 1))
          indexRef.current++
        } else {
          clearInterval(timerRef.current)
        }
      }, speed)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [text, speed])

  return (
    <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
      {displayedText}
      {isTyping && <span className="typewriter-cursor"></span>}
    </div>
  )
}
