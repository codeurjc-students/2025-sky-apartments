# 1. Build with Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# 2. Copy father POM
COPY pom.xml .

# Install father POM in Maven repository
RUN mvn install -N

COPY user/pom.xml ./user/
COPY user/src ./user/src

# Execute Maven
WORKDIR /app/user
RUN mvn clean package -DskipTests

# Build image
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=build /app/user/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]