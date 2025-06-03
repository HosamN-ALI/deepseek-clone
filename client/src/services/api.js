import axios from 'axios';

// تعيين عنوان URL للخادم الخلفي
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// إنشاء instance من axios مع إعدادات افتراضية
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // مهلة 60 ثانية
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'ar'
  }
});

// إضافة interceptor للطلبات
apiClient.interceptors.request.use(
  (config) => {
    // إضافة timestamp لتجنب cache
    config.params = {
      ...config.params,
      _t: Date.now()
    };
    
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// إضافة interceptor للاستجابات
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return Promise.reject(error);
  }
);

/**
 * إرسال رسالة إلى الذكاء الاصطناعي
 * @param {Object} data - بيانات الرسالة
 * @param {string} data.message - نص الرسالة
 * @param {Array} data.conversationHistory - سجل المحادثة
 * @param {boolean} data.searchRequired - هل البحث مطلوب
 * @returns {Promise<Object>} - استجابة الذكاء الاصطناعي
 */
export const sendMessage = async (data) => {
  try {
    // التحقق من صحة البيانات
    if (!data.message || typeof data.message !== 'string' || data.message.trim() === '') {
      throw new Error('الرسالة مطلوبة ويجب أن تكون نصية');
    }

    const response = await apiClient.post('/chat', {
      message: data.message.trim(),
      conversationHistory: data.conversationHistory || [],
      searchRequired: Boolean(data.searchRequired)
    });
    
    if (response.status !== 200) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    
    // التحقق من وجود الاستجابة
    if (!response.data || !response.data.response) {
      throw new Error('استجابة غير صالحة من الخادم');
    }
    
    return {
      response: response.data.response,
      reasoning: response.data.reasoning || '',
      isWebSearch: Boolean(response.data.isWebSearch),
      searchData: response.data.searchData || '',
      timestamp: response.data.timestamp || new Date().toISOString()
    };
    
  } catch (error) {
    console.error('API Error:', error);
    
    // معالجة أنواع مختلفة من الأخطاء
    let errorMessage = 'فشل الاتصال بالخادم';
    
    if (error.response) {
      // خطأ من الخادم
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          errorMessage = data.message || 'بيانات غير صالحة';
          break;
        case 401:
          errorMessage = 'غير مصرح بالوصول';
          break;
        case 429:
          errorMessage = 'تم تجاوز حد الطلبات - حاول لاحقاً';
          break;
        case 500:
          errorMessage = data.message || 'خطأ في الخادم';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'الخادم غير متاح حالياً';
          break;
        default:
          errorMessage = data.message || `خطأ في الخادم (${status})`;
      }
    } else if (error.request) {
      // لا يوجد استجابة
      errorMessage = 'لا يوجد استجابة من الخادم - تحقق من الاتصال';
    } else if (error.code === 'ECONNABORTED') {
      // انتهت المهلة
      errorMessage = 'انتهت مهلة الاتصال - حاول مرة أخرى';
    } else {
      // خطأ آخر
      errorMessage = error.message || 'خطأ غير متوقع';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * تحميل البيانات الأولية للتطبيق
 * @returns {Promise<Object>} - حالة الخادم والخدمات
 */
export const fetchInitialData = async () => {
  try {
    const response = await apiClient.get('/health', {
      timeout: 5000 // مهلة أقصر للفحص الأولي
    });
    
    return {
      status: response.data.status || 'unknown',
      version: response.data.version || '1.0.0',
      message: 'الخادم متصل ويعمل بشكل طبيعي',
      services: response.data.services || {},
      timestamp: response.data.timestamp
    };
    
  } catch (error) {
    console.error('Initialization error:', error);
    
    return { 
      status: 'offline', 
      version: '1.0.0',
      message: 'الخادم غير متاح حالياً - سيعمل التطبيق في وضع محدود',
      services: {
        deepseek: 'unknown',
        search: 'unknown'
      },
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * اختبار الاتصال بالخادم
 * @returns {Promise<boolean>} - هل الخادم متاح
 */
export const testConnection = async () => {
  try {
    const response = await apiClient.get('/test', {
      timeout: 3000
    });
    return response.status === 200;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

/**
 * معالجة الأخطاء العامة
 * @param {Error} error - الخطأ
 * @returns {string} - رسالة خطأ مفهومة
 */
export const handleApiError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message;
    
    switch (status) {
      case 400:
        return message || 'طلب غير صالح';
      case 401:
        return 'غير مصرح بالوصول';
      case 403:
        return 'ممنوع الوصول';
      case 404:
        return 'الصفحة غير موجودة';
      case 429:
        return 'تم تجاوز حد الطلبات';
      case 500:
        return 'خطأ في الخادم';
      case 502:
        return 'خطأ في البوابة';
      case 503:
        return 'الخدمة غير متاحة';
      case 504:
        return 'انتهت مهلة البوابة';
      default:
        return message || `خطأ غير معروف (${status})`;
    }
  } else if (error.request) {
    return 'لا يوجد استجابة من الخادم';
  } else {
    return error.message || 'خطأ غير متوقع';
  }
};

export default {
  sendMessage,
  fetchInitialData,
  testConnection,
  handleApiError
};
