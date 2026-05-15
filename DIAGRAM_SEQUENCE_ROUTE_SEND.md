# Диаграмма последовательности: Отправка маршрута

## Файлы, участвующие в процессе

1. **front/src/components/RequestChat.tsx**
   - Компонент React, содержащий функцию `sendRoute()`
   - Определяет интерфейс `RouteData`
   - Управляет состоянием маршрута

2. **front/src/services/api.ts**
   - HTTP клиент на основе Axios
   - Обрабатывает отправку POST запросов на сервер
   - Добавляет JWT токен в заголовки запросов

3. **window.ymaps** (Yandex Maps API)
   - Внешний API для работы с картами
   - Метод `route()` для построения маршрута
   - Методы `getLength()` и `getJamsTime()` для получения данных маршрута

4. **JSON** (встроенный объект JavaScript)
   - Метод `stringify()` для сериализации данных

## Участники

**Актеры:**
- Carrier (Перевозчик)

**Классы:**
- RequestChat (front/src/components/RequestChat.tsx)
- routeData (состояние компонента RequestChat)
- window.ymaps (Yandex Maps API)
- JSON (встроенный объект JavaScript)
- api (front/src/services/api.ts)

## Диаграмма последовательности

```
actor Carrier
participant RequestChat
participant routeData
participant window.ymaps
participant JSON
participant api

activate RequestChat
Carrier -> RequestChat: sendRoute()
RequestChat -> routeData: Проверка startAddress и endAddress
routeData --> RequestChat: boolean

alt Адреса указаны
    RequestChat -> routeData: Проверка distance и time
    routeData --> RequestChat: boolean
    
    alt distance или time отсутствуют
        RequestChat -> RequestChat: Создание массива координат [startCoords, endCoords]
        RequestChat -> window.ymaps: route([startCoords, endCoords])
        activate window.ymaps
        window.ymaps --> RequestChat: route object
        deactivate window.ymaps
        
        RequestChat -> route: getLength()
        route --> RequestChat: distance
        
        RequestChat -> route: getJamsTime()
        route --> RequestChat: time
        
        RequestChat -> routeData: Обновление distance и time
        activate routeData
        routeData --> RequestChat: finalRouteData
        deactivate routeData
    end
    
    RequestChat -> JSON: stringify(finalRouteData)
    activate JSON
    JSON --> RequestChat: routeJson
    deactivate JSON
    
    RequestChat -> RequestChat: setSendingRoute(true)
    RequestChat -> api: post('/api/messages', {requestId, text: routeJson, type: 'ROUTE'})
    activate api
    api --> RequestChat: response
    deactivate api
    
    RequestChat -> RequestChat: setShowRouteBuilder(false)
    RequestChat -> routeData: setRouteData(null)
    RequestChat -> RequestChat: setStartAddressInput('')
    RequestChat -> RequestChat: setEndAddressInput('')
    RequestChat -> RequestChat: fetchMessages()
    RequestChat -> RequestChat: setSendingRoute(false)
else Адреса не указаны
    RequestChat -> RequestChat: setError('Укажите точки отправления и прибытия')
end

deactivate RequestChat
```

