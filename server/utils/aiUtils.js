/**
 * أدوات مساعدة للذكاء الاصطناعي
 * تتضمن دوال لتحليل النص وتحديد حاجة البحث
 */

// الكلمات المفتاحية التي تشير إلى حاجة البحث
const SEARCH_TRIGGERS = [
  // كلمات زمنية
  'الحالي', 'مؤخراً', 'أحدث', 'الآن', 'اليوم', 'أمس', 'الأسبوع', 'الشهر', 'السنة',
  '2023', '2024', 'حديث', 'جديد',
  
  // كلمات معلوماتية
  'أخبار', 'تحديث', 'تقرير', 'دراسة', 'بحث', 'إحصائية', 'تحليل',
  
  // كلمات اقتصادية
  'سعر', 'أسعار', 'بورصة', 'سوق', 'عملة', 'دولار', 'يورو',
  
  // كلمات تقنية
  'إصدار', 'تحديث', 'تطبيق', 'برنامج', 'نظام', 'هاتف', 'جهاز',
  
  // كلمات رياضية
  'مباراة', 'نتيجة', 'بطولة', 'دوري', 'مسابقة',
  
  // كلمات طقس
  'طقس', 'حرارة', 'جو', 'أمطار', 'رياح'
];

// الكلمات التي يجب تجاهلها عند استخراج الكلمات المفتاحية
const STOP_WORDS = [
  // حروف
  'في', 'على', 'إلى', 'من', 'عن', 'مع', 'حتى', 'منذ', 'لـ', 'بـ', 'كـ',
  
  // ضمائر
  'أنا', 'نحن', 'أنت', 'أنتم', 'هو', 'هي', 'هم', 'هن',
  
  // أدوات استفهام
  'ما', 'ماذا', 'من', 'متى', 'أين', 'كيف', 'لماذا', 'هل',
  
  // روابط
  'و', 'أو', 'ثم', 'فـ', 'لكن', 'بل', 'حيث', 'إذ', 'إذا',
  
  // كلمات شائعة
  'يوجد', 'كان', 'يكون', 'أصبح', 'صار', 'ليس', 'يمكن', 'يجب',
  
  // علامات ترقيم
  '،', '.', '؟', '!', ':', '؛', '-', '_'
];

/**
 * تحديد ما إذا كان النص يحتاج إلى بحث في الإنترنت
 * @param {string} text - النص المراد تحليله
 * @returns {boolean} - هل يحتاج إلى بحث
 */
function shouldSearchWeb(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // تنظيف النص
  const cleanText = text
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .toLowerCase()
    .trim();

  // البحث عن الكلمات المفتاحية
  return SEARCH_TRIGGERS.some(trigger => 
    cleanText.includes(trigger.toLowerCase())
  );
}

/**
 * استخراج الكلمات المفتاحية من النص
 * @param {string} text - النص المراد تحليله
 * @returns {string} - الكلمات المفتاحية مفصولة بمسافات
 */
function extractKeywords(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // تنظيف النص
  const cleanText = text
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟،]/g, '')  // إزالة علامات الترقيم
    .replace(/\s{2,}/g, ' ')                         // توحيد المسافات
    .trim()
    .toLowerCase();

  // تقسيم النص إلى كلمات
  const words = cleanText.split(' ');

  // تصفية الكلمات
  const keywords = words.filter(word => 
    word.length > 2 &&                    // تجاهل الكلمات القصيرة
    !STOP_WORDS.includes(word) &&         // تجاهل الكلمات الشائعة
    !/^\d+$/.test(word)                  // تجاهل الأرقام المجردة
  );

  // اختيار أهم 5 كلمات
  return keywords
    .slice(0, 5)
    .join(' ');
}

/**
 * تحليل مستوى تعقيد السؤال
 * @param {string} text - النص المراد تحليله
 * @returns {Object} - معلومات عن تعقيد السؤال
 */
function analyzeQuestionComplexity(text) {
  if (!text || typeof text !== 'string') {
    return { complexity: 'unknown', requiresSearch: false };
  }

  const words = text.split(' ').length;
  const hasNumbers = /\d+/.test(text);
  const hasTechnicalTerms = /API|SDK|HTTP|URL|JSON|XML|HTML|CSS|JavaScript|Python|SQL/i.test(text);
  const hasQuestionWords = /(ما|ماذا|كيف|لماذا|متى|أين|من|هل)/i.test(text);

  let complexity = 'simple';
  if (words > 20 || (hasNumbers && hasTechnicalTerms)) {
    complexity = 'complex';
  } else if (words > 10 || hasTechnicalTerms) {
    complexity = 'medium';
  }

  return {
    complexity,
    words,
    hasTechnicalContent: hasTechnicalTerms,
    isQuestion: hasQuestionWords,
    requiresSearch: shouldSearchWeb(text)
  };
}

module.exports = {
  shouldSearchWeb,
  extractKeywords,
  analyzeQuestionComplexity,
  SEARCH_TRIGGERS,
  STOP_WORDS
};
