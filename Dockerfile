# Стадия сборки
FROM maven:latest AS build
WORKDIR /app
COPY pom.xml /app
COPY src /app/src
RUN mvn clean package spring-boot:repackage -DskipTests

# Финальный образ
FROM openjdk:22-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
