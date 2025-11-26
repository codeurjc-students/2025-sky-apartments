# Stage 1: Build Angular Frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Production build
RUN npm run build -- --configuration production

# Stage 2: Build Backend (Maven Multi-Module)
FROM maven:3.9-eclipse-temurin-17 AS backend-build

WORKDIR /app

# Copy Maven configuration files
COPY backend/pom.xml ./
COPY backend/eureka-server/pom.xml ./eureka-server/
COPY backend/api-gateway/pom.xml ./api-gateway/
COPY backend/apartment/pom.xml ./apartment/
COPY backend/booking/pom.xml ./booking/
COPY backend/user/pom.xml ./user/
COPY backend/review/pom.xml ./review/

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B

# Copy backend source code
COPY backend/ ./

# Build all modules
RUN mvn clean package -DskipTests -B

# Stage 3: Final Image with API Gateway + Frontend
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Install curl for healthchecks and netcat for port checks
RUN apk add --no-cache curl openssl netcat-openbsd

# Copy API Gateway JAR
COPY --from=backend-build /app/api-gateway/target/*.jar ./api-gateway.jar

# Copy microservice JARs
COPY --from=backend-build /app/eureka-server/target/*.jar ./eureka-server.jar
COPY --from=backend-build /app/apartment/target/*.jar ./apartment.jar
COPY --from=backend-build /app/booking/target/*.jar ./booking.jar
COPY --from=backend-build /app/user/target/*.jar ./user.jar
COPY --from=backend-build /app/review/target/*.jar ./review.jar

# Copy compiled frontend to static resources
# Angular 17+ outputs to dist/<project-name>/browser/
COPY --from=frontend-build /app/frontend/dist/frontend/browser /app/static

# Verify that the static files were copied successfully
RUN ls -la /app/static/ && \
    test -f /app/static/index.html || (echo "ERROR: index.html not found!" && exit 1)

# Copy startup script
COPY docker/entrypoint.sh ./entrypoint.sh

# FIX: Convert Windows line endings to Unix and make executable
RUN sed -i 's/\r$//' ./entrypoint.sh && \
    chmod +x ./entrypoint.sh && \
    ls -la ./entrypoint.sh

# Create required directories
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Expose HTTPS port
EXPOSE 443

# Default environment variables
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENV SPRING_PROFILES_ACTIVE=prod

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -fk https://localhost:443/actuator/health || exit 1

# Entrypoint - using absolute path for clarity
ENTRYPOINT ["/app/entrypoint.sh"]
