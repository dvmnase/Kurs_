# Диаграмма последовательности: Аутентификация пользователя (Sign In)

## Файлы, участвующие в процессе

1. **src/main/java/org/example/bank/controllers/SecurityController.java**
   - REST контроллер для аутентификации
   - Метод `signin()` - обработка запроса на вход

2. **src/main/java/org/example/bank/services/UserService.java**
   - Сервис, реализующий UserDetailsService
   - Метод `loadUserByUsername()` - загрузка пользователя из БД

3. **src/main/java/org/example/bank/repositories/UserRepository.java**
   - Репозиторий для работы с пользователями
   - Метод `findUserByUsername()` - поиск пользователя по имени

4. **src/main/java/org/example/bank/UserDetailsImpl.java**
   - Реализация UserDetails для Spring Security
   - Метод `build()` - создание UserDetailsImpl из User

5. **org.springframework.security.authentication.AuthenticationManager**
   - Менеджер аутентификации Spring Security
   - Метод `authenticate()` - проверка учетных данных

6. **src/main/java/org/example/bank/JwtCore.java**
   - Компонент для работы с JWT токенами
   - Метод `generateToken()` - генерация JWT токена

7. **src/main/java/org/example/bank/repositories/OwnerRepository.java**
   - Репозиторий для работы с владельцами
   - Метод `findByUserId()` - поиск владельца по ID пользователя

8. **src/main/java/org/example/bank/repositories/CarrierRepository.java**
   - Репозиторий для работы с перевозчиками
   - Метод `findByUserId()` - поиск перевозчика по ID пользователя

9. **org.springframework.security.core.context.SecurityContextHolder**
   - Хранилище контекста безопасности
   - Метод `getContext().setAuthentication()` - установка аутентификации

10. **Database (PostgreSQL)**
    - База данных для хранения пользователей

## Участники

**Актеры:**
- Client (Клиент - внешний запрос)

**Классы:**
- SecurityController (src/main/java/org/example/bank/controllers/SecurityController.java)
- AuthenticationManager (Spring Security)
- UserService (src/main/java/org/example/bank/services/UserService.java)
- UserRepository (src/main/java/org/example/bank/repositories/UserRepository.java)
- UserDetailsImpl (src/main/java/org/example/bank/UserDetailsImpl.java)
- JwtCore (src/main/java/org/example/bank/JwtCore.java)
- SecurityContextHolder (Spring Security)
- OwnerRepository (src/main/java/org/example/bank/repositories/OwnerRepository.java)
- CarrierRepository (src/main/java/org/example/bank/repositories/CarrierRepository.java)
- Database (PostgreSQL)

## Диаграмма последовательности

```
actor Client
participant SecurityController
participant AuthenticationManager
participant UserService
participant UserRepository
participant UserDetailsImpl
participant JwtCore
participant SecurityContextHolder
participant OwnerRepository
participant CarrierRepository
database Database

activate SecurityController
Client -> SecurityController: POST /auth/signin {username, password}
SecurityController -> SecurityController: Создание SigninRequest

SecurityController -> AuthenticationManager: authenticate(UsernamePasswordAuthenticationToken)
activate AuthenticationManager

AuthenticationManager -> UserService: loadUserByUsername(username)
activate UserService

UserService -> UserRepository: findUserByUsername(username)
activate UserRepository
UserRepository -> Database: SELECT * FROM users WHERE username = ?
Database --> UserRepository: User entity
UserRepository --> UserService: Optional<User>
deactivate UserRepository

alt Пользователь найден
    UserService -> UserDetailsImpl: build(user)
    activate UserDetailsImpl
    UserDetailsImpl -> UserDetailsImpl: Создание SimpleGrantedAuthority("ROLE_" + role)
    UserDetailsImpl --> UserService: UserDetailsImpl
    deactivate UserDetailsImpl
    
    UserService --> AuthenticationManager: UserDetails
    deactivate UserService
    
    AuthenticationManager -> AuthenticationManager: Проверка пароля (PasswordEncoder)
    
    alt Пароль верный
        AuthenticationManager --> SecurityController: Authentication
        deactivate AuthenticationManager
        
        SecurityController -> SecurityContextHolder: getContext().setAuthentication(authentication)
        activate SecurityContextHolder
        SecurityContextHolder --> SecurityController: void
        deactivate SecurityContextHolder
        
        SecurityController -> JwtCore: generateToken(authentication)
        activate JwtCore
        JwtCore -> JwtCore: Извлечение UserDetailsImpl из Authentication
        JwtCore -> JwtCore: Получение роли из authorities
        JwtCore -> JwtCore: Создание JWT с subject, role, issuedAt, expiration
        JwtCore -> JwtCore: Подпись токена secretKey
        JwtCore --> SecurityController: String jwt
        deactivate JwtCore
        
        SecurityController -> SecurityController: Извлечение UserDetailsImpl из Authentication
        SecurityController -> SecurityController: Получение роли из authorities
        SecurityController -> SecurityController: Получение userId
        
        alt Роль OWNER
            SecurityController -> OwnerRepository: findByUserId(userId)
            activate OwnerRepository
            OwnerRepository -> Database: SELECT * FROM owners WHERE user_id = ?
            Database --> OwnerRepository: Owner entity
            OwnerRepository --> SecurityController: Optional<Owner>
            deactivate OwnerRepository
            
            alt Владелец найден
                SecurityController -> SecurityController: Создание Map с данными владельца
                SecurityController -> SecurityController: new AuthResponse(jwt, "OWNER", data)
                SecurityController --> Client: HTTP 200 + AuthResponse
            else Владелец не найден
                SecurityController -> SecurityController: new AuthResponse(jwt, "OWNER", null)
                SecurityController --> Client: HTTP 404 + AuthResponse
            end
        else Роль CARRIER
            SecurityController -> CarrierRepository: findByUserId(userId)
            activate CarrierRepository
            CarrierRepository -> Database: SELECT * FROM carriers WHERE user_id = ?
            Database --> CarrierRepository: Carrier entity
            CarrierRepository --> SecurityController: Optional<Carrier>
            deactivate CarrierRepository
            
            alt Перевозчик найден
                SecurityController -> SecurityController: Создание Map с данными перевозчика
                SecurityController -> SecurityController: new AuthResponse(jwt, "CARRIER", data)
                SecurityController --> Client: HTTP 200 + AuthResponse
            else Перевозчик не найден
                SecurityController -> SecurityController: new AuthResponse(jwt, "CARRIER", null)
                SecurityController --> Client: HTTP 404 + AuthResponse
            end
        else Роль ADMIN
            SecurityController -> SecurityController: new AuthResponse(jwt, "ADMIN", null)
            SecurityController --> Client: HTTP 200 + AuthResponse
        else Неизвестная роль
            SecurityController -> SecurityController: new AuthResponse(jwt, "UNKNOWN", null)
            SecurityController --> Client: HTTP 403 Forbidden + AuthResponse
        end
    else Пароль неверный
        AuthenticationManager --> SecurityController: BadCredentialsException
        deactivate AuthenticationManager
        SecurityController --> Client: HTTP 401 Unauthorized
    end
else Пользователь не найден
    UserService --> AuthenticationManager: UsernameNotFoundException
    deactivate UserService
    AuthenticationManager --> SecurityController: BadCredentialsException
    deactivate AuthenticationManager
    SecurityController --> Client: HTTP 401 Unauthorized
end

deactivate SecurityController
```


