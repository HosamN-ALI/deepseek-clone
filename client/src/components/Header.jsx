import React from 'react';
import { FaBars, FaPlus, FaGithub, FaQuestionCircle } from 'react-icons/fa';

const Header = ({ onMenuClick, onCreateNew }) => {
  return (
    <header className="app-header">
      {/* القسم الأيمن */}
      <div className="header-right">
        <button 
          className="menu-btn"
          onClick={onMenuClick}
          title="القائمة"
        >
          <FaBars />
        </button>
        
        <div className="logo">
          <div className="logo-icon">DS</div>
          <span className="logo-text">DeepSeek Clone</span>
        </div>
      </div>
      
      {/* القسم الأوسط */}
      <div className="header-center">
        <nav className="header-nav">
          <button className="nav-item active">
            المحادثة
          </button>
          <button className="nav-item">
            الإعدادات
          </button>
          <button className="nav-item">
            المساعدة
          </button>
        </nav>
      </div>
      
      {/* القسم الأيسر */}
      <div className="header-left">
        {/* أزرار الإجراءات */}
        <div className="header-actions">
          <button 
            className="action-btn"
            onClick={() => window.open('https://github.com/yourusername/deepseek-clone', '_blank')}
            title="GitHub"
          >
            <FaGithub />
          </button>
          
          <button 
            className="action-btn"
            onClick={() => window.open('/help', '_blank')}
            title="المساعدة"
          >
            <FaQuestionCircle />
          </button>
          
          <button 
            className="new-chat-btn"
            onClick={onCreateNew}
            title="محادثة جديدة"
          >
            <FaPlus />
          </button>
        </div>
      </div>
      
      {/* شريط التقدم للطلبات النشطة */}
      <div className="header-progress">
        <div className="progress-bar">
          <div 
            className="progress-value" 
            style={{ 
              width: '0%',
              opacity: 0 
            }} 
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
