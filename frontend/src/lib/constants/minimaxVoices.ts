/**
 * MiniMax TTS Voice Options
 * Extended list of available MiniMax voices
 */

export interface MinimaxVoice {
  id: string
  label: string
  gender: 'male' | 'female'
}

export const MINIMAX_VOICES: MinimaxVoice[] = [
  { id: 'mallory', label: 'Mallory', gender: 'female' },
  { id: 'wise_man', label: 'Wise Man', gender: 'male' },
  { id: 'friendly_girl', label: 'Friendly Girl', gender: 'female' },
  { id: 'seraphina', label: 'Seraphina', gender: 'female' },
  { id: 'alex', label: 'Alex', gender: 'male' },
  { id: 'male-qn-qingse', label: 'Qingse', gender: 'male' },
  { id: 'female-shaonv', label: 'Shaonv', gender: 'female' },
  { id: 'male-qn-jingying', label: 'Jingying', gender: 'male' },
  { id: 'female-yujie', label: 'Yujie', gender: 'female' },
  { id: 'male-qn-badao', label: 'Badao', gender: 'male' },
  { id: 'female-chengshu', label: 'Chengshu', gender: 'female' },
]

export const MINIMAX_VOICE_OPTIONS = MINIMAX_VOICES.map((voice) => ({
  value: voice.id,
  label: `${voice.label} (${voice.gender === 'female' ? 'Female' : 'Male'})`,
}))

export const TTS_MODEL_OPTIONS = [
  { value: 'speech-02-turbo', label: 'Speech 02 Turbo (Fast)' },
  { value: 'speech-02-hd', label: 'Speech 02 HD (High Quality)' },
]

export const DEFAULT_VOICE_ID = 'mallory'
export const DEFAULT_TTS_MODEL = 'speech-02-turbo'
