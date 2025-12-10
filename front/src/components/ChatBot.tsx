import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatBot.module.sass';

interface Message {
    text: string;
    isUser: boolean;
}

const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { text: 'Здравствуйте! Я ваш помощник. Выберите вопрос из меню или задайте свой вопрос.', isUser: false }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [showMenu, setShowMenu] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatMessagesRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    };

    const prevMessagesLengthRef = useRef<number>(0);
    
    useEffect(() => {
        // Прокручиваем только если появилось новое сообщение, и только внутри контейнера чата
        if (messages.length > prevMessagesLengthRef.current && chatMessagesRef.current) {
            setTimeout(() => {
                scrollToBottom();
            }, 100);
            prevMessagesLengthRef.current = messages.length;
        }
    }, [messages]);

    const handleQuestionClick = (question: string) => {
        setShowMenu(false);
        setMessages(prev => [...prev, { text: question, isUser: true }]);
        
        let answer = '';
        switch (question) {
            case 'Как создать груз':
                answer = `Для создания груза выполните следующие шаги:

1. Перейдите на страницу "Мои грузы"
2. Нажмите кнопку "Создать груз"
3. Заполните форму:
   - Название груза (обязательно)
   - Описание (необязательно)
   - Вес груза (необязательно)
   - Адрес или координаты местоположения груза
4. Вы можете ввести адрес вручную или использовать кнопку "Определить местоположение" для автоматического определения
5. После заполнения всех данных нажмите "Создать"

Груз будет сохранен и появится в списке ваших грузов.`;
                break;
            case 'Как создать заявку':
                answer = `Для создания заявки на перевозку:

1. Перейдите на страницу "Заявки"
2. Нажмите кнопку "Создать заявку"
3. Заполните форму:
   - Выберите груз из списка ваших грузов
   - Выберите перевозчика (или оставьте "Не назначен")
   - Укажите дату забора груза
   - Укажите дату доставки
   - Добавьте комментарий (необязательно)
4. Нажмите "Создать заявку"

После создания заявка получит статус "Новая". Перевозчик сможет принять или отклонить заявку.`;
                break;
            case 'Как понять, какой будет маршрут':
                answer = `Маршрут определяется следующим образом:

1. После того, как перевозчик примет вашу заявку (статус "Принята"), он может предложить маршрут
2. Перевозчик в чате нажимает "Предложить маршрут"
3. Он указывает адрес отправления и адрес прибытия
4. Система автоматически строит маршрут на карте и рассчитывает расстояние и время в пути
5. Перевозчик отправляет предложенный маршрут вам в чат
6. Вы видите карту с маршрутом, адресами, расстоянием и временем в пути
7. Если маршрут вас устраивает, нажмите "Подтвердить маршрут"

После подтверждения маршрут сохраняется и становится доступным для просмотра в заявке.`;
                break;
            case 'Как отслеживать груз':
                answer = `Отслеживание груза происходит через заявки:

1. Перейдите на страницу "Заявки"
2. Найдите нужную заявку в списке
3. Статус заявки показывает текущее состояние:
   - "Новая" - заявка создана, ожидает принятия
   - "Ожидает" - заявка отправлена перевозчику
   - "Принята" - перевозчик принял заявку
   - "В процессе" - перевозка началась
   - "Отклонена" - перевозчик отклонил заявку
   - "Отменена" - заявка отменена

4. Если маршрут подтвержден, вы можете нажать "Просмотреть маршрут" для детальной информации
5. Общайтесь с перевозчиком в чате для получения актуальной информации о местоположении груза`;
                break;
            case 'Как общаться с перевозчиком':
                answer = `Общение с перевозчиком происходит через чат:

1. Перейдите на страницу "Чаты" или откройте чат из заявки
2. Чат становится доступен после того, как перевозчик примет заявку (статус "Принята")
3. В чате вы можете:
   - Отправлять текстовые сообщения
   - Получать предложенные маршруты от перевозчика
   - Подтверждать предложенные маршруты
   - Просматривать карту с маршрутом

4. Перевозчик может предложить маршрут, указав адреса отправления и прибытия
5. Вы увидите карту с маршрутом, расстоянием и временем в пути
6. Если маршрут подходит, нажмите "Подтвердить маршрут"

Все сообщения сохраняются в истории чата.`;
                break;
            case 'Как оставить отзыв':
                answer = `Для оставления отзыва перевозчику:

1. Перейдите на страницу "Заявки"
2. Найдите заявку, по которой хотите оставить отзыв
3. Убедитесь, что заявка имеет назначенного перевозчика
4. Нажмите кнопку "Оставить отзыв" рядом с заявкой
5. В открывшемся окне:
   - Выберите оценку от 1 до 5 звезд
   - Напишите комментарий (необязательно, но рекомендуется)
6. Нажмите "Отправить отзыв"

Отзыв будет сохранен и станет виден другим пользователям при просмотре информации о перевозчике. Вы можете оставить только один отзыв на одного перевозчика.`;
                break;
            default:
                answer = 'Извините, я не понял ваш вопрос. Пожалуйста, выберите вопрос из меню или переформулируйте свой вопрос.';
        }
        
        setTimeout(() => {
            setMessages(prev => [...prev, { text: answer, isUser: false }]);
            setShowMenu(true);
        }, 300);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMessage = inputMessage;
        setInputMessage('');
        setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
        setShowMenu(true);
        
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                text: 'Я понимаю ваш вопрос. Пожалуйста, выберите подходящий вопрос из меню выше, чтобы получить подробный ответ.', 
                isUser: false 
            }]);
        }, 500);
    };

    const handleReset = () => {
        setMessages([{ text: 'Здравствуйте! Я ваш помощник. Выберите вопрос из меню или задайте свой вопрос.', isUser: false }]);
        setShowMenu(true);
    };

    const questions = [
        'Как создать груз',
        'Как создать заявку',
        'Как понять, какой будет маршрут',
        'Как отслеживать груз',
        'Как общаться с перевозчиком',
        'Как оставить отзыв'
    ];

    return (
        <>
            {!isOpen && (
                <button 
                    className={styles.chatButton}
                    onClick={() => setIsOpen(true)}
                >
                    Чат-бот
                </button>
            )}
            {isOpen && (
                <div className={styles.chatBot}>
                    <div className={styles.chatHeader}>
                        <h3>Чат-бот помощник</h3>
                        <div className={styles.chatHeaderButtons}>
                            <button onClick={handleReset} className={styles.resetButton}>Сбросить</button>
                            <button onClick={() => setIsOpen(false)} className={styles.closeButton}>×</button>
                        </div>
                    </div>
                    <div className={styles.chatMessages} ref={chatMessagesRef}>
                        {messages.map((msg, idx) => (
                            <div 
                                key={idx} 
                                className={`${styles.message} ${msg.isUser ? styles.userMessage : styles.botMessage}`}
                                style={msg.isUser ? { color: 'white', background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)' } : {}}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {showMenu && (
                            <div className={styles.menuContainer}>
                                <div className={styles.menuTitle}>Часто задаваемые вопросы:</div>
                                <div className={styles.menuButtons}>
                                    {questions.map((question, idx) => (
                                        <button
                                            key={idx}
                                            className={styles.menuButton}
                                            onClick={() => handleQuestionClick(question)}
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className={styles.chatInput}>
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Введите свой вопрос..."
                            disabled={false}
                        />
                        <button type="submit">Отправить</button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatBot;
