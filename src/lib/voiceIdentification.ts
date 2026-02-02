import { SpeakerType } from '@/types';

export interface VoiceProfile {
  averageFrequencies: number[];
  dominantFrequency: number;
  energyDistribution: number[];
  sampleCount: number;
}

export interface VoiceComparisonResult {
  similarity: number;
  isTeacher: boolean;
}

const SIMILARITY_THRESHOLD = 0.65;
const FFT_SIZE = 2048;
const FREQUENCY_BINS = 128;

export function createEmptyProfile(): VoiceProfile {
  return {
    averageFrequencies: new Array(FREQUENCY_BINS).fill(0),
    dominantFrequency: 0,
    energyDistribution: new Array(FREQUENCY_BINS).fill(0),
    sampleCount: 0,
  };
}

export function extractVoiceFeatures(
  analyser: AnalyserNode,
  existingProfile?: VoiceProfile
): VoiceProfile {
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(frequencyData);

  const binSize = Math.floor(frequencyData.length / FREQUENCY_BINS);
  const binnedFrequencies: number[] = [];
  
  for (let i = 0; i < FREQUENCY_BINS; i++) {
    let sum = 0;
    for (let j = 0; j < binSize; j++) {
      sum += frequencyData[i * binSize + j];
    }
    binnedFrequencies.push(sum / binSize);
  }

  let maxEnergy = 0;
  let dominantBin = 0;
  for (let i = 0; i < binnedFrequencies.length; i++) {
    if (binnedFrequencies[i] > maxEnergy) {
      maxEnergy = binnedFrequencies[i];
      dominantBin = i;
    }
  }

  const sampleRate = analyser.context.sampleRate;
  const frequencyResolution = sampleRate / FFT_SIZE;
  const dominantFrequency = dominantBin * binSize * frequencyResolution;

  const totalEnergy = binnedFrequencies.reduce((a, b) => a + b, 0);
  const energyDistribution = totalEnergy > 0 
    ? binnedFrequencies.map(f => f / totalEnergy)
    : binnedFrequencies;

  if (existingProfile && existingProfile.sampleCount > 0) {
    const newCount = existingProfile.sampleCount + 1;
    const weight = existingProfile.sampleCount / newCount;
    const newWeight = 1 / newCount;

    return {
      averageFrequencies: existingProfile.averageFrequencies.map(
        (f, i) => f * weight + binnedFrequencies[i] * newWeight
      ),
      dominantFrequency: existingProfile.dominantFrequency * weight + dominantFrequency * newWeight,
      energyDistribution: existingProfile.energyDistribution.map(
        (e, i) => e * weight + energyDistribution[i] * newWeight
      ),
      sampleCount: newCount,
    };
  }

  return {
    averageFrequencies: binnedFrequencies,
    dominantFrequency,
    energyDistribution,
    sampleCount: 1,
  };
}

export function compareVoiceProfiles(
  profile1: VoiceProfile,
  profile2: VoiceProfile
): number {
  if (profile1.sampleCount === 0 || profile2.sampleCount === 0) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < FREQUENCY_BINS; i++) {
    dotProduct += profile1.energyDistribution[i] * profile2.energyDistribution[i];
    norm1 += profile1.energyDistribution[i] * profile1.energyDistribution[i];
    norm2 += profile2.energyDistribution[i] * profile2.energyDistribution[i];
  }

  const cosineSimilarity = norm1 > 0 && norm2 > 0
    ? dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
    : 0;

  const freqDiff = Math.abs(profile1.dominantFrequency - profile2.dominantFrequency);
  const maxFreq = Math.max(profile1.dominantFrequency, profile2.dominantFrequency, 1);
  const frequencySimilarity = 1 - Math.min(freqDiff / maxFreq, 1);

  return cosineSimilarity * 0.7 + frequencySimilarity * 0.3;
}

export function identifySpeaker(
  currentProfile: VoiceProfile,
  teacherProfile: VoiceProfile
): VoiceComparisonResult {
  const similarity = compareVoiceProfiles(currentProfile, teacherProfile);
  
  return {
    similarity,
    isTeacher: similarity >= SIMILARITY_THRESHOLD,
  };
}

export function identifySpeakerType(
  currentProfile: VoiceProfile,
  teacherProfile: VoiceProfile | null
): SpeakerType {
  if (!teacherProfile || teacherProfile.sampleCount === 0) {
    return 'unknown';
  }
  
  const result = identifySpeaker(currentProfile, teacherProfile);
  return result.isTeacher ? 'teacher' : 'student';
}

export function saveTeacherProfile(profile: VoiceProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('teacherVoiceProfile', JSON.stringify(profile));
  }
}

export function loadTeacherProfile(): VoiceProfile | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('teacherVoiceProfile');
    if (saved) {
      try {
        return JSON.parse(saved) as VoiceProfile;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function clearTeacherProfile(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('teacherVoiceProfile');
  }
}

export { SIMILARITY_THRESHOLD, FFT_SIZE, FREQUENCY_BINS };
