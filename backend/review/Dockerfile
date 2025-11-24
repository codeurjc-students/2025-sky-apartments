# 1. Build with Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# 2. Copy father POM
COPY pom.xml .

# Install father POM in Maven repository
RUN mvn install -N

COPY review/pom.xml ./review/
COPY review/src ./review/src

# Execute Maven
WORKDIR /app/review
RUN mvn clean package -DskipTests

# Build image
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=build /app/review/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]