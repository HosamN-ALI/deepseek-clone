import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './styles/main.css';

function App() {
  // إدارة حالة المحادثات
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('conversations');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse conversations:', e);
      return [];
    }
  });
  
  // المحادثة الحالية
  const [currentConversation, setCurrentConversation] = useState(null);
  
  // حالة الشريط الجانبي
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // حالة التطبيق
  const [appStatus, setAppStatus] = useState({
    status: 'loading',
    message: 'جاري التحميل...'
  });

  // استعادة المحادثة الأخيرة عند التحميل
  useEffect(() => {
    if (conversations.length > 0) {
      const lastActiveId = localStorage.getItem('lastActiveConversation');
      const conversation = conversations.find(c => c.id === lastActiveId) || conversations[0];
      setCurrentConversation(conversation);
    }
  }, [conversations]);

  // حفظ المحادثات في التخزين المحلي
  useEffect(() => {
    try {
      localStorage.setItem('conversations', JSON.stringify(conversations));
      if (currentConversation) {
        localStorage.setItem('lastActiveConversation', currentConversation.id);
      }
    } catch (e) {
      console.error('Failed to save conversations:', e);
    }
  }, [conversations, currentConversation]);

  // التعامل مع تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // إنشاء محادثة جديدة
  const createNewConversation = () => {
    const newConversation = {
      id: Date.now().toString(),
      title: 'محادثة جديدة',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // حذف محادثة
  const deleteConversation = (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المحادثة؟')) {
      return;
    }

    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    if (currentConversation?.id === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setCurrentConversation(remaining.length > 0 ? remaining[0] : null);
    }
  };

  // تحديث عنوان المحادثة
  const updateConversationTitle = (id, newTitle) => {
    if (!newTitle.trim()) return;

    setConversations(prev => 
      prev.map(conv => 
        conv.id === id 
          ? { 
              ...conv, 
              title: newTitle.trim(),
              updatedAt: new Date().toISOString() 
            } 
          : conv
      )
    );
  };

  // تحديث محادثة
  const updateConversation = (updatedConv) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === updatedConv.id 
          ? { 
              ...updatedConv, 
              updatedAt: new Date().toISOString() 
            } 
          : conv
      )
    );
    setCurrentConversation(updatedConv);
  };

  return (
    <div className="app" dir="rtl">
      <Header 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onCreateNew={createNewConversation}
      />
      
      <div className="main-container">
        <Sidebar 
          isOpen={isSidebarOpen}
          conversations={conversations}
          currentId={currentConversation?.id}
          onSelect={(conv) => {
            setCurrentConversation(conv);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          onNewChat={createNewConversation}
          onDelete={deleteConversation}
          onUpdateTitle={updateConversationTitle}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <div className="chat-container">
          {currentConversation ? (
            <ChatInterface 
              key={currentConversation.id}
              conversation={currentConversation}
              setConversation={updateConversation}
              updateTitle={(title) => updateConversationTitle(currentConversation.id, title)}
            />
          ) : (
            <div className="welcome-screen">
              <div className="welcome-content">
                <h1>مرحباً بك في DeepSeek Clone</h1>
                <p>{appStatus.message}</p>
                
                {appStatus.status === 'error' ? (
                  <div className="error-alert">
                    <p>تعذر الاتصال بالخادم. بعض الميزات قد لا تعمل.</p>
                  </div>
                ) : null}
                
                <button 
                  className="new-chat-btn"
                  onClick={createNewConversation}
                >
                  + بدء محادثة جديدة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
