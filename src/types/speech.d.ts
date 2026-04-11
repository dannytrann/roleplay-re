// Ensure Web Speech API types are available globally
// These are part of the DOM spec but sometimes missing in TypeScript builds

interface Window {
  SpeechRecognition: typeof SpeechRecognition
  webkitSpeechRecognition: typeof SpeechRecognition
}
