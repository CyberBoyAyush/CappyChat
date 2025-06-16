/**
 * Cross-browser audio recording utility using MediaRecorder API
 * Works with all modern browsers including Firefox, Chrome, Safari, Edge
 */

export interface AudioRecorderOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  maxDuration?: number; // in milliseconds
}

export interface AudioRecorderCallbacks {
  onStart?: () => void;
  onStop?: (audioBlob: Blob) => void;
  onError?: (error: string) => void;
  onDataAvailable?: (event: BlobEvent) => void;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private options: AudioRecorderOptions;
  private callbacks: AudioRecorderCallbacks;
  private maxDurationTimer: NodeJS.Timeout | null = null;

  constructor(
    options: AudioRecorderOptions = {},
    callbacks: AudioRecorderCallbacks = {}
  ) {
    this.options = {
      mimeType: this.getSupportedMimeType(),
      audioBitsPerSecond: 128000,
      maxDuration: 30000, // 30 seconds default
      ...options,
    };
    this.callbacks = callbacks;
  }

  /**
   * Get the best supported MIME type for the current browser
   */
  private getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/wav",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback - most browsers support this
    return "audio/webm";
  }

  /**
   * Check if audio recording is supported in the current browser
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof MediaRecorder !== "undefined"
    );
  }

  /**
   * Get browser compatibility information
   */
  static getBrowserInfo() {
    const userAgent = navigator.userAgent.toLowerCase();
    return {
      isChrome: userAgent.includes("chrome") && !userAgent.includes("edg"),
      isFirefox: userAgent.includes("firefox"),
      isSafari: userAgent.includes("safari") && !userAgent.includes("chrome"),
      isEdge: userAgent.includes("edg"),
      isOpera: userAgent.includes("opera") || userAgent.includes("opr"),
      isMobile: /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      ),
    };
  }

  /**
   * Request microphone permission and start recording
   */
  async startRecording(): Promise<void> {
    try {
      // Check if already recording
      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        throw new Error("Recording is already in progress");
      }

      // Clear previous audio chunks
      this.audioChunks = [];

      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      // Create MediaRecorder with the best supported options
      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType: this.options.mimeType,
      };

      // Add bitrate if supported
      if (this.options.audioBitsPerSecond) {
        mediaRecorderOptions.audioBitsPerSecond =
          this.options.audioBitsPerSecond;
      }

      this.mediaRecorder = new MediaRecorder(
        this.mediaStream,
        mediaRecorderOptions
      );

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.callbacks.onDataAvailable?.(event);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      this.mediaRecorder.onerror = (event) => {
        const error = (event as any).error || "Recording error occurred";
        this.handleError(`Recording failed: ${error}`);
      };

      this.mediaRecorder.onstart = () => {
        this.callbacks.onStart?.();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second

      // Set maximum duration timer
      if (this.options.maxDuration) {
        this.maxDurationTimer = setTimeout(() => {
          this.stopRecording();
        }, this.options.maxDuration);
      }
    } catch (error) {
      this.handleError(this.getErrorMessage(error));
    }
  }

  /**
   * Stop recording and process the audio
   */
  stopRecording(): void {
    try {
      // Clear max duration timer
      if (this.maxDurationTimer) {
        clearTimeout(this.maxDurationTimer);
        this.maxDurationTimer = null;
      }

      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        this.mediaRecorder.stop();
      }

      // Stop all media tracks
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }
    } catch (error) {
      this.handleError(`Failed to stop recording: ${error}`);
    }
  }

  /**
   * Handle recording stop and create audio blob
   */
  private handleRecordingStop(): void {
    try {
      if (this.audioChunks.length === 0) {
        this.handleError("No audio data recorded");
        return;
      }

      // Create blob from recorded chunks
      const audioBlob = new Blob(this.audioChunks, {
        type: this.options.mimeType,
      });

      // Check if blob has content
      if (audioBlob.size === 0) {
        this.handleError("Recorded audio is empty");
        return;
      }

      this.callbacks.onStop?.(audioBlob);
    } catch (error) {
      this.handleError(`Failed to process recorded audio: ${error}`);
    }
  }

  /**
   * Handle errors with user-friendly messages
   */
  private handleError(error: string | Error): void {
    const errorMessage = typeof error === "string" ? error : error.message;
    this.callbacks.onError?.(errorMessage);
  }

  /**
   * Get user-friendly error message based on the error type
   */
  private getErrorMessage(error: any): string {
    if (error.name === "NotAllowedError") {
      return "Microphone access denied. Please allow microphone access and try again.";
    }
    if (error.name === "NotFoundError") {
      return "No microphone found. Please connect a microphone and try again.";
    }
    if (error.name === "NotReadableError") {
      return "Microphone is being used by another application. Please close other apps and try again.";
    }
    if (error.name === "OverconstrainedError") {
      return "Microphone constraints not supported. Please try again.";
    }
    if (error.name === "SecurityError") {
      return "Microphone access blocked by security policy. Please check your browser settings.";
    }

    return `Microphone error: ${error.message || "Unknown error occurred"}`;
  }

  /**
   * Check current recording state
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopRecording();
    this.audioChunks = [];
    this.mediaRecorder = null;
  }

  /**
   * Get the current media stream
   */
  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }
}

/**
 * Convert audio blob to File object for API upload
 */
export function blobToFile(blob: Blob, filename: string = "audio.webm"): File {
  return new File([blob], filename, {
    type: blob.type || "audio/webm",
    lastModified: Date.now(),
  });
}

/**
 * Get file extension based on MIME type
 */
export function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/mpeg": "mp3",
  };

  return extensions[mimeType] || "webm";
}
