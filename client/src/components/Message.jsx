import React, { useState } from 'react';
import { FaCopy, FaCheck, FaSearch } from 'react-icons/fa';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const Message = ({ message, isLast }) => {
  const [isCopied, setIsCopied] = useState(false);

  // نسخ محتوى الرسالة
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // تحديد نوع المحتوى (نص عادي أو كود)
  const formatContent = (content) => {
    if (!content) return [];

    const parts = [];
    let currentText = '';
    let inCodeBlock = false;
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // البحث عن بداية ونهاية الكود
      if (line.startsWith('```')) {
        if (currentText) {
          parts.push({ type: 'text', content: currentText });
          currentText = '';
        }
        inCodeBlock = !inCodeBlock;
        
        if (inCodeBlock) {
          // استخراج لغة البرمجة إن وجدت
          const language = line.slice(3).trim();
          parts.push({ type: 'code-start', language });
        } else {
          parts.push({ type: 'code-end' });
        }
      } else {
        if (inCodeBlock) {
          parts.push({ type: 'code-line', content: line });
        } else {
          currentText += line + (index < lines.length - 1 ? '\n' : '');
        }
      }
    });

    if (currentText) {
      parts.push({ type: 'text', content: currentText });
    }

    return parts;
  };

  // تحويل الروابط إلى عناصر قابلة للنقر
  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="message-link"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // تجميع أجزاء الكود المتتالية
  const combineCodeParts = (parts) => {
    const combined = [];
    let currentCode = null;

    parts.forEach(part => {
      if (part.type === 'code-start') {
        currentCode = {
          type: 'code-block',
          language: part.language,
          content: ''
        };
      } else if (part.type === 'code-line' && currentCode) {
        currentCode.content += part.content + '\n';
      } else if (part.type === 'code-end' && currentCode) {
        combined.push(currentCode);
        currentCode = null;
      } else if (part.type === 'text') {
        combined.push(part);
      }
    });

    return combined;
  };

  // تحديد نوع الرسالة وتنسيقها
  const messageClass = `message ${message.role} ${message.isReasoning ? 'reasoning' : ''} ${message.isError ? 'error' : ''}`;
  const formattedParts = combineCodeParts(formatContent(message.content));

  return (
    <div className={messageClass}>
      {/* أيقونة المستخدم */}
      <div className="message-avatar">
        {message.role === 'user' ? 'أ' : 'AI'}
      </div>

      <div className="message-content">
        {/* مؤشر البحث */}
        {message.isWebSearch && (
          <div className="search-indicator">
            <FaSearch />
            <span>تم استخدام البحث الذكي</span>
          </div>
        )}

        {/* محتوى الرسالة */}
        <div className="message-text">
          {formattedParts.map((part, index) => {
            if (part.type === 'text') {
              return (
                <p key={index} className="text-content">
                  {renderTextWithLinks(part.content)}
                </p>
              );
            } else if (part.type === 'code-block') {
              return (
                <div key={index} className="code-block">
                  <div className="code-header">
                    <span className="code-language">
                      {part.language || 'code'}
                    </span>
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(part.content)}
                      title="نسخ الكود"
                    >
                      {isCopied ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language={part.language || 'javascript'}
                    style={atomOneDark}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0 0 4px 4px'
                    }}
                  >
                    {part.content}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* معلومات إضافية */}
        <div className="message-info">
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString('ar-SA')}
          </span>
          <button
            className="copy-btn"
            onClick={() => copyToClipboard(message.content)}
            title="نسخ الرسالة"
          >
            {isCopied ? <FaCheck /> : <FaCopy />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Message;
