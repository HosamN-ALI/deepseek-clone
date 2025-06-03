require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const errorHandler = require('./middleware/errorHandler');
const {
  shouldSearchWeb,
  extractKeywords
} = require('./utils/aiUtils');
const { getWebResults } = require('./utils/searchUtils');

const app = express();
const port = process.env.PORT || 5000;

// تحسين إعدادات CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 ساعة
}));

// تحسين معالجة الطلبات الكبيرة
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// متغيرات البيئة
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

// التحقق من وجود المفاتيح المطلوبة
if (!DEEPSEEK_API_KEY) {
  console.warn('⚠️  تحذير: مفتاح DeepSeek API غير موجود');
}

if (!SERPAPI_KEY) {
  console.warn('⚠️  تحذير: مفتاح SerpAPI غير موجود - البحث الذكي معطل');
}

// نقطة نهاية الصحة
app.get('/api/health', (req, res) => {
  res.json({
    status: 'active',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      deepseek: DEEPSEEK_API_KEY ? 'connected' : 'missing_key',
      search: SERPAPI_KEY ? 'connected' : 'missing_key'
    }
  });
});

// التواصل مع DeepSeek API مع تمكين التفكير العميق
async function getAIResponseWithReasoning(prompt, maxTokens = 2000) {
  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('مفتاح DeepSeek API غير متوفر');
    }

    const systemMessage = {
      role: 'system',
      content: 'أنت مساعد ذكي متقدم. عند الإجابة على أي سؤال، اتبع هذا التنسيق:\n\n' +
        '[التفكير العميق]:\n' +
        '- حلل السؤال بدقة\n' +
        '- فكر خطوة بخطوة في الحل\n' +
        '- اعتبر جميع الجوانب المهمة\n' +
        '- اكتب خطوات تفكيرك بوضوح\n\n' +
        '[الإجابة النهائية]:\n' +
        '- قدم إجابة شاملة ومفيدة\n' +
        '- استخدم أمثلة عملية عند الحاجة\n' +
        '- تأكد من دقة المعلومات\n\n' +
        'يجب أن تكون إجاباتك باللغة العربية ومفهومة وشاملة.'
    };

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [systemMessage, { role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: maxTokens,
        stream: false
      },
      {
        headers: { 
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json' 
        },
        timeout: 30000
      }
    );
    
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('استجابة غير صالحة من DeepSeek API');
    }
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('مفتاح DeepSeek API غير صالح');
    } else if (error.response?.status === 429) {
      throw new Error('تم تجاوز حد الطلبات - حاول مرة أخرى لاحقاً');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('انتهت مهلة الاتصال - حاول مرة أخرى');
    }
    
    throw new Error('فشل في الحصول على استجابة من الذكاء الاصطناعي');
  }
}

// دالة التحقق من صحة طلب المحادثة
function validateChatRequest(reqBody) {
  const errors = [];
  
  if (!reqBody.message || typeof reqBody.message !== 'string' || reqBody.message.trim() === '') {
    errors.push('الرسالة مطلوبة ويجب أن تكون نصية غير فارغة');
  }
  
  if (reqBody.message && reqBody.message.length > 10000) {
    errors.push('الرسالة طويلة جداً (الحد الأقصى 10000 حرف)');
  }
  
  if (reqBody.conversationHistory && !Array.isArray(reqBody.conversationHistory)) {
    errors.push('سجل المحادثة يجب أن يكون مصفوفة');
  }
  
  if (reqBody.searchRequired !== undefined && typeof reqBody.searchRequired !== 'boolean') {
    errors.push('حالة البحث يجب أن تكون قيمة منطقية');
  }
  
  return errors;
}

// معالجة المحادثة الرئيسية
app.post('/api/chat', async (req, res, next) => {
  try {
    // التحقق من صحة الطلب
    const validationErrors = validateChatRequest(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'بيانات غير صالحة', 
        details: validationErrors 
      });
    }

    const { message, conversationHistory = [], searchRequired = false } = req.body;
    
    // تنظيف الرسالة
    const cleanMessage = message.trim();
    
    // تحديد حاجة البحث
    let requiresSearch = searchRequired;
    if (!requiresSearch) {
      try {
        requiresSearch = await shouldSearchWeb(cleanMessage);
      } catch (error) {
        console.warn('فشل في تحديد حاجة البحث:', error.message);
        requiresSearch = false;
      }
    }
    
    // البحث إذا مطلوب
    let webData = '';
    if (requiresSearch && SERPAPI_KEY) {
      try {
        const keywords = extractKeywords(cleanMessage);
        if (keywords && keywords.trim()) {
          webData = await getWebResults(keywords, SERPAPI_KEY);
        }
      } catch (error) {
        console.warn('فشل في البحث:', error.message);
        webData = '';
      }
    }

    // بناء البرومبت الذكي
    let prompt = cleanMessage;
    if (requiresSearch && webData) {
      prompt = `[معلومات من البحث]:\n${webData}\n\n[السؤال الأصلي]: ${cleanMessage}\n\n[تعليمات]: استخدم المعلومات من البحث لتقديم إجابة دقيقة ومحدثة. إذا لم تجد معلومات كافية في نتائج البحث، اذكر ذلك واعتمد على معرفتك العامة.`;
    }
    
    // إضافة سياق المحادثة إذا وجد
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory
        .slice(-6) // آخر 6 رسائل فقط لتوفير الذاكرة
        .map(msg => `${msg.role === 'user' ? 'المستخدم' : 'المساعد'}: ${msg.content}`)
        .join('\n');
      
      prompt = `[سياق المحادثة السابقة]:\n${recentHistory}\n\n[الرسالة الحالية]: ${prompt}`;
    }
    
    // التواصل مع DeepSeek API
    const aiResponse = await getAIResponseWithReasoning(prompt);
    
    // تحليل الاستجابة لفصل التفكير عن الإجابة
    const reasoningMatch = aiResponse.match(/\[التفكير العميق\]:\s*([\s\S]*?)\n\n\[الإجابة النهائية\]:/);
    const finalAnswerMatch = aiResponse.match(/\[الإجابة النهائية\]:\s*([\s\S]*)/);
    
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';
    const finalAnswer = finalAnswerMatch ? finalAnswerMatch[1].trim() : aiResponse;
    
    // إرسال الاستجابة
    res.json({
      response: finalAnswer || 'عذراً، لم أتمكن من تكوين إجابة مناسبة.',
      reasoning: reasoning || '',
      isWebSearch: requiresSearch,
      searchData: webData ? 'تم استخدام نتائج البحث' : '',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// نقطة نهاية لاختبار الاتصال
app.get('/api/test', (req, res) => {
  res.json({
    message: 'الخادم يعمل بشكل طبيعي',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// معالجة الطرق غير الموجودة
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'الطريق غير موجود',
    message: `لم يتم العثور على ${req.method} ${req.originalUrl}`
  });
});

// معالجة الأخطاء
app.use(errorHandler);

// تشغيل الخادم
app.listen(port, () => {
  console.log(`✅ خادم DeepSeek Clone يعمل على المنفذ ${port}`);
  console.log(`🌐 الرابط: http://localhost:${port}`);
  console.log(`🔑 DeepSeek API: ${DEEPSEEK_API_KEY ? '✅ متصل' : '❌ غير متوفر'}`);
  console.log(`🔍 Search API: ${SERPAPI_KEY ? '✅ متصل' : '❌ غير متوفر'}`);
});

// معالجة إغلاق الخادم بشكل نظيف
process.on('SIGTERM', () => {
  console.log('🛑 إيقاف الخادم...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 إيقاف الخادم...');
  process.exit(0);
});
