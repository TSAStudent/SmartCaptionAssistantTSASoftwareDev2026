import { SpeakerType } from '@/types';

const DEFAULT_DEEPGRAM_API_KEY = '36df596043ebbb55da3ac3b2610c0e39e8e3b9e5';

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
}

export interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
}

export interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

export interface DeepgramResponse {
  type: string;
  channel: DeepgramChannel;
  is_final: boolean;
  speech_final: boolean;
  start: number;
  duration: number;
}

export interface DeepgramConfig {
  apiKey: string;
  onTranscript: (transcript: string, speaker: SpeakerType, isFinal: boolean) => void;
  onError: (error: string) => void;
  onConnectionChange: (connected: boolean) => void;
}

export class DeepgramClient {
  private socket: WebSocket | null = null;
  private stream: MediaStream | null = null;
  private config: DeepgramConfig;
  private isConnected = false;
  private isStopped = false;
  private teacherSpeakerId: number | null = null;
  private speakerHistory: Map<number, number> = new Map();
  private audioContext: AudioContext | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;

  constructor(config: DeepgramConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    this.isStopped = false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const wsUrl = new URL('wss://api.deepgram.com/v1/listen');
      wsUrl.searchParams.set('model', 'nova-2');
      wsUrl.searchParams.set('punctuate', 'true');
      wsUrl.searchParams.set('diarize', 'true');
      wsUrl.searchParams.set('interim_results', 'true');
      wsUrl.searchParams.set('utterance_end_ms', '1000');
      wsUrl.searchParams.set('vad_events', 'true');
      wsUrl.searchParams.set('encoding', 'linear16');
      wsUrl.searchParams.set('sample_rate', '16000');

      this.socket = new WebSocket(wsUrl.toString(), ['token', this.config.apiKey]);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.config.onConnectionChange(true);
        this.startRecording();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
        this.config.onError('Connection error with speech recognition service');
      };

      this.socket.onclose = (event) => {
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.config.onConnectionChange(false);
        // Only show error for unexpected closures when we were actually connected
        // Code 1000 = normal closure, 1001 = going away (normal), 1006 = abnormal closure
        // Don't show error for normal closures or when user intentionally stopped
        if (wasConnected && event.code !== 1000 && event.code !== 1001) {
          // Only log to console, don't show user-facing error for connection closures
          console.log('WebSocket closed:', event.code, event.reason || 'No reason provided');
        }
      };
    } catch (error) {
      const err = error as Error;
      if (err.name === 'NotAllowedError') {
        this.config.onError('Microphone permission denied. Please allow microphone access.');
      } else {
        this.config.onError(`Failed to start: ${err.message}`);
      }
      throw error;
    }
  }

  private startRecording(): void {
    if (!this.stream || !this.socket) return;

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.audioSource = this.audioContext.createMediaStreamSource(this.stream);
    this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.audioSource.connect(this.audioProcessor);
    this.audioProcessor.connect(this.audioContext.destination);

    this.audioProcessor.onaudioprocess = (event) => {
      if (this.isStopped) return;
      if (this.socket?.readyState === WebSocket.OPEN) {
        const inputData = event.inputBuffer.getChannelData(0);
        const pcmData = this.floatTo16BitPCM(inputData);
        this.socket.send(pcmData);
      }
    };
  }

  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }

  private handleMessage(data: string): void {
    if (this.isStopped) return;
    try {
      const response: DeepgramResponse = JSON.parse(data);
      
      if (response.type === 'Results' && response.channel?.alternatives?.[0]) {
        const alternative = response.channel.alternatives[0];
        const transcript = alternative.transcript;
        
        if (!transcript || transcript.trim() === '') return;

        const speaker = this.determineSpeaker(alternative.words);
        
        this.config.onTranscript(
          transcript,
          speaker,
          response.is_final && response.speech_final
        );
      }
    } catch (error) {
      console.error('Error parsing Deepgram response:', error);
    }
  }

  private determineSpeaker(words: DeepgramWord[]): SpeakerType {
    if (!words || words.length === 0) return 'unknown';

    const speakerCounts = new Map<number, number>();
    for (const word of words) {
      if (word.speaker !== undefined) {
        speakerCounts.set(word.speaker, (speakerCounts.get(word.speaker) || 0) + 1);
      }
    }

    if (speakerCounts.size === 0) return 'unknown';

    let dominantSpeaker = 0;
    let maxCount = 0;
    for (const [speaker, count] of speakerCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantSpeaker = speaker;
      }
    }

    this.speakerHistory.set(dominantSpeaker, (this.speakerHistory.get(dominantSpeaker) || 0) + 1);

    if (this.teacherSpeakerId === null) {
      this.teacherSpeakerId = dominantSpeaker;
      return 'teacher';
    }

    return dominantSpeaker === this.teacherSpeakerId ? 'teacher' : 'student';
  }

  setTeacherSpeaker(speakerId: number): void {
    this.teacherSpeakerId = speakerId;
  }

  resetTeacherSpeaker(): void {
    this.teacherSpeakerId = null;
    this.speakerHistory.clear();
  }

  stop(): void {
    this.isStopped = true;

    // Tear down audio pipeline first so no more data is captured or sent
    if (this.audioProcessor) {
      try {
        this.audioProcessor.disconnect();
        this.audioProcessor.onaudioprocess = null;
      } catch (_) { /* already disconnected */ }
      this.audioProcessor = null;
    }
    if (this.audioSource) {
      try {
        this.audioSource.disconnect();
      } catch (_) { /* already disconnected */ }
      this.audioSource = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'CloseStream' }));
      }
      this.socket.close();
      this.socket = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.isConnected = false;
  }

  isActive(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }
}

export function getDeepgramApiKey(): string {
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem('deepgramApiKey');
    if (storedKey) return storedKey;
  }
  return DEFAULT_DEEPGRAM_API_KEY;
}

export function setDeepgramApiKey(apiKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('deepgramApiKey', apiKey);
  }
}

export function clearDeepgramApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('deepgramApiKey');
  }
}
