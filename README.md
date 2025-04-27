# Bank
backend, Java, Spring, Rest, JPA, topik bank 

registration POST http://localhost:8080/auth/signup
example JSON
{
    "username": "qwоerty",
    "email": "qwerоty@gmail.com",
    "password": "sdfghj"
}

authentication (return token) POST http://localhost:8080/auth/signin 
example JSON
{
    "username": "qwerty",
    "password": "sdfghj"
}

token authentication GET http://localhost:8080/secured/user
Auth Type / Bearer Token 
