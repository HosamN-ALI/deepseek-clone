import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../services/api';
import Message from './Message';
import { FaPaperPlane, FaSearch, FaTrash, FaExpand, FaCompress } from 'react-icons/fa';

const ChatInterface = ({ conversation, setConversation, updateTitle }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // التمرير إلى آخر رسالة
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  // تعديل حجم textarea تلقائياً
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // توليد عنوان للمحادثة
  const generateTitle = async () => {
    if (!conversation.messages[0]?.content) return;
    
    try {
      const prompt = `أنشئ عنواناً مختصراً (3-5 كلمات) للمحادثة التالية:\n\n${conversation.messages[0].content.substring(0, 200)}...`;
      const response = await sendMessage({
        message: prompt,
        searchRequired: false
      });
      
      const title = response.response
        .replace(/["']/g, '')
        .replace(/\n/g, '')
        .substring(0, 50)
        .trim();
      
      if (title) updateTitle(title);
    } catch (error) {
      console.error('Failed to generate title:', error);
    }
  };

  // إرسال الرسالة
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...conversation.messages, userMessage];
    const updatedConversation = { ...conversation, messages: updatedMessages };
    setConversation(updatedConversation);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await sendMessage({
        message: input,
        conversationHistory: updatedMessages,
        searchRequired: isSearchEnabled
      });
      
      // إضافة التفكير العميق إذا وجد
      if (response.reasoning && response.reasoning.trim()) {
        const reasoningMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.reasoning,
          isReasoning: true,
          timestamp: new Date().toISOString()
        };
        
        updatedMessages.push(reasoningMessage);
      }
      
      // إضافة الإجابة النهائية
      const aiMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content: response.response,
        isWebSearch: response.isWebSearch,
        isFinalAnswer: true,
        timestamp: new Date().toISOString()
      };
      
      updatedMessages.push(aiMessage);
      
      setConversation({
        ...updatedConversation,
        messages: updatedMessages
      });
      
      // توليد عنوان إذا كانت المحادثة جديدة
      if (conversation.title === 'محادثة جديدة') {
        generateTitle();
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 3,
        role: 'assistant',
        content: '⚠️ فشل في معالجة طلبك: ' + (error.message || 'خطأ غير معروف'),
        isError: true,
        timestamp: new Date().toISOString()
      };
      
      setConversation({
        ...updatedConversation,
        messages: [...updatedMessages, errorMessage]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // معالجة الضغط على Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // مسح المحادثة
  const clearConversation = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع الرسائل؟')) {
      setConversation({
        ...conversation,
        messages: []
      });
    }
  };

  // تبديل وضع الشاشة الكاملة
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`chat-interface ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* شريط الأدوات */}
      <div className="chat-toolbar">
        <div className="chat-title">
          <h2>{conversation.title}</h2>
          <span className="message-count">
            {conversation.messages.length} رسالة
          </span>
        </div>
        
        <div className="chat-actions">
          <button 
            className="action-btn"
            onClick={() => setIsSearchEnabled(!isSearchEnabled)}
            title={isSearchEnabled ? 'إيقاف البحث الذكي' : 'تفعيل البحث الذكي'}
          >
            <FaSearch className={isSearchEnabled ? 'active' : ''} />
          </button>
          
          <button 
            className="action-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'إغلاق الشاشة الكاملة' : 'شاشة كاملة'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
          
          <button 
            className="action-btn danger"
            onClick={clearConversation}
            title="مسح المحادثة"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      {/* منطقة الرسائل */}
      <div className="messages-container">
        {conversation.messages.length === 0 ? (
          <div className="empty-state">
            <h3>ابدأ محادثة جديدة</h3>
            <p>اكتب رسالتك أدناه لبدء المحادثة مع الذكاء الاصطناعي</p>
            
            <div className="suggestions">
              <h4>اقتراحات:</h4>
              <div className="suggestion-buttons">
                <button 
                  className="suggestion-btn"
                  onClick={() => setInput('ما هي أحدث التطورات في الذكاء الاصطناعي؟')}
                >
                  أحدث التطورات في الذكاء الاصطناعي
                </button>
                <button 
                  className="suggestion-btn"
                  onClick={() => setInput('اشرح لي مفهوم البرمجة الكائنية')}
                >
                  شرح البرمجة الكائنية
                </button>
                <button 
                  className="suggestion-btn"
                  onClick={() => setInput('كيف أتعلم لغة البرمجة Python؟')}
                >
                  تعلم Python
                </button>
              </div>
            </div>
          </div>
        ) : (
          conversation.messages.map(message => (
            <Message 
              key={message.id} 
              message={message}
              isLast={message.id === conversation.messages[conversation.messages.length - 1]?.id}
            />
          ))
        )}
        
        {/* مؤشر التحميل */}
        {isLoading && (
          <div className="loading-message">
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>جاري التفكير...</p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* منطقة الإدخال */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا... (اضغط Enter للإرسال، Shift+Enter لسطر جديد)"
            disabled={isLoading}
            rows={1}
            maxLength={10000}
          />
          
          <div className="input-actions">
            {isSearchEnabled && (
              <div className="search-indicator">
                <FaSearch />
                <span>البحث مفعل</span>
              </div>
            )}
            
            <button 
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              title="إرسال الرسالة"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
        
        <div className="input-info">
          <span className="char-count">
            {input.length}/10000
          </span>
          {isSearchEnabled && (
            <span className="search-status">
              🔍 سيتم البحث في الإنترنت للحصول على معلومات حديثة
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
