// frontend/components/ui/VoiceInputButton.tsx

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onerror: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

// Add global type declarations
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  className?: string;
  disabled?: boolean;
  onListeningChange?: (isListening: boolean) => void;
}

/**
 * VoiceInputButton Component for speech recognition
 */
export default function VoiceInputButton({
  onResult,
  className = "",
  disabled = false,
  onListeningChange,
}: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      if (onListeningChange) onListeningChange(false);
      if (onResult) onResult(transcript);
    };

    recognition.onend = () => {
      setListening(false);
      if (onListeningChange) onListeningChange(false);
    };
    recognition.onerror = () => {
      setListening(false);
      if (onListeningChange) onListeningChange(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    if (onListeningChange) onListeningChange(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      if (onListeningChange) onListeningChange(false);
    }
  };

  return (
    <button
      className={`p-1.5 rounded-md transition-colors duration-200 ${
        listening ? "bg-red-500 animate-pulse" : "bg-primary"
      } ${className}`}
      onClick={listening ? stopListening : startListening}
      title={listening ? "Stop Listening" : "Start Voice Input"}
      type="button"
      disabled={disabled}
    >
      {listening ? <MicOff /> : <Mic />}
    </button>
  );
}
