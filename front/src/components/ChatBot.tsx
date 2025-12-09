import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import styles from './ChatBot.module.sass';

interface Message {
    text: string;
    isUser: boolean;
}

const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { text: 'Здравствуйте! Чем могу помочь?', isUser: false }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || loading) return;

        const userMessage = inputMessage;
        setInputMessage('');
        setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
        setLoading(true);

        try {
            const response = await api.post('/api/chatbot/message', {
                message: userMessage
            });
            setMessages(prev => [...prev, { text: response.data.response, isUser: false }]);
        } catch (err: any) {
            setMessages(prev => [...prev, { 
                text: 'Извините, произошла ошибка. Попробуйте позже.', 
                isUser: false 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {!isOpen && (
                <button 
                    className={styles.chatButton}
                    onClick={() => setIsOpen(true)}
                >
                    💬 Чат-бот
                </button>
            )}
            {isOpen && (
                <div className={styles.chatBot}>
                    <div className={styles.chatHeader}>
                        <h3>Чат-бот помощник</h3>
                        <button onClick={() => setIsOpen(false)}>✕</button>
                    </div>
                    <div className={styles.chatMessages}>
                        {messages.map((msg, idx) => (
                            <div 
                                key={idx} 
                                className={`${styles.message} ${msg.isUser ? styles.userMessage : styles.botMessage}`}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div className={`${styles.message} ${styles.botMessage}`}>
                                Думаю...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className={styles.chatInput}>
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Введите сообщение..."
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading}>Отправить</button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatBot;


