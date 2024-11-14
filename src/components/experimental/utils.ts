import { Voice } from './types';

export const languages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'ko-KR', name: 'Korean (South Korea)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
];

export const adjustTextAreaHeight = (textAreaRef: React.RefObject<HTMLTextAreaElement>) => {
  if (textAreaRef.current) {
    textAreaRef.current.style.height = 'auto';
    textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
  }
};

export const findVoiceForLanguage = (voices: Voice[], lang: string): Voice | null => {
  return voices.find(voice => voice.lang === lang) || null;
};