# Etapa 1: build con Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copia el POM padre
COPY pom.xml .

# Instala el POM padre en el repositorio local de Maven
RUN mvn install -N

# Copia el directorio del apartment
COPY apartment/pom.xml ./apartment/
COPY apartment/src ./apartment/src

# Ejecuta Maven desde el directorio apartment
WORKDIR /app/apartment
RUN mvn clean package -DskipTests

# Etapa 2: imagen final
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=build /app/apartment/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]