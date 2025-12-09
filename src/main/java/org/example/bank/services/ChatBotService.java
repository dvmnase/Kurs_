package org.example.bank.services;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ChatBotService {

    private final Map<String, String> responses = new HashMap<>();

    public ChatBotService() {
        // Инициализация ответов чат-бота
        responses.put("привет", "Здравствуйте! Чем могу помочь?");
        responses.put("помощь", "Я могу помочь вам с:\n- Управлением грузами\n- Созданием заявок\n- Поиском перевозчиков\n- Отслеживанием маршрутов");
        responses.put("как создать груз", "Для создания груза перейдите в раздел 'Мои грузы' и нажмите 'Создать груз'. Заполните название, описание и вес.");
        responses.put("как создать заявку", "Для создания заявки перейдите в раздел 'Заявки' и нажмите 'Создать заявку'. Выберите груз и перевозчика.");
        responses.put("как найти перевозчика", "Вы можете найти перевозчика через поиск или просмотреть доступные заявки в разделе 'Заявки'.");
        responses.put("спасибо", "Пожалуйста! Обращайтесь, если нужна помощь.");
    }

    public String processMessage(String message) {
        String lowerMessage = message.toLowerCase().trim();
        
        // Простой поиск по ключевым словам
        for (Map.Entry<String, String> entry : responses.entrySet()) {
            if (lowerMessage.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        
        // Если не найдено, возвращаем стандартный ответ
        return "Извините, я не понял ваш вопрос. Попробуйте спросить о помощи, создании груза или заявки.";
    }
}


