# Диаграмма последовательности: Геокодинг адреса

## Файлы, участвующие в процессе

1. **src/main/java/org/example/bank/controllers/GeocodingController.java**
   - REST контроллер для обработки HTTP запросов геокодинга
   - Метод `geocodeAddress()` - получение координат по адресу

2. **src/main/java/org/example/bank/services/GeocodingService.java**
   - Сервис для выполнения геокодинга
   - Метод `geocodeAddress()` - основная логика геокодинга
   - Метод `geocodeWithYandex()` - геокодинг через Yandex API
   - Метод `normalizeAddressForYandex()` - нормализация адреса
   - Метод `simplifyAddress()` - упрощение адреса
   - Метод `createHeaders()` - создание HTTP заголовков

3. **RestTemplate** (Spring Framework)
   - HTTP клиент для выполнения внешних запросов
   - Метод `exchange()` - отправка HTTP запросов

4. **Yandex Geocoding API** (внешний сервис)
   - API для геокодинга адресов
   - URL: `https://geocode-maps.yandex.ru/1.x/`

5. **Nominatim API** (внешний сервис)
   - OpenStreetMap геокодинг API
   - URL: `https://nominatim.openstreetmap.org`

## Участники

**Актеры:**
- Client (Клиент - внешний запрос)

**Классы:**
- GeocodingController (src/main/java/org/example/bank/controllers/GeocodingController.java)
- GeocodingService (src/main/java/org/example/bank/services/GeocodingService.java)
- RestTemplate (Spring Framework)
- YandexGeocodingAPI (внешний сервис)
- NominatimAPI (внешний сервис)

## Диаграмма последовательности

```
actor Client
participant GeocodingController
participant GeocodingService
participant RestTemplate
participant YandexGeocodingAPI
participant NominatimAPI

activate GeocodingController
Client -> GeocodingController: GET /api/geocoding/geocode?address={address}
GeocodingController -> GeocodingController: Проверка address на null/empty

alt Адрес валиден
    GeocodingController -> GeocodingService: geocodeAddress(address)
    activate GeocodingService
    
    GeocodingService -> GeocodingService: Проверка address на null/empty
    
    GeocodingService -> GeocodingService: geocodeWithYandex(address)
    activate GeocodingService
    
    GeocodingService -> GeocodingService: normalizeAddressForYandex(address)
    GeocodingService -> GeocodingService: Создание вариантов адреса
    
    loop Для каждого варианта адреса
        GeocodingService -> GeocodingService: URLEncoder.encode(addr, "UTF-8")
        GeocodingService -> GeocodingService: createHeaders()
        GeocodingService -> RestTemplate: exchange(url, GET, entity, Map.class)
        activate RestTemplate
        RestTemplate -> YandexGeocodingAPI: HTTP GET request
        activate YandexGeocodingAPI
        YandexGeocodingAPI --> RestTemplate: JSON response
        deactivate YandexGeocodingAPI
        RestTemplate --> GeocodingService: ResponseEntity<Map>
        deactivate RestTemplate
        
        alt Результат найден
            GeocodingService -> GeocodingService: Парсинг JSON ответа
            GeocodingService -> GeocodingService: Извлечение координат
            GeocodingService --> GeocodingService: Map с координатами
            deactivate GeocodingService
        end
    end
    
    alt Yandex не нашел результат
        GeocodingService -> GeocodingService: Создание вариантов адреса для Nominatim
        GeocodingService -> GeocodingService: simplifyAddress(address)
        
        loop Для каждого варианта адреса
            GeocodingService -> GeocodingService: URLEncoder.encode(searchQuery, "UTF-8")
            GeocodingService -> GeocodingService: createHeaders()
            GeocodingService -> GeocodingService: Thread.sleep(300)
            GeocodingService -> RestTemplate: exchange(url, GET, entity, Object[].class)
            activate RestTemplate
            RestTemplate -> NominatimAPI: HTTP GET request
            activate NominatimAPI
            NominatimAPI --> RestTemplate: JSON array response
            deactivate NominatimAPI
            RestTemplate --> GeocodingService: ResponseEntity<Object[]>
            deactivate RestTemplate
            
            GeocodingService -> GeocodingService: Парсинг результатов
            GeocodingService -> GeocodingService: Поиск результата для Беларуси
            
            alt Результат найден
                GeocodingService -> GeocodingService: Создание Map с координатами
                GeocodingService --> GeocodingService: Map с координатами
            end
        end
    end
    
    GeocodingService --> GeocodingController: Map<String, Object> result
    deactivate GeocodingService
    
    alt Результат найден
        GeocodingController -> GeocodingController: ResponseEntity.ok(result)
        GeocodingController --> Client: HTTP 200 + JSON с координатами
    else Результат не найден
        GeocodingController -> GeocodingController: Создание error Map
        GeocodingController -> GeocodingController: ResponseEntity.ok(error)
        GeocodingController --> Client: HTTP 200 + JSON с ошибкой
    end
else Адрес невалиден
    GeocodingController -> GeocodingController: Создание error Map
    GeocodingController -> GeocodingController: ResponseEntity.badRequest().body(error)
    GeocodingController --> Client: HTTP 400 Bad Request
end

deactivate GeocodingController
```


