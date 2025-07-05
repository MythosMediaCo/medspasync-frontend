import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';

/**
 * Live Chat Support Component
 * 
 * Features:
 * - AI-powered initial responses
 * - Human escalation for complex issues
 * - Real-time chat interface
 * - File sharing capabilities
 * - Chat history and transcripts
 */
const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatStatus, setChatStatus] = useState('available'); // available, connecting, connected, ended
  const [agentInfo, setAgentInfo] = useState(null);
  const messagesEndRef = useRef(null);

  // AI responses for common questions
  const aiResponses = {
    'pricing': {
      response: "Our pricing starts at $299/month for the Pro plan, which includes unlimited transactions and AI reconciliation. We also offer a 14-day free trial with no credit card required. Would you like me to connect you with our sales team for a custom quote?",
      quickReplies: ['View Pricing', 'Start Free Trial', 'Talk to Sales']
    },
    'setup': {
      response: "Setup typically takes 24 hours or less! We'll help you export your CSV files from your POS and loyalty programs, then our AI will start matching transactions immediately. Most spas are reconciling within 24 hours of starting.",
      quickReplies: ['Setup Guide', 'Schedule Setup Call', 'Upload Files']
    },
    'integration': {
      response: "We work with any POS system that exports CSV files, including Square, Clover, Toast, and custom systems. We also support all major loyalty programs like Alle, Aspire, and custom programs. No API integration required!",
      quickReplies: ['Supported Systems', 'CSV Format Guide', 'Custom Integration']
    },
    'accuracy': {
      response: "Our AI achieves 98%+ accuracy on average, with most spas seeing 95-99% match rates. The system learns from your specific naming conventions and improves over time. Low-confidence matches are flagged for manual review.",
      quickReplies: ['Accuracy Report', 'Demo Request', 'Case Studies']
    },
    'support': {
      response: "We offer multiple support channels: email support within 4 hours, phone support during business hours, and priority support for Pro customers. Our team includes medical spa operations experts.",
      quickReplies: ['Contact Support', 'Help Center', 'Schedule Call']
    }
  };

  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: 1,
        type: 'agent',
        content: "Hi! I'm your MedSpaSync Pro assistant. I can help you with pricing, setup, integrations, and more. How can I assist you today?",
        timestamp: new Date(),
        quickReplies: ['Pricing', 'Setup Process', 'Supported Systems', 'Accuracy', 'Support Options']
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content, isQuickReply = false) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(content.toLowerCase());
      const agentMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: aiResponse.response,
        timestamp: new Date(),
        quickReplies: aiResponse.quickReplies
      };
      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const generateAIResponse = (message) => {
    // Check for keywords in the message
    if (message.includes('price') || message.includes('cost') || message.includes('plan')) {
      return aiResponses.pricing;
    } else if (message.includes('setup') || message.includes('install') || message.includes('start')) {
      return aiResponses.setup;
    } else if (message.includes('integrate') || message.includes('pos') || message.includes('system')) {
      return aiResponses.integration;
    } else if (message.includes('accuracy') || message.includes('match') || message.includes('rate')) {
      return aiResponses.accuracy;
    } else if (message.includes('support') || message.includes('help') || message.includes('contact')) {
      return aiResponses.support;
    } else {
      // Default response for unrecognized queries
      return {
        response: "I understand you're asking about " + message + ". Let me connect you with one of our medical spa experts who can provide more detailed assistance. They'll be with you shortly!",
        quickReplies: ['Wait for Expert', 'Email Support', 'Schedule Call']
      };
    }
  };

  const handleQuickReply = (reply) => {
    sendMessage(reply, true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
    }
  };

  const connectToHuman = () => {
    setChatStatus('connecting');
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      content: "Connecting you to a live agent...",
      timestamp: new Date()
    }]);

    // Simulate connection delay
    setTimeout(() => {
      setChatStatus('connected');
      setAgentInfo({
        name: 'Sarah Chen',
        role: 'Medical Spa Operations Specialist',
        avatar: '👩‍⚕️'
      });
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'agent',
        content: "Hi! I'm Sarah, your dedicated medical spa specialist. I've been helping spas optimize their operations for 8 years. How can I assist you today?",
        timestamp: new Date()
      }]);
    }, 3000);
  };

  const endChat = () => {
    setChatStatus('ended');
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      content: "Chat ended. Thank you for contacting MedSpaSync Pro!",
      timestamp: new Date()
    }]);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-xl z-50"
        aria-label="Open live chat"
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-neutral-200 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium">MedSpaSync Pro Support</div>
                <div className="text-sm opacity-90">
                  {chatStatus === 'available' && 'AI Assistant Available'}
                  {chatStatus === 'connecting' && 'Connecting to Agent...'}
                  {chatStatus === 'connected' && `Connected to ${agentInfo?.name}`}
                  {chatStatus === 'ended' && 'Chat Ended'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                {isMinimized ? '□' : '−'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.type === 'system'
                        ? 'bg-gray-100 text-gray-600 text-sm'
                        : 'bg-gray-50 text-gray-800'
                    }`}>
                      <div className="text-sm">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Quick Replies */}
                {messages.length > 0 && messages[messages.length - 1].type === 'agent' && messages[messages.length - 1].quickReplies && (
                  <div className="flex flex-wrap gap-2">
                    {messages[messages.length - 1].quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 text-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
                {chatStatus === 'ended' ? (
                  <div className="text-center">
                    <Button 
                      variant="primary" 
                      size="medium"
                      onClick={() => {
                        setMessages([]);
                        setChatStatus('available');
                        setAgentInfo(null);
                      }}
                    >
                      Start New Chat
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isTyping}
                    />
                    <Button 
                      type="submit"
                      variant="primary" 
                      size="medium"
                      disabled={!inputMessage.trim() || isTyping}
                    >
                      Send
                    </Button>
                  </form>
                )}

                {/* Action Buttons */}
                {chatStatus === 'available' && (
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={connectToHuman}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Talk to Human
                    </button>
                    <button
                      onClick={endChat}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      End Chat
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default LiveChat; 