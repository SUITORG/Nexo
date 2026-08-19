import { Volume2, VolumeX } from 'lucide-react'

interface Props {
  onSpeak: () => void
  isSpeaking?: boolean
  disabled?: boolean
}

export default function AudioButton({ onSpeak, isSpeaking, disabled }: Props) {
  return (
    <button
      onClick={onSpeak}
      disabled={disabled}
      className="inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed"
      title="Escuchar pronunciación (Espacio)"
    >
      {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
    </button>
  )
}
