// frontend/components/ui/VoiceInputButton.tsx

import { useRef, useState, useEffect } from "react";
import { Mic, MicOff, AlertCircle, Loader2 } from "lucide-react";
import {
  AudioRecorder,
  blobToFile,
  getFileExtension,
} from "@/lib/audioRecorder";
import { useBYOKStore } from "@/frontend/stores/BYOKStore";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  className?: string;
  disabled?: boolean;
  onListeningChange?: (isListening: boolean) => void;
  onError?: (error: string) => void;
  size?: "sm" | "md" | "lg";
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
  size = "md",
}: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastAudioLevel, setLastAudioLevel] = useState<number>(0);

  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const { openAIApiKey } = useBYOKStore();

  // Check browser support on component mount
  useEffect(() => {
    const supported = AudioRecorder.isSupported();
    setIsSupported(supported);

    // Check microphone permission if supported
    if (supported && navigator.permissions) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permissionStatus) => {
          setHasPermission(permissionStatus.state === "granted");
          permissionStatus.onchange = () => {
            setHasPermission(permissionStatus.state === "granted");
          };
        })
        .catch(() => {
          // Permission API not supported, assume permission needed
          setHasPermission(null);
        });
    }
  }, []);

  // Clean up audio processing resources
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
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

  // Monitor audio levels for visual feedback
  const startAudioLevelMonitoring = (stream: MediaStream) => {
    try {
      // Create audio context and analyzer
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Start monitoring audio levels for visual feedback only
      const checkAudioLevels = () => {
        if (!listening) return;

        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume level for visual feedback
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setLastAudioLevel(average);

        // Continue monitoring
        animationFrameRef.current = requestAnimationFrame(checkAudioLevels);
      };

      // Start checking
      animationFrameRef.current = requestAnimationFrame(checkAudioLevels);
    } catch (error) {
      console.error("Error setting up audio monitoring:", error);
      // Continue without audio level monitoring if it fails
    }
  };

  // Stop audio level monitoring
  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    setLastAudioLevel(0);
  };

  const processAudioFile = async (audioBlob: Blob) => {
    try {
      setProcessing(true);

      // Convert blob to file
      const mimeType = audioBlob.type || "audio/webm";
      const extension = getFileExtension(mimeType);
      const audioFile = blobToFile(audioBlob, `voice-input.${extension}`);

      // Create form data for API request
      const formData = new FormData();
      formData.append("audio", audioFile);
      if (openAIApiKey) {
        formData.append("userOpenAIKey", openAIApiKey);
      }

      // Send to speech-to-text API
      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Speech recognition failed");
      }

      const result = await response.json();

      if (result.success && result.text) {
        onResult(result.text);
      } else {
        throw new Error("No speech detected in audio");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Speech recognition failed";
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

      // Start audio level monitoring if we can access the stream
      const mediaStream = audioRecorderRef.current.getMediaStream();
      if (mediaStream) {
        startAudioLevelMonitoring(mediaStream);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start voice input";
      handleError(errorMessage);
    }
  };

  const stopListening = () => {
    // Stop audio monitoring
    stopAudioLevelMonitoring();

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
      stopAudioLevelMonitoring();
    };
  }, []);

  // Calculate dynamic styles based on audio level and size
  const getSizeStyles = () => {
    const baseSize = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    }[size];

    const iconSize = {
      sm: 16,
      md: 18,
      lg: 20,
    }[size];

    return { baseSize, iconSize };
  };

  const { baseSize, iconSize } = getSizeStyles();

  // Animation styles for when listening
  const pulseStyle = listening
    ? {
        transform: `scale(${1 + Math.min(lastAudioLevel / 200, 0.3)})`,
        boxShadow: `0 0 ${Math.min(lastAudioLevel / 5, 15)}px ${Math.min(
          lastAudioLevel / 10,
          5
        )}px rgba(220, 38, 38, 0.5)`,
      }
    : {};

  // Determine button state and styling
  const getButtonProps = () => {
    if (!isSupported) {
      return {
        disabled: true,
        title: "Voice input not supported in this browser",
        className: cn(
          baseSize,
          "rounded-full flex items-center justify-center transition-all bg-gray-400 cursor-not-allowed",
          className
        ),
        icon: <AlertCircle size={iconSize} />,
      };
    }

    if (hasPermission === false) {
      return {
        disabled: false,
        title: "Microphone access required - click to enable",
        className: cn(
          baseSize,
          "rounded-full flex items-center justify-center transition-all bg-primary hover:bg-primary/60",
          className
        ),
        icon: <Mic size={iconSize} />,
      };
    }

    if (processing) {
      return {
        disabled: true,
        title: "Processing speech...",
        className: cn(
          baseSize,
          "rounded-full flex items-center justify-center transition-all bg-primary/60",
          className
        ),
        icon: <Loader2 size={iconSize} className="animate-spin text-white" />,
      };
    }

    if (listening) {
      return {
        disabled: false,
        title: "Recording... Release to stop",
        className: cn(
          baseSize,
          "rounded-full flex items-center justify-center transition-all bg-primary/60",
          className
        ),
        icon: <MicOff size={iconSize} className="text-white" />,
        style: pulseStyle,
      };
    }

    return {
      disabled: disabled,
      title: "Hold to record voice input",
      className: cn(
        baseSize,
        "rounded-full flex items-center justify-center transition-all bg-primary hover:bg-primary/60 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      ),
      icon: <Mic size={iconSize} className="text-white" />,
    };
  };

  const buttonProps = getButtonProps();

  // Prevent any click events - we only want hold-to-speak
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Do nothing on click - only hold works
  };

  // Handle mouse and touch events for hold-to-speak
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!buttonProps.disabled && !processing && !listening) {
      startListening();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (listening) {
      stopListening();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!buttonProps.disabled && !processing && !listening) {
      startListening();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (listening) {
      stopListening();
    }
  };

  // Handle mouse leave to stop recording if user drags away
  const handleMouseLeave = () => {
    if (listening) {
      stopListening();
    }
  };

  // Handle global mouse up to ensure recording stops even if mouse is released outside button
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (listening) {
        stopListening();
      }
    };

    const handleGlobalTouchEnd = () => {
      if (listening) {
        stopListening();
      }
    };

    if (listening) {
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("touchend", handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [listening]);

  return (
    <button
      className={buttonProps.className}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      title={listening ? "Release to stop recording" : "Hold to record"}
      type="button"
      disabled={buttonProps.disabled}
      style={buttonProps.style}
    >
      {buttonProps.icon}
      {listening && (
        <span className="sr-only">Recording in progress - release to stop</span>
      )}
    </button>
  );
}
