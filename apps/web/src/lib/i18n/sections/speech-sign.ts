import type { Dict } from '@/lib/i18n/translations';

export const en: Dict = {
  // Speech page
  'speech.title': 'Speech',
  'speech.context': 'Turn speech into text, or type a message and have it spoken aloud.',
  'speech.language': 'Language',
  'speech.newSession': 'New session',
  'speech.saveError': 'Could not save that line. Your transcript may be incomplete.',
  'speech.speakToText': 'Speak → text',
  'speech.sttUnsupported':
    'Live transcription needs Chrome or Edge. You can still type a message and have it spoken below.',
  'speech.startListening': 'Start listening',
  'speech.stopListening': 'Stop listening',
  'speech.listening': 'Listening…',
  'speech.micOff': 'Microphone off',
  'speech.liveTranscript': 'Live transcript',
  'speech.transcriptPlaceholder': 'Press the mic and start speaking — your words appear here.',
  'speech.transcriptUnavailable': 'Transcription is unavailable in this browser.',
  'speech.typeToSpeech': 'Type → speech',
  'speech.ttsUnsupported': 'Text-to-speech isn’t available in this browser.',
  'speech.messageToSpeak': 'Message to speak',
  'speech.messagePlaceholder': 'Type something to say aloud…',
  'speech.speak': 'Speak',
  'speech.stop': 'Stop',
  'speech.speaking': 'Speaking…',
  'speech.noVoice': 'No voice is installed for this language, so a default voice was used.',
  'speech.thisSession': 'This session',
  'speech.noLinesSaved': 'No lines saved yet.',
  'speech.sessionEmpty': 'Start speaking or speak a typed message to begin a session.',
  'speech.modality.spoken': 'Spoken',
  'speech.modality.typed': 'Typed',
  'speech.modality.signed': 'Signed',
  'speech.modality.avatar': 'Avatar',
  // Speech recognition errors
  'speech.error.notSupported': 'Live transcription needs Chrome or Edge.',
  'speech.error.notAllowed':
    'Microphone access is blocked. Allow it in your browser’s site settings, then try again.',
  'speech.error.audioCapture': 'No microphone found. Connect one and try again.',
  'speech.error.noSpeech': 'No speech detected. Press the mic and try again.',
  'speech.error.network': 'Network problem during transcription. Check your connection and retry.',
  'speech.error.default': 'Transcription stopped ({code}). Press the mic to try again.',

  // Sign recognition page
  'sign.title': 'Sign recognition',
  'sign.context': 'Show a sign to your camera and SignBridge will recognize it as text.',
  'sign.collectLink': 'Collect training samples →',
  'sign.camera': 'Camera',
  'sign.startCamera': 'Start camera',
  'sign.stopCamera': 'Stop camera',
  'sign.recognizedSign': 'Recognized sign',
  'sign.watching': 'Watching…',
  'sign.currentBest': 'Current best: {label} · {pct}% confidence',
  'sign.showSign': 'Show a sign to the camera.',
  'sign.pressStart': 'Press Start camera to begin.',
  'sign.thisSession': 'This session',
  'sign.noSignsYet': 'No signs recognized yet.',
  'sign.unsupportedTitle': 'Sign recognition isn’t available here',
  'sign.unsupportedBody':
    'It needs a modern browser with camera support, such as Chrome or Edge on a device with a camera.',
  'sign.notTrainedTitle': 'No recognition model yet',
  'sign.notTrainedBody':
    'A model hasn’t been trained for this app yet. Collect sign samples first, then run the training script to enable live recognition.',
  'sign.collectButton': 'Collect training samples',
  // Camera errors
  'sign.error.notSupported':
    'Live sign recognition needs a modern browser with camera support (Chrome or Edge).',
  'sign.error.cameraDenied':
    'Camera access is blocked. Allow it in your browser’s site settings, then press Start again.',
  'sign.error.noCamera': 'No camera was found. Connect one and try again.',
  'sign.error.default': 'Could not start the camera. Please try again.',

  // Collect samples page
  'signCollect.backToRecognition': 'Back to recognition',
  'signCollect.title': 'Collect sign samples',
  'signCollect.context':
    'Record examples of each sign to train the recognizer. Aim for at least {count} samples per label, across different lighting, angles, and signers.',
  'signCollect.camera': 'Camera',
  'signCollect.startCamera': 'Start camera',
  'signCollect.stopCamera': 'Stop camera',
  'signCollect.handDetected': 'Hand detected',
  'signCollect.noHandDetected': 'No hand detected',
  'signCollect.capture': 'Capture',
  'signCollect.signLabel': 'Sign label',
  'signCollect.sampleCount': '{current} / {total} samples for “{label}”.',
  'signCollect.captureButton': 'Capture',
  'signCollect.captureBurst': 'Capture 5',
  'signCollect.coverage': 'Coverage',
  'signCollect.noHandStatus': 'No hand detected — show your hand to the camera and try again.',
  'signCollect.capturedStatus': 'Captured a sample for “{label}”.',
  'signCollect.saveError': 'Could not save that sample. Please try again.',
  'signCollect.cameraDenied':
    'Camera access is blocked. Allow it in your browser’s site settings, then try again.',
  'signCollect.noCamera': 'No camera was found. Connect one and try again.',
  'signCollect.cameraError': 'Could not start the camera. Please try again.',
};

export const hi: Dict = {
  // Speech page
  'speech.title': 'भाषण',
  'speech.context': 'भाषण को टेक्स्ट में बदलें, या कोई संदेश टाइप करें और उसे ज़ोर से सुनें।',
  'speech.language': 'भाषा',
  'speech.newSession': 'नया सत्र',
  'speech.saveError': 'वह पंक्ति सहेजी नहीं जा सकी। आपका प्रतिलेख अधूरा हो सकता है।',
  'speech.speakToText': 'बोलें → टेक्स्ट',
  'speech.sttUnsupported':
    'लाइव ट्रांसक्रिप्शन के लिए Chrome या Edge आवश्यक है। आप फिर भी नीचे संदेश टाइप करके उसे सुन सकते हैं।',
  'speech.startListening': 'सुनना शुरू करें',
  'speech.stopListening': 'सुनना बंद करें',
  'speech.listening': 'सुन रहा है…',
  'speech.micOff': 'माइक्रोफ़ोन बंद',
  'speech.liveTranscript': 'लाइव प्रतिलेख',
  'speech.transcriptPlaceholder': 'माइक दबाएँ और बोलना शुरू करें — आपके शब्द यहाँ दिखेंगे।',
  'speech.transcriptUnavailable': 'इस ब्राउज़र में ट्रांसक्रिप्शन उपलब्ध नहीं है।',
  'speech.typeToSpeech': 'टाइप करें → भाषण',
  'speech.ttsUnsupported': 'इस ब्राउज़र में टेक्स्ट-टू-स्पीच उपलब्ध नहीं है।',
  'speech.messageToSpeak': 'बोलने के लिए संदेश',
  'speech.messagePlaceholder': 'ज़ोर से कहने के लिए कुछ टाइप करें…',
  'speech.speak': 'बोलें',
  'speech.stop': 'रोकें',
  'speech.speaking': 'बोल रहा है…',
  'speech.noVoice':
    'इस भाषा के लिए कोई आवाज़ स्थापित नहीं है, इसलिए डिफ़ॉल्ट आवाज़ का उपयोग किया गया।',
  'speech.thisSession': 'यह सत्र',
  'speech.noLinesSaved': 'अभी तक कोई पंक्ति सहेजी नहीं गई।',
  'speech.sessionEmpty': 'सत्र शुरू करने के लिए बोलें या टाइप किया गया संदेश बोलें।',
  'speech.modality.spoken': 'बोला गया',
  'speech.modality.typed': 'टाइप किया गया',
  'speech.modality.signed': 'संकेत किया गया',
  'speech.modality.avatar': 'अवतार',
  // Speech recognition errors
  'speech.error.notSupported': 'लाइव ट्रांसक्रिप्शन के लिए Chrome या Edge आवश्यक है।',
  'speech.error.notAllowed':
    'माइक्रोफ़ोन एक्सेस अवरुद्ध है। इसे अपने ब्राउज़र की साइट सेटिंग में अनुमति दें, फिर पुनः प्रयास करें।',
  'speech.error.audioCapture': 'कोई माइक्रोफ़ोन नहीं मिला। एक कनेक्ट करें और पुनः प्रयास करें।',
  'speech.error.noSpeech': 'कोई भाषण नहीं मिला। माइक दबाएँ और पुनः प्रयास करें।',
  'speech.error.network':
    'ट्रांसक्रिप्शन के दौरान नेटवर्क समस्या। अपना कनेक्शन जाँचें और पुनः प्रयास करें।',
  'speech.error.default': 'ट्रांसक्रिप्शन रुक गया ({code})। पुनः प्रयास करने के लिए माइक दबाएँ।',

  // Sign recognition page
  'sign.title': 'संकेत पहचान',
  'sign.context': 'अपने कैमरे को एक संकेत दिखाएँ और SignBridge इसे टेक्स्ट के रूप में पहचानेगा।',
  'sign.collectLink': 'प्रशिक्षण नमूने एकत्र करें →',
  'sign.camera': 'कैमरा',
  'sign.startCamera': 'कैमरा शुरू करें',
  'sign.stopCamera': 'कैमरा बंद करें',
  'sign.recognizedSign': 'पहचाना गया संकेत',
  'sign.watching': 'देख रहा है…',
  'sign.currentBest': 'वर्तमान सर्वश्रेष्ठ: {label} · {pct}% विश्वास',
  'sign.showSign': 'कैमरे को एक संकेत दिखाएँ।',
  'sign.pressStart': 'शुरू करने के लिए कैमरा शुरू करें दबाएँ।',
  'sign.thisSession': 'यह सत्र',
  'sign.noSignsYet': 'अभी तक कोई संकेत पहचाना नहीं गया।',
  'sign.unsupportedTitle': 'संकेत पहचान यहाँ उपलब्ध नहीं है',
  'sign.unsupportedBody':
    'इसके लिए कैमरा समर्थन वाला आधुनिक ब्राउज़र आवश्यक है, जैसे कैमरे वाले डिवाइस पर Chrome या Edge।',
  'sign.notTrainedTitle': 'अभी तक कोई पहचान मॉडल नहीं',
  'sign.notTrainedBody':
    'इस ऐप के लिए अभी तक कोई मॉडल प्रशिक्षित नहीं किया गया है। पहले संकेत नमूने एकत्र करें, फिर लाइव पहचान सक्षम करने के लिए प्रशिक्षण स्क्रिप्ट चलाएँ।',
  'sign.collectButton': 'प्रशिक्षण नमूने एकत्र करें',
  // Camera errors
  'sign.error.notSupported':
    'लाइव संकेत पहचान के लिए कैमरा समर्थन वाला आधुनिक ब्राउज़र (Chrome या Edge) आवश्यक है।',
  'sign.error.cameraDenied':
    'कैमरा एक्सेस अवरुद्ध है। इसे अपने ब्राउज़र की साइट सेटिंग में अनुमति दें, फिर शुरू करें दोबारा दबाएँ।',
  'sign.error.noCamera': 'कोई कैमरा नहीं मिला। एक कनेक्ट करें और पुनः प्रयास करें।',
  'sign.error.default': 'कैमरा शुरू नहीं हो सका। कृपया पुनः प्रयास करें।',

  // Collect samples page
  'signCollect.backToRecognition': 'पहचान पर वापस जाएँ',
  'signCollect.title': 'संकेत नमूने एकत्र करें',
  'signCollect.context':
    'पहचानकर्ता को प्रशिक्षित करने के लिए प्रत्येक संकेत के उदाहरण रिकॉर्ड करें। विभिन्न प्रकाश, कोणों और संकेतकों में प्रति लेबल कम से कम {count} नमूनों का लक्ष्य रखें।',
  'signCollect.camera': 'कैमरा',
  'signCollect.startCamera': 'कैमरा शुरू करें',
  'signCollect.stopCamera': 'कैमरा बंद करें',
  'signCollect.handDetected': 'हाथ पहचाना गया',
  'signCollect.noHandDetected': 'कोई हाथ नहीं पहचाना गया',
  'signCollect.capture': 'कैप्चर करें',
  'signCollect.signLabel': 'संकेत लेबल',
  'signCollect.sampleCount': '“{label}” के लिए {current} / {total} नमूने।',
  'signCollect.captureButton': 'कैप्चर करें',
  'signCollect.captureBurst': '5 कैप्चर करें',
  'signCollect.coverage': 'कवरेज',
  'signCollect.noHandStatus':
    'कोई हाथ नहीं पहचाना गया — कैमरे को अपना हाथ दिखाएँ और पुनः प्रयास करें।',
  'signCollect.capturedStatus': '“{label}” के लिए एक नमूना कैप्चर किया गया।',
  'signCollect.saveError': 'वह नमूना सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।',
  'signCollect.cameraDenied':
    'कैमरा एक्सेस अवरुद्ध है। इसे अपने ब्राउज़र की साइट सेटिंग में अनुमति दें, फिर पुनः प्रयास करें।',
  'signCollect.noCamera': 'कोई कैमरा नहीं मिला। एक कनेक्ट करें और पुनः प्रयास करें।',
  'signCollect.cameraError': 'कैमरा शुरू नहीं हो सका। कृपया पुनः प्रयास करें।',
};

export const gu: Dict = {
  // Speech page
  'speech.title': 'વાણી',
  'speech.context': 'વાણીને ટેક્સ્ટમાં ફેરવો, અથવા સંદેશ ટાઇપ કરો અને તેને મોટેથી સંભળાવો.',
  'speech.language': 'ભાષા',
  'speech.newSession': 'નવું સત્ર',
  'speech.saveError': 'તે પંક્તિ સાચવી શકાઈ નહીં. તમારું ટ્રાન્સક્રિપ્ટ અધૂરું હોઈ શકે છે.',
  'speech.speakToText': 'બોલો → ટેક્સ્ટ',
  'speech.sttUnsupported':
    'લાઇવ ટ્રાન્સક્રિપ્શન માટે Chrome અથવા Edge જરૂરી છે. તમે હજુ પણ નીચે સંદેશ ટાઇપ કરીને તેને સંભળાવી શકો છો.',
  'speech.startListening': 'સાંભળવાનું શરૂ કરો',
  'speech.stopListening': 'સાંભળવાનું બંધ કરો',
  'speech.listening': 'સાંભળી રહ્યું છે…',
  'speech.micOff': 'માઇક્રોફોન બંધ',
  'speech.liveTranscript': 'લાઇવ ટ્રાન્સક્રિપ્ટ',
  'speech.transcriptPlaceholder': 'માઇક દબાવો અને બોલવાનું શરૂ કરો — તમારા શબ્દો અહીં દેખાશે.',
  'speech.transcriptUnavailable': 'આ બ્રાઉઝરમાં ટ્રાન્સક્રિપ્શન ઉપલબ્ધ નથી.',
  'speech.typeToSpeech': 'ટાઇપ કરો → વાણી',
  'speech.ttsUnsupported': 'આ બ્રાઉઝરમાં ટેક્સ્ટ-ટુ-સ્પીચ ઉપલબ્ધ નથી.',
  'speech.messageToSpeak': 'બોલવા માટેનો સંદેશ',
  'speech.messagePlaceholder': 'મોટેથી કહેવા માટે કંઈક ટાઇપ કરો…',
  'speech.speak': 'બોલો',
  'speech.stop': 'રોકો',
  'speech.speaking': 'બોલી રહ્યું છે…',
  'speech.noVoice': 'આ ભાષા માટે કોઈ અવાજ સ્થાપિત નથી, તેથી ડિફોલ્ટ અવાજનો ઉપયોગ થયો.',
  'speech.thisSession': 'આ સત્ર',
  'speech.noLinesSaved': 'હજુ સુધી કોઈ પંક્તિ સાચવી નથી.',
  'speech.sessionEmpty': 'સત્ર શરૂ કરવા માટે બોલો અથવા ટાઇપ કરેલો સંદેશ બોલો.',
  'speech.modality.spoken': 'બોલાયેલું',
  'speech.modality.typed': 'ટાઇપ કરેલું',
  'speech.modality.signed': 'સંકેત કરેલું',
  'speech.modality.avatar': 'અવતાર',
  // Speech recognition errors
  'speech.error.notSupported': 'લાઇવ ટ્રાન્સક્રિપ્શન માટે Chrome અથવા Edge જરૂરી છે.',
  'speech.error.notAllowed':
    'માઇક્રોફોન ઍક્સેસ અવરોધિત છે. તેને તમારા બ્રાઉઝરની સાઇટ સેટિંગ્સમાં મંજૂરી આપો, પછી ફરી પ્રયાસ કરો.',
  'speech.error.audioCapture': 'કોઈ માઇક્રોફોન મળ્યો નથી. એક જોડો અને ફરી પ્રયાસ કરો.',
  'speech.error.noSpeech': 'કોઈ વાણી મળી નથી. માઇક દબાવો અને ફરી પ્રયાસ કરો.',
  'speech.error.network':
    'ટ્રાન્સક્રિપ્શન દરમિયાન નેટવર્ક સમસ્યા. તમારું કનેક્શન તપાસો અને ફરી પ્રયાસ કરો.',
  'speech.error.default': 'ટ્રાન્સક્રિપ્શન બંધ થયું ({code}). ફરી પ્રયાસ કરવા માટે માઇક દબાવો.',

  // Sign recognition page
  'sign.title': 'સંકેત ઓળખ',
  'sign.context': 'તમારા કૅમેરાને એક સંકેત બતાવો અને SignBridge તેને ટેક્સ્ટ તરીકે ઓળખશે.',
  'sign.collectLink': 'તાલીમ નમૂના એકત્રિત કરો →',
  'sign.camera': 'કૅમેરા',
  'sign.startCamera': 'કૅમેરા શરૂ કરો',
  'sign.stopCamera': 'કૅમેરા બંધ કરો',
  'sign.recognizedSign': 'ઓળખાયેલ સંકેત',
  'sign.watching': 'જોઈ રહ્યું છે…',
  'sign.currentBest': 'વર્તમાન શ્રેષ્ઠ: {label} · {pct}% વિશ્વાસ',
  'sign.showSign': 'કૅમેરાને એક સંકેત બતાવો.',
  'sign.pressStart': 'શરૂ કરવા માટે કૅમેરા શરૂ કરો દબાવો.',
  'sign.thisSession': 'આ સત્ર',
  'sign.noSignsYet': 'હજુ સુધી કોઈ સંકેત ઓળખાયો નથી.',
  'sign.unsupportedTitle': 'સંકેત ઓળખ અહીં ઉપલબ્ધ નથી',
  'sign.unsupportedBody':
    'તેને કૅમેરા સપોર્ટ સાથેનું આધુનિક બ્રાઉઝર જરૂરી છે, જેમ કે કૅમેરાવાળા ઉપકરણ પર Chrome અથવા Edge.',
  'sign.notTrainedTitle': 'હજુ સુધી કોઈ ઓળખ મોડેલ નથી',
  'sign.notTrainedBody':
    'આ ઍપ માટે હજુ સુધી કોઈ મોડેલ તાલીમ પામ્યું નથી. પહેલા સંકેત નમૂના એકત્રિત કરો, પછી લાઇવ ઓળખ સક્ષમ કરવા તાલીમ સ્ક્રિપ્ટ ચલાવો.',
  'sign.collectButton': 'તાલીમ નમૂના એકત્રિત કરો',
  // Camera errors
  'sign.error.notSupported':
    'લાઇવ સંકેત ઓળખ માટે કૅમેરા સપોર્ટ સાથેનું આધુનિક બ્રાઉઝર (Chrome અથવા Edge) જરૂરી છે.',
  'sign.error.cameraDenied':
    'કૅમેરા ઍક્સેસ અવરોધિત છે. તેને તમારા બ્રાઉઝરની સાઇટ સેટિંગ્સમાં મંજૂરી આપો, પછી શરૂ કરો ફરી દબાવો.',
  'sign.error.noCamera': 'કોઈ કૅમેરા મળ્યો નથી. એક જોડો અને ફરી પ્રયાસ કરો.',
  'sign.error.default': 'કૅમેરા શરૂ કરી શકાયો નહીં. કૃપા કરીને ફરી પ્રયાસ કરો.',

  // Collect samples page
  'signCollect.backToRecognition': 'ઓળખ પર પાછા જાઓ',
  'signCollect.title': 'સંકેત નમૂના એકત્રિત કરો',
  'signCollect.context':
    'ઓળખકર્તાને તાલીમ આપવા માટે દરેક સંકેતના ઉદાહરણો રેકોર્ડ કરો. વિવિધ પ્રકાશ, ખૂણા અને સંકેતકોમાં પ્રતિ લેબલ ઓછામાં ઓછા {count} નમૂનાનો લક્ષ્ય રાખો.',
  'signCollect.camera': 'કૅમેરા',
  'signCollect.startCamera': 'કૅમેરા શરૂ કરો',
  'signCollect.stopCamera': 'કૅમેરા બંધ કરો',
  'signCollect.handDetected': 'હાથ ઓળખાયો',
  'signCollect.noHandDetected': 'કોઈ હાથ ઓળખાયો નથી',
  'signCollect.capture': 'કૅપ્ચર કરો',
  'signCollect.signLabel': 'સંકેત લેબલ',
  'signCollect.sampleCount': '“{label}” માટે {current} / {total} નમૂના.',
  'signCollect.captureButton': 'કૅપ્ચર કરો',
  'signCollect.captureBurst': '5 કૅપ્ચર કરો',
  'signCollect.coverage': 'કવરેજ',
  'signCollect.noHandStatus': 'કોઈ હાથ ઓળખાયો નથી — કૅમેરાને તમારો હાથ બતાવો અને ફરી પ્રયાસ કરો.',
  'signCollect.capturedStatus': '“{label}” માટે એક નમૂનો કૅપ્ચર કર્યો.',
  'signCollect.saveError': 'તે નમૂનો સાચવી શકાયો નહીં. કૃપા કરીને ફરી પ્રયાસ કરો.',
  'signCollect.cameraDenied':
    'કૅમેરા ઍક્સેસ અવરોધિત છે. તેને તમારા બ્રાઉઝરની સાઇટ સેટિંગ્સમાં મંજૂરી આપો, પછી ફરી પ્રયાસ કરો.',
  'signCollect.noCamera': 'કોઈ કૅમેરા મળ્યો નથી. એક જોડો અને ફરી પ્રયાસ કરો.',
  'signCollect.cameraError': 'કૅમેરા શરૂ કરી શકાયો નહીં. કૃપા કરીને ફરી પ્રયાસ કરો.',
};
