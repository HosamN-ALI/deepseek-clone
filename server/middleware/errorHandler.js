/**
 * معالج الأخطاء المركزي للخادم
 * يقوم بمعالجة جميع الأخطاء وتنسيق الاستجابة بشكل موحد
 */
function errorHandler(err, req, res, next) {
  // تسجيل الخطأ مع التفاصيل
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  
  // تحديد نوع الخطأ وترميز الحالة
  let statusCode = 500;
  let errorMessage = 'خطأ داخلي في الخادم';
  let errorDetails = [];
  
  // معالجة أنواع مختلفة من الأخطاء
  if (err.response) {
    // خطأ من API خارجي
    statusCode = err.response.status || 502;
    errorMessage = err.response.data?.error?.message || 
                  `خطأ في خدمة خارجية: ${err.response.statusText}`;
    errorDetails = err.response.data?.error?.details || [];
  } else if (err.request) {
    // لا يوجد استجابة من الخدمة الخارجية
    statusCode = 504;
    errorMessage = 'لا يوجد استجابة من الخادم الخارجي';
    errorDetails = ['تأكد من اتصال الإنترنت وحاول مرة أخرى'];
  } else if (err.name === 'ValidationError') {
    // خطأ في التحقق من صحة البيانات
    statusCode = 400;
    errorMessage = 'بيانات غير صالحة';
    errorDetails = Array.isArray(err.errors) ? err.errors : [err.message];
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    // خطأ في حجم الملف
    statusCode = 413;
    errorMessage = 'حجم الملف كبير جداً';
    errorDetails = ['يجب أن لا يتجاوز حجم الملف الحد المسموح به'];
  } else if (err.code === 'ECONNREFUSED') {
    // خطأ في الاتصال
    statusCode = 503;
    errorMessage = 'الخدمة غير متوفرة حالياً';
    errorDetails = ['تعذر الاتصال بالخدمة الخارجية'];
  } else if (err.status) {
    // خطأ مع رمز حالة معرف
    statusCode = err.status;
    errorMessage = err.message;
    errorDetails = err.details || [];
  }
  
  // إرسال الرد المناسب
  res.status(statusCode).json({
    error: true,
    message: errorMessage,
    details: errorDetails,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    // إضافة معلومات التتبع في وضع التطوير فقط
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      debug: {
        method: req.method,
        query: req.query,
        body: req.body,
        headers: req.headers
      }
    })
  });
}

module.exports = errorHandler;
