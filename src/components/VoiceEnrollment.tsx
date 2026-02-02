'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Mic, MicOff, Check, X, RefreshCw, Volume2 } from 'lucide-react';
import {
  VoiceProfile,
  createEmptyProfile,
  extractVoiceFeatures,
  saveTeacherProfile,
  clearTeacherProfile,
  FFT_SIZE,
} from '@/lib/voiceIdentification';
import { isFirebaseConfigured } from '@/lib/firebase';
import { setUserTeacherVoiceProfile, clearUserTeacherVoiceProfile } from '@/lib/firebaseUserData';

interface VoiceEnrollmentProps {
  onEnrollmentComplete: (profile: VoiceProfile) => void;
  onSkip: () => void;
  existingProfile: VoiceProfile | null;
}

export function VoiceEnrollment({
  onEnrollmentComplete,
  onSkip,
  existingProfile,
}: VoiceEnrollmentProps) {
  const { data: session } = useSession();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [profile, setProfile] = useState<VoiceProfile | null>(existingProfile);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateAudioLevelRef = useRef<() => void>(() => {});

  const RECORDING_DURATION = 5000;
  const SAMPLE_INTERVAL = 100;

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  useEffect(() => {
    updateAudioLevelRef.current = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);

      animationFrameRef.current = requestAnimationFrame(updateAudioLevelRef.current);
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setRecordingProgress(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);
      let currentProfile = createEmptyProfile();
      let elapsed = 0;

      updateAudioLevelRef.current();

      recordingIntervalRef.current = setInterval(() => {
        elapsed += SAMPLE_INTERVAL;
        setRecordingProgress((elapsed / RECORDING_DURATION) * 100);

        if (analyserRef.current) {
          currentProfile = extractVoiceFeatures(analyserRef.current, currentProfile);
        }

        if (elapsed >= RECORDING_DURATION) {
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
          }
          setIsRecording(false);
          setProfile(currentProfile);
          saveTeacherProfile(currentProfile);
          if (session?.user && isFirebaseConfigured()) {
            const userId = (session.user as { id?: string }).id || session.user.email || '';
            if (userId) setUserTeacherVoiceProfile(userId, currentProfile);
          }
          cleanup();
        }
      }, SAMPLE_INTERVAL);
    } catch (err) {
      setError('Could not access microphone. Please allow microphone permissions.');
      console.error('Microphone access error:', err);
      cleanup();
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    cleanup();
  };

  const resetProfile = async () => {
    setProfile(null);
    setRecordingProgress(0);
    clearTeacherProfile();
    if (session?.user && isFirebaseConfigured()) {
      const userId = (session.user as { id?: string }).id || session.user.email || '';
      if (userId) await clearUserTeacherVoiceProfile(userId);
    }
  };

  const handleConfirm = () => {
    if (profile) {
      onEnrollmentComplete(profile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Teacher Voice Enrollment</h2>
          <p className="text-blue-100 text-sm mt-1">
            Record your voice so the system can identify you as the teacher
          </p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {!profile ? (
            <>
              <div className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center">
                  <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                    style={{
                      transform: isRecording ? `scale(${1 + audioLevel * 0.2})` : 'scale(1)',
                    }}
                  >
                    {isRecording ? (
                      <Mic className="w-16 h-16 text-red-500 animate-pulse" />
                    ) : (
                      <MicOff className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  {isRecording && (
                    <svg className="absolute w-36 h-36 -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="68"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="68"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 68}`}
                        strokeDashoffset={`${2 * Math.PI * 68 * (1 - recordingProgress / 100)}`}
                        className="transition-all duration-100"
                      />
                    </svg>
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-300">
                  {isRecording
                    ? 'Please speak naturally for a few seconds...'
                    : 'Click the button below to start recording your voice'}
                </p>

                {isRecording && (
                  <div className="flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-500" />
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{ width: `${audioLevel * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!isRecording ? (
                  <>
                    <button
                      onClick={startRecording}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all"
                    >
                      <Mic className="w-5 h-5" />
                      Start Recording
                    </button>
                    <button
                      onClick={onSkip}
                      className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
                    >
                      Skip
                    </button>
                  </>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="w-16 h-16 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Voice Profile Saved!
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {profile.sampleCount} samples collected
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetProfile}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Re-record
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all"
                >
                  <Check className="w-5 h-5" />
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
