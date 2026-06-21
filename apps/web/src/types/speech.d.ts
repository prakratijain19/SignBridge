// @types/dom-speech-recognition declares the global SpeechRecognition vars but
// does not attach them to the Window interface. Accessing them via `window.`
// (rather than the bare global) is what lets us feature-detect safely without a
// ReferenceError in browsers that lack the API.
export {};

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof webkitSpeechRecognition;
  }
}
