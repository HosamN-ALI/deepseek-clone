import React, { useState } from 'react';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const Sidebar = ({ 
  isOpen, 
  conversations, 
  currentId, 
  onSelect, 
  onNewChat, 
  onDelete, 
  onUpdateTitle,
  onClose
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // معالجة النقر على زر التعديل
  const handleEditClick = (conversation, e) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  // معالجة حفظ العنوان الجديد
  const handleSaveTitle = (id, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onUpdateTitle(id, editTitle);
    }
    setEditingId(null);
    setEditTitle('');
  };

  // معالجة إلغاء التعديل
  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  // معالجة النقر على زر الحذف
  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
    // إخفاء تأكيد الحذف بعد 3 ثواني
    setTimeout(() => setDeleteConfirmId(null), 3000);
  };

  // معالجة تأكيد الحذف
  const handleConfirmDelete = (id, e) => {
    e.stopPropagation();
    onDelete(id);
    setDeleteConfirmId(null);
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // أقل من يوم
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // أقل من أسبوع
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      return days[date.getDay()];
    }
    
    // أكثر من أسبوع
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* رأس الشريط الجانبي */}
      <div className="sidebar-header">
        <button 
          className="new-chat-btn primary-btn"
          onClick={onNewChat}
        >
          <FaPlus />
          <span>محادثة جديدة</span>
        </button>
        
        <button 
          className="close-sidebar"
          onClick={onClose}
          title="إغلاق"
        >
          <FaTimes />
        </button>
      </div>
      
      {/* قائمة المحادثات */}
      <div className="conversations-list">
        {conversations.length === 0 ? (
          <div className="empty-conversations">
            <p>لا توجد محادثات</p>
            <button 
              className="start-chat-btn"
              onClick={onNewChat}
            >
              ابدأ محادثتك الأولى
            </button>
          </div>
        ) : (
          conversations.map(conversation => (
            <div 
              key={conversation.id} 
              className={`conversation-item ${currentId === conversation.id ? 'active' : ''}`}
              onClick={() => onSelect(conversation)}
            >
              {editingId === conversation.id ? (
                // نموذج تعديل العنوان
                <div className="edit-title-container" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={50}
                    autoFocus
                    placeholder="أدخل عنواناً جديداً"
                  />
                  <div className="edit-actions">
                    <button 
                      className="save-btn"
                      onClick={(e) => handleSaveTitle(conversation.id, e)}
                      disabled={!editTitle.trim()}
                      title="حفظ"
                    >
                      <FaCheck />
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                      title="إلغاء"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* معلومات المحادثة */}
                  <div className="conversation-info">
                    <div className="conversation-title">
                      {conversation.title}
                    </div>
                    <div className="conversation-meta">
                      <span className="message-count">
                        {conversation.messages?.length || 0} رسالة
                      </span>
                      <span className="conversation-date">
                        {formatDate(conversation.updatedAt)}
                      </span>
                    </div>
                  </div>
                  
                  {/* أزرار الإجراءات */}
                  <div className="conversation-actions">
                    <button 
                      className="action-btn"
                      onClick={(e) => handleEditClick(conversation, e)}
                      title="تعديل العنوان"
                    >
                      <FaEdit />
                    </button>
                    
                    {deleteConfirmId === conversation.id ? (
                      <button 
                        className="action-btn delete-confirm"
                        onClick={(e) => handleConfirmDelete(conversation.id, e)}
                        title="تأكيد الحذف"
                      >
                        <FaExclamationTriangle />
                      </button>
                    ) : (
                      <button 
                        className="action-btn delete"
                        onClick={(e) => handleDeleteClick(conversation.id, e)}
                        title="حذف المحادثة"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* تذييل الشريط الجانبي */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">أ</div>
          <div className="user-name">المستخدم</div>
        </div>
        <div className="app-version">الإصدار 1.0.0</div>
      </div>
    </div>
  );
};

export default Sidebar;
