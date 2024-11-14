export interface Message {
    text: string;
    sender: 'user' | 'bot';
  }
  
  export interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  
  export interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
  }
  
  export interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
    length: number;
  }
  
  export interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }
  
  export interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }
  
  export interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
  }
  
  export interface Voice {
    default: boolean;
    lang: string;
    localService: boolean;
    name: string;
    voiceURI: string;
  }
  
  declare global {
    interface Window {
      SpeechRecognition: new () => SpeechRecognition;
      webkitSpeechRecognition: new () => SpeechRecognition;
    }
  }
  
  export interface Language {
    code: string;
    name: string;
  }