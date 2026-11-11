/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// extension text in the app's language (the app sends it with every ping)
;(function (g) {
  // English: [Arabic, Spanish, Hindi, Urdu]
  const S = {
    'Download this video': ['تنزيل هذا الفيديو', 'Descargar este video', 'यह वीडियो डाउनलोड करें', 'یہ ویڈیو ڈاؤن لوڈ کریں'],
    'MP4 video': ['فيديو MP4', 'Video MP4', 'MP4 वीडियो', 'MP4 ویڈیو'],
    'Audio only': ['صوت فقط', 'Solo audio', 'सिर्फ़ ऑडियो', 'صرف آڈیو'],
    'Picture': ['صورة', 'Imagen', 'फ़ोटो', 'تصویر'],
    'File': ['ملف', 'Archivo', 'फ़ाइल', 'فائل'],
    'Pick a quality and download with RS Downloader': ['اختر الجودة ونزّل باستخدام RS Downloader', 'Elige una calidad y descarga con RS Downloader', 'क्वालिटी चुनें और RS Downloader से डाउनलोड करें', 'کوالٹی چنیں اور RS Downloader سے ڈاؤن لوڈ کریں'],
    'Hide for this video': ['إخفاء لهذا الفيديو', 'Ocultar en este video', 'इस वीडियो के लिए छिपाएं', 'اس ویڈیو کے لیے چھپائیں'],
    'Best': ['الأفضل', 'La mejor', 'सबसे अच्छी', 'بہترین'],
    'BEST': ['الأفضل', 'MEJOR', 'सबसे अच्छी', 'بہترین'],
    'Refresh the page and try again.': ['حدّث الصفحة وحاول مرة أخرى.', 'Recarga la página e inténtalo de nuevo.', 'पेज रीफ़्रेश करें और फिर कोशिश करें।', 'پیج ریفریش کریں اور دوبارہ کوشش کریں۔'],
    'Refresh the page': ['حدّث الصفحة', 'Recarga la página', 'पेज रीफ़्रेश करें', 'پیج ریفریش کریں'],
    'RS Downloader is not running. Open the app and try again.': ['RS Downloader لا يعمل. افتح التطبيق وحاول مرة أخرى.', 'RS Downloader no está abierto. Abre la app e inténtalo de nuevo.', 'RS Downloader नहीं चल रहा। ऐप खोलें और फिर कोशिश करें।', 'RS Downloader نہیں چل رہا۔ ایپ کھولیں اور دوبارہ کوشش کریں۔'],
    'RS Downloader is not running. Open the app, then try again.': ['RS Downloader لا يعمل. افتح التطبيق ثم حاول مرة أخرى.', 'RS Downloader no está abierto. Abre la app y vuelve a intentarlo.', 'RS Downloader नहीं चल रहा। ऐप खोलें, फिर कोशिश करें।', 'RS Downloader نہیں چل رہا۔ ایپ کھولیں، پھر کوشش کریں۔'],
    'Reading the available qualities...': ['جارٍ قراءة الجودات المتاحة...', 'Leyendo las calidades disponibles...', 'उपलब्ध क्वालिटी पढ़ी जा रही हैं...', 'دستیاب کوالٹیز پڑھی جا رہی ہیں...'],
    'Still reading... long videos and slow sites take a little longer.': ['ما زالت القراءة جارية... الفيديوهات الطويلة والمواقع البطيئة تأخذ وقتًا أطول.', 'Sigue leyendo... los videos largos y los sitios lentos tardan un poco más.', 'अभी पढ़ा जा रहा है... लंबे वीडियो और धीमी साइटें थोड़ा ज़्यादा समय लेती हैं।', 'ابھی پڑھا جا رہا ہے... لمبی ویڈیوز اور سست سائٹس تھوڑا زیادہ وقت لیتی ہیں۔'],
    'This took too long. Try again, or open the video page itself.': ['استغرق ذلك وقتًا طويلًا. حاول مرة أخرى، أو افتح صفحة الفيديو نفسها.', 'Tardó demasiado. Inténtalo de nuevo o abre la página del video.', 'बहुत समय लगा। फिर कोशिश करें, या खुद वीडियो का पेज खोलें।', 'بہت وقت لگا۔ دوبارہ کوشش کریں، یا خود ویڈیو کا پیج کھولیں۔'],
    'Could not read this video.': ['تعذرت قراءة هذا الفيديو.', 'No se pudo leer este video.', 'यह वीडियो पढ़ा नहीं जा सका।', 'یہ ویڈیو پڑھی نہیں جا سکی۔'],
    'More options in RS Downloader...': ['خيارات أكثر في RS Downloader...', 'Más opciones en RS Downloader...', 'RS Downloader में और विकल्प...', 'RS Downloader میں مزید آپشنز...'],
    'Opened in RS Downloader': ['فُتح في RS Downloader', 'Abierto en RS Downloader', 'RS Downloader में खुल गया', 'RS Downloader میں کھل گیا'],
    'Open RS Downloader first': ['افتح RS Downloader أولًا', 'Abre RS Downloader primero', 'पहले RS Downloader खोलें', 'پہلے RS Downloader کھولیں'],
    'Starting {0}...': ['جارٍ بدء {0}...', 'Iniciando {0}...', '{0} शुरू हो रहा है...', '{0} شروع ہو رہا ہے...'],
    'Downloading {0}': ['جارٍ تنزيل {0}', 'Descargando {0}', '{0} डाउनलोड हो रहा है', '{0} ڈاؤن لوڈ ہو رہا ہے'],
    'Reading this video took too long. Try again.': ['استغرقت قراءة هذا الفيديو وقتًا طويلًا. حاول مرة أخرى.', 'Leer este video tardó demasiado. Inténtalo de nuevo.', 'यह वीडियो पढ़ने में बहुत समय लगा। फिर कोशिश करें।', 'یہ ویڈیو پڑھنے میں بہت وقت لگا۔ دوبارہ کوشش کریں۔'],
    'Download link with RS Downloader': ['تنزيل الرابط باستخدام RS Downloader', 'Descargar enlace con RS Downloader', 'RS Downloader से लिंक डाउनलोड करें', 'RS Downloader سے لنک ڈاؤن لوڈ کریں'],
    'Download this with RS Downloader': ['تنزيل هذا باستخدام RS Downloader', 'Descargar esto con RS Downloader', 'RS Downloader से इसे डाउनलोड करें', 'RS Downloader سے اسے ڈاؤن لوڈ کریں'],
    'Download the video on this page': ['تنزيل الفيديو في هذه الصفحة', 'Descargar el video de esta página', 'इस पेज का वीडियो डाउनलोड करें', 'اس پیج کی ویڈیو ڈاؤن لوڈ کریں'],
    'Connected to RS Downloader on this PC.': ['متصل بـ RS Downloader على هذا الكمبيوتر.', 'Conectado a RS Downloader en este PC.', 'इस PC पर RS Downloader से जुड़ा है।', 'اس PC پر RS Downloader سے جڑا ہے۔'],
    'Sent. Pick the quality in RS Downloader.': ['أُرسل. اختر الجودة في RS Downloader.', 'Enviado. Elige la calidad en RS Downloader.', 'भेज दिया। RS Downloader में क्वालिटी चुनें।', 'بھیج دیا۔ RS Downloader میں کوالٹی چنیں۔'],
    'Could not reach RS Downloader. Is the app open?': ['تعذر الوصول إلى RS Downloader. هل التطبيق مفتوح؟', 'No se pudo conectar con RS Downloader. ¿Está abierta la app?', 'RS Downloader तक नहीं पहुंच सके। क्या ऐप खुला है?', 'RS Downloader تک نہیں پہنچ سکے۔ کیا ایپ کھلی ہے؟'],
    'This tab has no web page to download.': ['لا تحتوي هذه العلامة على صفحة ويب للتنزيل.', 'Esta pestaña no tiene una página web para descargar.', 'इस टैब में डाउनलोड के लिए कोई वेब पेज नहीं है।', 'اس ٹیب میں ڈاؤن لوڈ کے لیے کوئی ویب پیج نہیں۔'],
    'Paste a full link starting with http.': ['الصق رابطًا كاملًا يبدأ بـ http.', 'Pega un enlace completo que empiece por http.', 'http से शुरू होने वाला पूरा लिंक पेस्ट करें।', 'http سے شروع ہونے والا پورا لنک پیسٹ کریں۔'],
    'Checking the app...': ['جارٍ التحقق من التطبيق...', 'Comprobando la app...', 'ऐप जांचा जा रहा है...', 'ایپ جانچی جا رہی ہے...'],
    'Download this page\'s video': ['تنزيل فيديو هذه الصفحة', 'Descargar el video de esta página', 'इस पेज का वीडियो डाउनलोड करें', 'اس پیج کی ویڈیو ڈاؤن لوڈ کریں'],
    'Send': ['إرسال', 'Enviar', 'भेजें', 'بھیجیں'],
    'Or paste any link': ['أو الصق أي رابط', 'O pega cualquier enlace', 'या कोई भी लिंक पेस्ट करें', 'یا کوئی بھی لنک پیسٹ کریں'],
    'Catch browser downloads (zip, exe, pdf, video...)': ['التقاط تنزيلات المتصفح (zip، exe، pdf، فيديو...)', 'Capturar descargas del navegador (zip, exe, pdf, video...)', 'ब्राउज़र के डाउनलोड पकड़ें (zip, exe, pdf, वीडियो...)', 'براؤزر کے ڈاؤن لوڈز پکڑیں (zip، exe، pdf، ویڈیو...)'],
    'Show "Download this video" on videos': ['إظهار "تنزيل هذا الفيديو" على الفيديوهات', 'Mostrar "Descargar este video" en los videos', 'वीडियो पर "यह वीडियो डाउनलोड करें" दिखाएं', 'ویڈیوز پر "یہ ویڈیو ڈاؤن لوڈ کریں" دکھائیں'],
    'Right-click any link, picture or video for "Download with RS Downloader".': ['انقر بزر الماوس الأيمن على أي رابط أو صورة أو فيديو لاختيار "التنزيل باستخدام RS Downloader".', 'Haz clic derecho en cualquier enlace, imagen o video para "Descargar con RS Downloader".', '"RS Downloader से डाउनलोड करें" के लिए किसी भी लिंक, फ़ोटो या वीडियो पर राइट-क्लिक करें।', '"RS Downloader سے ڈاؤن لوڈ کریں" کے لیے کسی بھی لنک، تصویر یا ویڈیو پر رائٹ کلک کریں۔'],
  }
  const COL = {ar: 0, es: 1, hi: 2, ur: 3}
  let lang = 'en'
  const T = (s, ...a) => String((COL[lang] != null && S[s]?.[COL[lang]]) || s).replace(/\{(\d)\}/g, (_, n) => a[n] ?? '')
  let ready = Promise.resolve()
  try {
    ready = chrome.storage.local.get({lang: 'en'}).then(v => { lang = v.lang || 'en' }).catch(() => {})
    chrome.storage.onChanged.addListener(c => { if (c.lang) lang = c.lang.newValue || 'en' })
  } catch {}
  g.RST = {T, ready: () => ready, lang: () => lang, set: l => { lang = l || 'en' }, rtl: () => lang === 'ar' || lang === 'ur'}
})(globalThis)
