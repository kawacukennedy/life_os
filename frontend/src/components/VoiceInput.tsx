import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { Mic, MicOff, Square } from 'lucide-react'

interface VoiceInputProps {
  onTranscript: (transcript: string) => void
  placeholder?: string
  className?: string
}

export default function VoiceInput({ onTranscript, placeholder = "Click to speak...", className = "" }: VoiceInputProps) {
  const { isListening, transcript, startListening, stopListening, clearTranscript } = useVoiceInput()
  const [inputValue, setInputValue] = useState('')

  const handleStartListening = () => {
    startListening()
    setInputValue('')
  }

  const handleStopListening = () => {
    stopListening()
    if (transcript) {
      setInputValue(transcript)
      onTranscript(transcript)
    }
  }

  const handleClear = () => {
    clearTranscript()
    setInputValue('')
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex-1 relative">
        <input
          type="text"
          value={inputValue || (isListening ? 'Listening...' : '')}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-start focus:border-transparent"
          disabled={isListening}
        />
        {isListening && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      <div className="flex space-x-1">
        {!isListening ? (
          <Button
            onClick={handleStartListening}
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
            aria-label="Start voice input"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Speak</span>
          </Button>
        ) : (
          <Button
            onClick={handleStopListening}
            size="sm"
            variant="outline"
            className="flex items-center space-x-1 bg-red-50 border-red-200 hover:bg-red-100"
            aria-label="Stop voice input"
          >
            <Square className="w-4 h-4" />
            <span className="hidden sm:inline">Stop</span>
          </Button>
        )}

        {inputValue && (
          <Button
            onClick={handleClear}
            size="sm"
            variant="ghost"
            aria-label="Clear voice input"
          >
            ✕
          </Button>
        )}
      </div>
    </div>
  )
}