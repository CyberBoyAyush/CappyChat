// frontend/components/ui/VoiceInputButton.tsx

import { useRef, useState, useEffect } from "react";
import { Mic, MicOff, AlertCircle, Loader2 } from "lucide-react";
import { AudioRecorder, blobToFile, getFileExtension } from "@/lib/audioRecorder";
import { useBYOKStore } from "@/frontend/stores/BYOKStore";

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  className?: string;
  disabled?: boolean;
  onListeningChange?: (isListening: boolean) => void;
  onError?: (error: string) => void;
}

/**
 * VoiceInputButton Component using MediaRecorder + OpenAI Whisper for cross-browser compatibility
 * Works with all modern browsers including Firefox, Chrome, Safari, Edge
 */
export default function VoiceInputButton({
  onResult,
  className = "",
  disabled = false,
  onListeningChange,
  onError,
}: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const { openAIApiKey } = useBYOKStore();

  // Check browser support on component mount
  useEffect(() => {
    const supported = AudioRecorder.isSupported();
    setIsSupported(supported);

    // Check microphone permission if supported
    if (supported && navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(permissionStatus => {
          setHasPermission(permissionStatus.state === 'granted');
          permissionStatus.onchange = () => {
            setHasPermission(permissionStatus.state === 'granted');
          };
        })
        .catch(() => {
          // Permission API not supported, assume permission needed
          setHasPermission(null);
        });
    }
  }, []);

  const handleError = (errorMessage: string) => {
    setListening(false);
    setProcessing(false);
    if (onListeningChange) onListeningChange(false);
    if (onError) {
      onError(errorMessage);
    } else {
      // Fallback to alert if no error handler provided
      alert(errorMessage);
    }
  };

  const getUnsupportedMessage = () => {
    const browserInfo = AudioRecorder.getBrowserInfo();

    if (!AudioRecorder.isSupported()) {
      if (browserInfo.isMobile) {
        return "Voice input requires a modern browser. Please update your browser and try again.";
      }
      return "Voice input is not supported in this browser. Please use a modern browser like Chrome, Firefox, Safari, or Edge.";
    }

    return "Voice input is not available. Please check your browser settings.";
  };

  const processAudioFile = async (audioBlob: Blob) => {
    try {
      setProcessing(true);

      // Convert blob to file
      const mimeType = audioBlob.type || 'audio/webm';
      const extension = getFileExtension(mimeType);
      const audioFile = blobToFile(audioBlob, `voice-input.${extension}`);

      // Create form data for API request
      const formData = new FormData();
      formData.append('audio', audioFile);
      if (openAIApiKey) {
        formData.append('userOpenAIKey', openAIApiKey);
      }

      // Send to speech-to-text API
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Speech recognition failed');
      }

      const result = await response.json();

      if (result.success && result.text) {
        onResult(result.text);
      } else {
        throw new Error('No speech detected in audio');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Speech recognition failed';
      handleError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const startListening = async () => {
    // Check if already recording or processing
    if (listening || processing) {
      return;
    }

    // Check if audio recording is supported
    if (!isSupported) {
      handleError(getUnsupportedMessage());
      return;
    }

    try {
      // Create new audio recorder instance
      audioRecorderRef.current = new AudioRecorder(
        {
          maxDuration: 30000, // 30 seconds max
        },
        {
          onStart: () => {
            setListening(true);
            if (onListeningChange) onListeningChange(true);
          },
          onStop: (audioBlob) => {
            setListening(false);
            if (onListeningChange) onListeningChange(false);
            processAudioFile(audioBlob);
          },
          onError: (error) => {
            handleError(error);
          },
        }
      );

      // Start recording
      await audioRecorderRef.current.startRecording();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice input';
      handleError(errorMessage);
    }
  };

  const stopListening = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stopRecording();
      audioRecorderRef.current = null;
    }

    setListening(false);
    if (onListeningChange) onListeningChange(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.cleanup();
        audioRecorderRef.current = null;
      }
    };
  }, []);

  // Determine button state and styling
  const getButtonProps = () => {
    if (!isSupported) {
      return {
        disabled: true,
        title: "Voice input not supported in this browser",
        className: `p-1.5 rounded-md transition-colors duration-200 bg-gray-400 cursor-not-allowed ${className}`,
        icon: <AlertCircle className="w-4 h-4" />,
      };
    }

    if (hasPermission === false) {
      return {
        disabled: false,
        title: "Microphone access required - click to enable",
        className: `p-1.5 rounded-md transition-colors duration-200 bg-yellow-500 hover:bg-yellow-600 ${className}`,
        icon: <AlertCircle className="w-4 h-4" />,
      };
    }

    if (processing) {
      return {
        disabled: true,
        title: "Processing speech...",
        className: `p-1.5 rounded-md transition-colors duration-200 bg-blue-500 ${className}`,
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
      };
    }

    if (listening) {
      return {
        disabled: false,
        title: "Stop Recording",
        className: `p-1.5 rounded-md transition-colors duration-200 bg-red-500 animate-pulse hover:bg-red-600 ${className}`,
        icon: <MicOff className="w-4 h-4" />,
      };
    }

    return {
      disabled: disabled,
      title: "Start Voice Input",
      className: `p-1.5 rounded-md transition-colors duration-200 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`,
      icon: <Mic className="w-4 h-4" />,
    };
  };

  const buttonProps = getButtonProps();

  return (
    <button
      className={buttonProps.className}
      onClick={listening ? stopListening : startListening}
      title={buttonProps.title}
      type="button"
      disabled={buttonProps.disabled}
    >
      {buttonProps.icon}
    </button>
  );
}
