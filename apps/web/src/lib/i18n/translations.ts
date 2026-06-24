import type { LanguageCode } from '@signbridge/shared-types';
import * as avatarTranslate from './sections/avatar-translate';
import * as speechSign from './sections/speech-sign';
import * as learn from './sections/learn';
import * as emergency from './sections/emergency';
import * as live from './sections/live';
import * as callHistoryProfile from './sections/call-history-profile';

/**
 * UI string translations for the app interface.
 *
 * IMPORTANT: the Hindi (hi) and Gujarati (gu) strings are best-effort and should
 * be verified by a native speaker before real-world use (same caveat as the
 * ISLRTC vocabulary / emergency-phrase notes).
 *
 * Lookup falls back to English, then to the raw key, so a missing translation
 * never breaks the UI — pages can be migrated to `useT()` incrementally.
 */
export type Dict = Record<string, string>;

const en: Dict = {
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.live': 'Live conversation',
  'nav.call': 'Video call',
  'nav.speech': 'Speech',
  'nav.sign': 'Sign recognition',
  'nav.avatar': 'Sign avatar',
  'nav.translate': 'Translate',
  'nav.learn': 'Learn ISL',
  'nav.emergency': 'Emergency',
  'nav.history': 'History',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',

  // Roles
  'role.DEAF_USER': 'Deaf user',
  'role.HEARING_USER': 'Hearing user',
  'role.LEARNER': 'Learner',
  'role.ADMIN': 'Administrator',

  // Common
  'common.logout': 'Log out',
  'common.signedIn': 'Signed in',
  'common.tagline': 'SignBridge — bridging communication beyond language and hearing barriers.',
  'common.nav': 'Navigation',
  'common.openMenu': 'Open navigation menu',
  'common.closeMenu': 'Close navigation menu',

  // Settings
  'settings.title': 'Settings',
  'settings.subtitle':
    'Tune SignBridge to work the way you do. Changes apply right away and are saved to your account.',
  'settings.language': 'Language',
  'settings.interfaceLanguage': 'Interface language',
  'settings.languageNote': 'This changes the language of the app interface.',
  'settings.display': 'Display',
  'settings.textSize': 'Text size',
  'settings.size.normal': 'Normal',
  'settings.size.large': 'Large',
  'settings.size.larger': 'Larger',
  'settings.highContrast': 'High contrast',
  'settings.highContrastDesc': 'Stronger borders and higher-contrast text.',
  'settings.reduceMotion': 'Reduce motion',
  'settings.reduceMotionDesc': 'Minimise animations and transitions across the app.',
  'settings.captions': 'Captions',
  'settings.captionsDesc': 'Show captions in conversations and calls (used by later features).',
  'settings.saveError': 'Could not save that change. Please try again.',

  // Dashboard
  'dash.welcome': 'Welcome',
  'dash.welcomeName': 'Welcome, {name}',
  'dash.intro':
    'Your bridge to clear communication. Pick up where you left off or start something new.',
  'dash.modules': 'Modules',
  'dash.hero.kicker': 'Start here',
  'dash.hero.title': 'Start a conversation',
  'dash.hero.body':
    'Bridge sign, speech, and text in real time — so everyone in the room can follow along.',
  'dash.hero.cta': 'Start a conversation',
  'dash.card.live.desc': 'Bridge a speaking and a signing participant on one device, in real time.',
  'dash.card.speech.desc': 'Transcribe speech to text and speak typed messages aloud.',
  'dash.card.sign.desc': 'Recognize Indian Sign Language signs from your camera as text.',
  'dash.card.translate.desc': 'Translate text between English, Hindi, and Gujarati.',
  'dash.card.avatar.desc': 'Watch a 3D hand fingerspell text in Indian Sign Language.',
  'dash.card.learn.desc': 'Practice Indian Sign Language with guided lessons.',
  'dash.card.emergency.desc': 'Fast, clear communication when every second counts.',
  'dash.card.video.desc': 'Face-to-face calls with live captions and interpretation.',
};

const hi: Dict = {
  'nav.dashboard': 'डैशबोर्ड',
  'nav.live': 'लाइव बातचीत',
  'nav.call': 'वीडियो कॉल',
  'nav.speech': 'वाणी',
  'nav.sign': 'संकेत पहचान',
  'nav.avatar': 'संकेत अवतार',
  'nav.translate': 'अनुवाद',
  'nav.learn': 'ISL सीखें',
  'nav.emergency': 'आपातकाल',
  'nav.history': 'इतिहास',
  'nav.profile': 'प्रोफ़ाइल',
  'nav.settings': 'सेटिंग्स',

  'role.DEAF_USER': 'बधिर उपयोगकर्ता',
  'role.HEARING_USER': 'श्रवण उपयोगकर्ता',
  'role.LEARNER': 'शिक्षार्थी',
  'role.ADMIN': 'प्रशासक',

  'common.logout': 'लॉग आउट',
  'common.signedIn': 'साइन इन',
  'common.tagline': 'SignBridge — भाषा और श्रवण की बाधाओं से परे संवाद को जोड़ता है।',
  'common.nav': 'नेविगेशन',
  'common.openMenu': 'नेविगेशन मेनू खोलें',
  'common.closeMenu': 'नेविगेशन मेनू बंद करें',

  'settings.title': 'सेटिंग्स',
  'settings.subtitle':
    'SignBridge को अपने अनुसार सेट करें। बदलाव तुरंत लागू होते हैं और आपके खाते में सहेजे जाते हैं।',
  'settings.language': 'भाषा',
  'settings.interfaceLanguage': 'इंटरफ़ेस भाषा',
  'settings.languageNote': 'इससे ऐप इंटरफ़ेस की भाषा बदल जाती है।',
  'settings.display': 'प्रदर्शन',
  'settings.textSize': 'टेक्स्ट का आकार',
  'settings.size.normal': 'सामान्य',
  'settings.size.large': 'बड़ा',
  'settings.size.larger': 'और बड़ा',
  'settings.highContrast': 'उच्च कंट्रास्ट',
  'settings.highContrastDesc': 'गहरी सीमाएँ और अधिक कंट्रास्ट वाला टेक्स्ट।',
  'settings.reduceMotion': 'गति कम करें',
  'settings.reduceMotionDesc': 'ऐप भर में एनिमेशन और ट्रांज़िशन कम करें।',
  'settings.captions': 'कैप्शन',
  'settings.captionsDesc': 'बातचीत और कॉल में कैप्शन दिखाएँ (बाद की सुविधाओं द्वारा उपयोग)।',
  'settings.saveError': 'वह बदलाव सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।',

  'dash.welcome': 'स्वागत है',
  'dash.welcomeName': 'स्वागत है, {name}',
  'dash.intro': 'स्पष्ट संवाद का आपका सेतु। जहाँ छोड़ा था वहीं से शुरू करें या कुछ नया शुरू करें।',
  'dash.modules': 'मॉड्यूल',
  'dash.hero.kicker': 'यहाँ से शुरू करें',
  'dash.hero.title': 'बातचीत शुरू करें',
  'dash.hero.body':
    'संकेत, वाणी और टेक्स्ट को वास्तविक समय में जोड़ें — ताकि कमरे में सब लोग साथ चल सकें।',
  'dash.hero.cta': 'बातचीत शुरू करें',
  'dash.card.live.desc':
    'एक ही डिवाइस पर बोलने वाले और संकेत करने वाले को वास्तविक समय में जोड़ें।',
  'dash.card.speech.desc': 'वाणी को टेक्स्ट में बदलें और टाइप किए संदेश को बोलकर सुनाएँ।',
  'dash.card.sign.desc': 'अपने कैमरे से भारतीय संकेत भाषा को टेक्स्ट के रूप में पहचानें।',
  'dash.card.translate.desc': 'अंग्रेज़ी, हिंदी और गुजराती के बीच टेक्स्ट का अनुवाद करें।',
  'dash.card.avatar.desc': 'एक 3D हाथ को भारतीय संकेत भाषा में टेक्स्ट की वर्तनी करते देखें।',
  'dash.card.learn.desc': 'निर्देशित पाठों के साथ भारतीय संकेत भाषा का अभ्यास करें।',
  'dash.card.emergency.desc': 'जब हर सेकंड मायने रखता है, तेज़ और स्पष्ट संवाद।',
  'dash.card.video.desc': 'लाइव कैप्शन और व्याख्या के साथ आमने-सामने कॉल।',
};

const gu: Dict = {
  'nav.dashboard': 'ડેશબોર્ડ',
  'nav.live': 'લાઇવ વાતચીત',
  'nav.call': 'વિડિયો કૉલ',
  'nav.speech': 'વાણી',
  'nav.sign': 'સંકેત ઓળખ',
  'nav.avatar': 'સંકેત અવતાર',
  'nav.translate': 'અનુવાદ',
  'nav.learn': 'ISL શીખો',
  'nav.emergency': 'કટોકટી',
  'nav.history': 'ઇતિહાસ',
  'nav.profile': 'પ્રોફાઇલ',
  'nav.settings': 'સેટિંગ્સ',

  'role.DEAF_USER': 'બહેરા વપરાશકર્તા',
  'role.HEARING_USER': 'સાંભળનાર વપરાશકર્તા',
  'role.LEARNER': 'શીખનાર',
  'role.ADMIN': 'સંચાલક',

  'common.logout': 'લૉગ આઉટ',
  'common.signedIn': 'સાઇન ઇન',
  'common.tagline': 'SignBridge — ભાષા અને શ્રવણની અડચણોથી પર સંવાદને જોડે છે.',
  'common.nav': 'નેવિગેશન',
  'common.openMenu': 'નેવિગેશન મેનુ ખોલો',
  'common.closeMenu': 'નેવિગેશન મેનુ બંધ કરો',

  'settings.title': 'સેટિંગ્સ',
  'settings.subtitle':
    'SignBridge ને તમારી રીતે ગોઠવો. ફેરફારો તરત જ લાગુ થાય છે અને તમારા ખાતામાં સાચવાય છે.',
  'settings.language': 'ભાષા',
  'settings.interfaceLanguage': 'ઇન્ટરફેસ ભાષા',
  'settings.languageNote': 'આ એપ ઇન્ટરફેસની ભાષા બદલે છે.',
  'settings.display': 'ડિસ્પ્લે',
  'settings.textSize': 'ટેક્સ્ટ માપ',
  'settings.size.normal': 'સામાન્ય',
  'settings.size.large': 'મોટું',
  'settings.size.larger': 'વધુ મોટું',
  'settings.highContrast': 'ઉચ્ચ કોન્ટ્રાસ્ટ',
  'settings.highContrastDesc': 'ઘટ્ટ કિનારીઓ અને વધુ કોન્ટ્રાસ્ટવાળું ટેક્સ્ટ.',
  'settings.reduceMotion': 'ગતિ ઘટાડો',
  'settings.reduceMotionDesc': 'એપભરમાં એનિમેશન અને ટ્રાન્ઝિશન ઘટાડો.',
  'settings.captions': 'કૅપ્શન',
  'settings.captionsDesc': 'વાતચીત અને કૉલમાં કૅપ્શન બતાવો (પછીની સુવિધાઓ દ્વારા વપરાય છે).',
  'settings.saveError': 'તે ફેરફાર સાચવી શકાયો નહીં. કૃપા કરીને ફરી પ્રયાસ કરો.',

  'dash.welcome': 'સ્વાગત છે',
  'dash.welcomeName': 'સ્વાગત છે, {name}',
  'dash.intro':
    'સ્પષ્ટ સંવાદ માટેનો તમારો સેતુ. જ્યાં છોડ્યું હતું ત્યાંથી શરૂ કરો અથવા નવું શરૂ કરો.',
  'dash.modules': 'મોડ્યુલ',
  'dash.hero.kicker': 'અહીંથી શરૂ કરો',
  'dash.hero.title': 'વાતચીત શરૂ કરો',
  'dash.hero.body':
    'સંકેત, વાણી અને ટેક્સ્ટને રિયલ-ટાઇમમાં જોડો — જેથી રૂમમાં દરેક જણ સાથે રહી શકે.',
  'dash.hero.cta': 'વાતચીત શરૂ કરો',
  'dash.card.live.desc': 'એક જ ડિવાઇસ પર બોલનાર અને સંકેત કરનારને રિયલ-ટાઇમમાં જોડો.',
  'dash.card.speech.desc': 'વાણીને ટેક્સ્ટમાં ફેરવો અને ટાઇપ કરેલા સંદેશ બોલીને સંભળાવો.',
  'dash.card.sign.desc': 'તમારા કૅમેરાથી ભારતીય સંકેત ભાષાને ટેક્સ્ટ તરીકે ઓળખો.',
  'dash.card.translate.desc': 'અંગ્રેજી, હિન્દી અને ગુજરાતી વચ્ચે ટેક્સ્ટ અનુવાદ કરો.',
  'dash.card.avatar.desc': 'એક 3D હાથને ભારતીય સંકેત ભાષામાં ટેક્સ્ટની જોડણી કરતો જુઓ.',
  'dash.card.learn.desc': 'માર્ગદર્શિત પાઠ સાથે ભારતીય સંકેત ભાષાનો અભ્યાસ કરો.',
  'dash.card.emergency.desc': 'જ્યારે દરેક સેકન્ડ મહત્વની હોય, ત્યારે ઝડપી અને સ્પષ્ટ સંવાદ.',
  'dash.card.video.desc': 'લાઇવ કૅપ્શન અને અર્થઘટન સાથે રૂબરૂ કૉલ.',
};

/** Page-level translations live in `./sections/*` and are merged in here so
 *  each feature area can be maintained independently. */
const SECTIONS = [avatarTranslate, speechSign, learn, emergency, live, callHistoryProfile];

function merge(lang: 'en' | 'hi' | 'gu', base: Dict): Dict {
  return SECTIONS.reduce((acc, section) => ({ ...acc, ...section[lang] }), { ...base });
}

export const TRANSLATIONS: Record<LanguageCode, Dict> = {
  en: merge('en', en),
  hi: merge('hi', hi),
  gu: merge('gu', gu),
};
