/**
 * أدوات مساعدة للبحث في الإنترنت
 * يستخدم SerpAPI للحصول على نتائج البحث
 */
const axios = require('axios');

/**
 * الحصول على نتائج البحث من SerpAPI
 * @param {string} keywords - الكلمات المفتاحية للبحث
 * @param {string} apiKey - مفتاح SerpAPI
 * @returns {Promise<string>} - نتائج البحث منسقة
 */
async function getWebResults(keywords, apiKey) {
  try {
    // التحقق من المدخلات
    if (!keywords || typeof keywords !== 'string' || keywords.trim() === '') {
      throw new Error('كلمات البحث مطلوبة');
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('مفتاح API مطلوب');
    }

    // إعداد معلمات البحث
    const params = {
      q: keywords,
      api_key: apiKey,
      engine: 'google',
      gl: 'sa',           // المنطقة: السعودية
      hl: 'ar',           // اللغة: العربية
      num: 3,             // عدد النتائج
      safe: 'active',     // تصفية المحتوى غير اللائق
      time: 'year'        // نتائج حديثة فقط
    };

    // إجراء طلب البحث
    const response = await axios.get('https://serpapi.com/search', {
      params,
      timeout: 10000,     // مهلة 10 ثواني
      validateStatus: status => status === 200 // قبول الاستجابة 200 فقط
    });

    // التحقق من وجود نتائج
    if (!response.data.organic_results || response.data.organic_results.length === 0) {
      return 'لم يتم العثور على نتائج مناسبة';
    }

    // تنسيق النتائج
    const formattedResults = response.data.organic_results
      .slice(0, 3)  // أخذ أول 3 نتائج فقط
      .map((result, index) => {
        // تنظيف النص من العلامات HTML
        const title = result.title?.replace(/<[^>]*>/g, '') || '';
        const snippet = result.snippet?.replace(/<[^>]*>/g, '') || '';
        
        return `[${index + 1}] ${title}\n${snippet}\nالمصدر: ${result.link}\n`;
      })
      .join('\n');

    return formattedResults || 'لم يتم العثور على نتائج مناسبة';

  } catch (error) {
    // معالجة الأخطاء المختلفة
    console.error('Search API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.status === 401) {
      throw new Error('مفتاح API غير صالح');
    }
    
    if (error.response?.status === 429) {
      throw new Error('تم تجاوز حد الطلبات - حاول لاحقاً');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('انتهت مهلة البحث - حاول مرة أخرى');
    }

    throw new Error('فشل في إجراء البحث: ' + error.message);
  }
}

/**
 * تنظيف وتنسيق نتائج البحث
 * @param {string} text - النص المراد تنظيفه
 * @returns {string} - النص المنظف
 */
function cleanSearchResult(text) {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '')           // إزالة وسوم HTML
    .replace(/&nbsp;/g, ' ')           // استبدال رموز HTML
    .replace(/&amp;/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')              // توحيد المسافات
    .trim();
}

/**
 * تحليل نتائج البحث لاستخراج المعلومات المهمة
 * @param {Object[]} results - نتائج البحث
 * @returns {Object} - معلومات مستخلصة
 */
function analyzeSearchResults(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return {
      hasResults: false,
      sources: [],
      summary: 'لا توجد نتائج'
    };
  }

  const sources = results.map(r => ({
    title: cleanSearchResult(r.title),
    url: r.link,
    date: r.date || 'غير محدد'
  }));

  return {
    hasResults: true,
    sources,
    summary: `تم العثور على ${results.length} نتائج`,
    mostRecent: sources[0]
  };
}

module.exports = {
  getWebResults,
  cleanSearchResult,
  analyzeSearchResults
};
