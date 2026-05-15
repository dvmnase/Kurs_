# Диаграмма компонентов системы

## Описание системы

Система представляет собой веб-приложение для управления грузоперевозками, состоящее из фронтенда на Next.js/React и бэкенда на Spring Boot.

## Компоненты системы

### 1. Frontend Layer (Клиентский слой)

#### 1.1. Presentation Components (Компоненты представления)
**Файлы:**
- `front/src/components/` - React компоненты
- `front/src/pages/` - Next.js страницы
- `front/src/styles/` - Стили (SASS/CSS)

**Технологии:**
- React 18.1.0
- Next.js 12.1.6
- TypeScript
- SASS

**Основные компоненты:**
- `RequestChat.tsx` - Компонент чата с маршрутами
- `RouteMapView.tsx` - Компонент отображения карты
- `SignInForm.tsx`, `SignUpForm.tsx` - Компоненты аутентификации
- `AdminPanel.tsx`, `UserManagement.tsx` - Административные компоненты
- `OwnerCargo.tsx`, `CarrierRequests.tsx` - Бизнес-компоненты

#### 1.2. Services Layer (Слой сервисов)
**Файлы:**
- `front/src/services/api.ts` - HTTP клиент (Axios)
- `front/src/services/authService.ts` - Сервис аутентификации
- `front/src/services/geocodingService.ts` - Сервис геокодинга
- `front/src/services/userSettingsService.ts` - Сервис настроек пользователя

**Технологии:**
- Axios
- JWT токены (localStorage)

#### 1.3. Utils Layer (Утилиты)
**Файлы:**
- `front/src/utils/yandexMapsLoader.ts` - Загрузчик Yandex Maps
- `front/src/utils/token.js` - Работа с токенами
- `front/src/utils/context/StateContext.js` - Контекст состояния

### 2. Backend Layer (Серверный слой)

#### 2.1. Controllers Layer (Слой контроллеров)
**Файлы:**
- `src/main/java/org/example/bank/controllers/`

**Основные контроллеры:**
- `SecurityController.java` - Аутентификация и регистрация
- `MessageController.java` - Работа с сообщениями и маршрутами
- `OwnerRequestController.java` - Управление заявками владельца
- `CarrierRequestController.java` - Управление заявками перевозчика
- `AdminUserController.java` - Административное управление пользователями
- `GeocodingController.java` - Геокодинг адресов

**Технологии:**
- Spring Boot Web
- REST API
- JSON

#### 2.2. Services Layer (Слой бизнес-логики)
**Файлы:**
- `src/main/java/org/example/bank/services/`

**Основные сервисы:**
- `MessageService.java` - Бизнес-логика сообщений и маршрутов
- `RequestService.java` - Бизнес-логика заявок
- `UserService.java` - Бизнес-логика пользователей
- `CargoService.java` - Бизнес-логика грузов
- `AuthService.java` - Бизнес-логика аутентификации

**Технологии:**
- Spring Service
- @Transactional
- ObjectMapper (Jackson)

#### 2.3. Repositories Layer (Слой доступа к данным)
**Файлы:**
- `src/main/java/org/example/bank/repositories/`

**Основные репозитории:**
- `MessageRepository.java` - Доступ к сообщениям
- `RequestRepository.java` - Доступ к заявкам
- `UserRepository.java` - Доступ к пользователям
- `RouteRepository.java` - Доступ к маршрутам
- `CargoRepository.java` - Доступ к грузам
- `CarrierRepository.java` - Доступ к перевозчикам
- `OwnerRepository.java` - Доступ к владельцам

**Технологии:**
- Spring Data JPA
- JPA/Hibernate

#### 2.4. Entities Layer (Слой сущностей)
**Файлы:**
- `src/main/java/org/example/bank/entities/`

**Основные сущности:**
- `Message.java` - Сообщения
- `Request.java` - Заявки
- `Route.java` - Маршруты
- `Cargo.java` - Грузы
- `User.java` - Пользователи
- `Carrier.java` - Перевозчики
- `Owner.java` - Владельцы грузов

**Технологии:**
- JPA Annotations
- Lombok

#### 2.5. DTOs Layer (Слой объектов передачи данных)
**Файлы:**
- `src/main/java/org/example/bank/dto/`

**Основные DTOs:**
- `MessageDTO.java` - DTO сообщений
- `RequestDTO.java` - DTO заявок
- `RouteDTO.java` - DTO маршрутов
- `UserDTO.java` - DTO пользователей
- `CreateMessageDTO.java` - DTO создания сообщений

#### 2.6. Security Layer (Слой безопасности)
**Файлы:**
- `src/main/java/org/example/bank/TokenFilter.java` - JWT фильтр
- `src/main/java/org/example/bank/JwtCore.java` - JWT утилиты
- `src/main/java/org/example/bank/configurations/SecurityConfigurator.java` - Конфигурация безопасности
- `src/main/java/org/example/bank/UserDetailsImpl.java` - Реализация UserDetails

**Технологии:**
- Spring Security
- JWT (jjwt 0.12.3)
- BCrypt

### 3. Database Layer (Слой базы данных)

**Технологии:**
- PostgreSQL
- JDBC
- Hibernate ORM

**Файлы миграций:**
- `src/main/java/org/example/bank/migration/init_d_b.up.sql`
- `src/main/java/org/example/bank/migration/init_d_b.down.sql`

**Основные таблицы:**
- `users` - Пользователи
- `messages` - Сообщения
- `requests` - Заявки
- `routes` - Маршруты
- `cargo` - Грузы
- `carriers` - Перевозчики
- `owners` - Владельцы

### 4. External Services (Внешние сервисы)

#### 4.1. Yandex Maps API
**Использование:**
- Геокодинг адресов
- Построение маршрутов
- Отображение карт

**Конфигурация:**
- API Key: `yandex.maps.api.key` в `application.properties`

#### 4.2. YouTube API
**Использование:**
- Встраивание видео

**Конфигурация:**
- API Key: `youtube.api.key` в `application.properties`

## Диаграмма компонентов (PlantUML)

```
@startuml
!define RECTANGLE class

package "Frontend Layer" {
    [React Components] as ReactComp
    [Next.js Pages] as NextPages
    [Services] as FrontServices
    [Utils] as FrontUtils
}

package "Backend Layer" {
    package "Controllers" {
        [SecurityController] as SecCtrl
        [MessageController] as MsgCtrl
        [OwnerRequestController] as OwnerCtrl
        [CarrierRequestController] as CarrierCtrl
        [AdminUserController] as AdminCtrl
    }
    
    package "Services" {
        [MessageService] as MsgSvc
        [RequestService] as ReqSvc
        [UserService] as UserSvc
        [CargoService] as CargoSvc
        [AuthService] as AuthSvc
    }
    
    package "Repositories" {
        [MessageRepository] as MsgRepo
        [RequestRepository] as ReqRepo
        [UserRepository] as UserRepo
        [RouteRepository] as RouteRepo
        [CargoRepository] as CargoRepo
    }
    
    package "Security" {
        [TokenFilter] as TokenFilter
        [JwtCore] as JwtCore
        [SecurityConfigurator] as SecConfig
    }
}

database "PostgreSQL" as DB {
    [users] as UsersTable
    [messages] as MessagesTable
    [requests] as RequestsTable
    [routes] as RoutesTable
    [cargo] as CargoTable
}

cloud "External Services" {
    [Yandex Maps API] as YandexMaps
    [YouTube API] as YouTube
}

' Frontend connections
ReactComp --> NextPages
ReactComp --> FrontServices
NextPages --> FrontServices
FrontServices --> FrontUtils

' Frontend to Backend
FrontServices --> SecCtrl : HTTP/REST
FrontServices --> MsgCtrl : HTTP/REST
FrontServices --> OwnerCtrl : HTTP/REST
FrontServices --> CarrierCtrl : HTTP/REST
FrontServices --> AdminCtrl : HTTP/REST

' Security flow
SecCtrl --> TokenFilter
TokenFilter --> JwtCore
TokenFilter --> SecConfig

' Controller to Service
SecCtrl --> AuthSvc
MsgCtrl --> MsgSvc
OwnerCtrl --> ReqSvc
CarrierCtrl --> ReqSvc
AdminCtrl --> UserSvc

' Service to Repository
MsgSvc --> MsgRepo
ReqSvc --> ReqRepo
UserSvc --> UserRepo
MsgSvc --> RouteRepo
CargoSvc --> CargoRepo

' Repository to Database
MsgRepo --> MessagesTable
ReqRepo --> RequestsTable
UserRepo --> UsersTable
RouteRepo --> RoutesTable
CargoRepo --> CargoTable

' External services
ReactComp --> YandexMaps : API calls
ReactComp --> YouTube : API calls

@enduml
```

## Технологический стек

### Frontend:
- **Framework**: Next.js 12.1.6
- **UI Library**: React 18.1.0
- **Language**: TypeScript, JavaScript
- **Styling**: SASS
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Maps**: Yandex Maps API

### Backend:
- **Framework**: Spring Boot 3.4.5
- **Language**: Java 21
- **Security**: Spring Security + JWT
- **ORM**: Hibernate/JPA
- **Database**: PostgreSQL
- **Build Tool**: Maven
- **Libraries**: Lombok, Jackson, Apache POI

### Database:
- **DBMS**: PostgreSQL
- **Connection**: JDBC
- **ORM**: Hibernate

### External APIs:
- **Yandex Maps API** - Геокодинг и карты
- **YouTube API** - Видео контент

## Взаимодействие компонентов

1. **Frontend → Backend**: HTTP/REST запросы через Axios
2. **Backend → Database**: JPA/Hibernate через репозитории
3. **Frontend → External APIs**: Прямые вызовы API (Yandex Maps, YouTube)
4. **Security Flow**: TokenFilter → JwtCore → UserDetailsService → SecurityContext

## Архитектурные паттерны

- **Layered Architecture** - Разделение на слои (Controller → Service → Repository)
- **REST API** - RESTful архитектура для взаимодействия
- **JWT Authentication** - Токен-базированная аутентификация
- **Repository Pattern** - Абстракция доступа к данным
- **DTO Pattern** - Объекты передачи данных между слоями
- **Component-Based Architecture** - Компонентная архитектура на фронтенде


