# Диаграмма последовательности: Подтверждение маршрута

## Участники

**Актеры:**
- Owner (Владелец груза)

**Классы:**
- RequestChat
- api
- TokenFilter
- JwtCore
- UserDetailsService
- MessageController
- MessageService
- MessageRepository
- RequestRepository
- UserRepository
- RouteRepository
- Database

## Диаграмма последовательности

```
actor Owner
participant RequestChat
participant api
participant TokenFilter
participant JwtCore
participant UserDetailsService
participant MessageController
participant MessageService
participant MessageRepository
participant RequestRepository
participant UserRepository
participant RouteRepository
database Database

activate RequestChat
Owner -> RequestChat: confirmRoute(messageId)
RequestChat -> api: post('/api/messages/route/{id}/confirm')
activate api
api -> TokenFilter: HTTP Request
activate TokenFilter

TokenFilter -> TokenFilter: parseJwt(request)
TokenFilter -> JwtCore: validateToken(jwt)
activate JwtCore
JwtCore --> TokenFilter: boolean
deactivate JwtCore

TokenFilter -> JwtCore: getNameFromJwt(jwt)
activate JwtCore
JwtCore --> TokenFilter: username
deactivate JwtCore

TokenFilter -> UserDetailsService: loadUserByUsername(username)
activate UserDetailsService
UserDetailsService -> Database: SELECT * FROM users WHERE username = ?
Database --> UserDetailsService: User
UserDetailsService --> TokenFilter: UserDetails
deactivate UserDetailsService

TokenFilter -> TokenFilter: setAuthentication()
TokenFilter -> MessageController: filterChain.doFilter()
deactivate TokenFilter
activate MessageController

MessageController -> MessageController: getPrincipal()
MessageController -> MessageService: confirmRoute(userId, messageId)
activate MessageService

MessageService -> MessageRepository: findById(messageId)
activate MessageRepository
MessageRepository -> Database: SELECT * FROM messages WHERE id = ?
Database --> MessageRepository: Message
MessageRepository --> MessageService: Message
deactivate MessageRepository

MessageService -> MessageService: getRequest()
MessageService -> UserRepository: findById(userId)
activate UserRepository
UserRepository -> Database: SELECT * FROM users WHERE id = ?
Database --> UserRepository: User
UserRepository --> MessageService: User
deactivate UserRepository

MessageService -> MessageService: readValue(message.getText(), RouteData.class)
MessageService -> RouteRepository: save(route)
activate RouteRepository
RouteRepository -> Database: INSERT INTO routes (...)
Database --> RouteRepository: Route
RouteRepository --> MessageService: Route
deactivate RouteRepository

MessageService -> RequestRepository: save(request)
activate RequestRepository
RequestRepository -> Database: UPDATE requests SET confirmed_route_id = ?, status = 'IN_PROGRESS'
Database --> RequestRepository: Request
RequestRepository --> MessageService: Request
deactivate RequestRepository

MessageService -> MessageService: convertRouteToDTO(route)
MessageService --> MessageController: RouteDTO
deactivate MessageService

MessageController --> api: ResponseEntity.ok(routeDTO)
deactivate MessageController
api --> RequestChat: response
deactivate api

RequestChat -> RequestChat: setError('Маршрут успешно подтвержден!')
RequestChat -> RequestChat: fetchMessages()
deactivate RequestChat
```

