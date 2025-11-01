#!/bin/sh

set -e

echo "Starting microservices architecture..."

# Crear directorio de logs
mkdir -p /app/logs

# Generar keystore si no existe
if [ ! -f /app/keystore.p12 ]; then
  echo "Generating self-signed SSL certificate..."
  keytool -genkeypair \
    -alias apartments \
    -keyalg RSA \
    -keysize 2048 \
    -storetype PKCS12 \
    -keystore /app/keystore.p12 \
    -storepass changeit \
    -validity 3650 \
    -dname "CN=localhost, OU=Development, O=Apartments, L=Madrid, ST=Madrid, C=ES" \
    -ext "SAN=dns:localhost,ip:127.0.0.1"
  echo "SSL certificate generated successfully!"
fi

# Función para esperar a que MySQL esté listo
wait_for_mysql() {
  local host=$1
  local port=$2
  local db_name=$3
  local max_attempts=30
  local attempt=0

  echo "Waiting for MySQL $db_name to be ready..."
  
  while [ $attempt -lt $max_attempts ]; do
    if nc -z $host $port > /dev/null 2>&1; then
      echo "$db_name is ready!"
      return 0
    fi
    attempt=$((attempt + 1))
    echo "Attempt $attempt/$max_attempts - $db_name not ready yet..."
    sleep 2
  done
  
  echo "ERROR: $db_name did not become ready in time"
  return 1
}

# Esperar a que las bases de datos estén listas
wait_for_mysql mysql-users 3306 "usersdb" || exit 1
wait_for_mysql mysql-apartments 3306 "apartmentsdb" || exit 1
wait_for_mysql mysql-bookings 3306 "bookingsdb" || exit 1

# Función para esperar a que un servicio esté disponible
wait_for_service() {
  local host=$1
  local port=$2
  local service_name=$3
  local max_attempts=30
  local attempt=0

  echo "Waiting for $service_name to be ready..."
  
  while [ $attempt -lt $max_attempts ]; do
    # Verificar si el proceso está corriendo (solo para Eureka)
    if [ "$service_name" = "eureka" ] && [ -n "$EUREKA_PID" ] && ! kill -0 $EUREKA_PID 2>/dev/null; then
      echo "ERROR: Eureka process died! Showing logs:"
      cat /app/logs/eureka.log
      return 1
    fi
    
    # Verificar si el puerto está abierto
    if nc -z $host $port > /dev/null 2>&1; then
      # Puerto abierto, verificar health endpoint
      if curl -f http://$host:$port/actuator/health > /dev/null 2>&1; then
        echo "$service_name is ready!"
        return 0
      fi
    fi
    
    attempt=$((attempt + 1))
    echo "Attempt $attempt/$max_attempts - $service_name not ready yet..."
    
    # Mostrar últimas líneas del log cada 5 intentos
    if [ $((attempt % 5)) -eq 0 ] && [ -f "/app/logs/${service_name}.log" ]; then
      echo "Last 10 lines of $service_name log:"
      tail -10 /app/logs/${service_name}.log
    fi
    
    sleep 5
  done
  
  echo "ERROR: $service_name did not become ready in time"
  echo "Full logs:"
  cat /app/logs/${service_name}.log 2>/dev/null || echo "No logs available"
  return 1
}

# Verificar memoria disponible
echo "System Resources:"
free -m 2>/dev/null || echo "Memory info not available"
echo ""

# Iniciar Eureka Server
echo "Starting Eureka Server..."
java -Xmx256m -Xms128m \
  -Dserver.port=8761 \
  -Dserver.ssl.enabled=false \
  -Deureka.client.register-with-eureka=false \
  -Deureka.client.fetch-registry=false \
  -Deureka.instance.hostname=localhost \
  -jar eureka-server.jar \
  > /app/logs/eureka.log 2>&1 &
EUREKA_PID=$!

echo "Eureka Server PID: $EUREKA_PID"
sleep 3

# Verificar que Eureka sigue vivo
if ! kill -0 $EUREKA_PID 2>/dev/null; then
  echo "ERROR: Eureka Server process died immediately!"
  echo "Logs:"
  cat /app/logs/eureka.log
  exit 1
fi

# Esperar a que Eureka esté listo
if ! wait_for_service localhost 8761 "eureka"; then
  exit 1
fi

# Iniciar User Service
echo "Starting User Service..."
java -Xmx256m -Xms128m \
  -Dserver.port=8080 \
  -Dserver.ssl.enabled=false \
  -Dspring.datasource.url=jdbc:mysql://mysql-users:3306/${MYSQL_USERS_DB:-usersdb} \
  -Dspring.datasource.username=${MYSQL_USER:-user} \
  -Dspring.datasource.password=${MYSQL_PASSWORD:-password} \
  -Djwt.secret=${JWT_SECRET:-dev-secret-key} \
  -Deureka.client.serviceUrl.defaultZone=http://localhost:8761/eureka/ \
  -jar user.jar \
  > /app/logs/user.log 2>&1 &
USER_PID=$!
echo "User Service PID: $USER_PID"

# Iniciar Apartment Service
echo "Starting Apartment Service..."
java -Xmx256m -Xms128m \
  -Dserver.port=8083 \
  -Dserver.ssl.enabled=false \
  -Dspring.datasource.url=jdbc:mysql://mysql-apartments:3306/${MYSQL_APARTMENTS_DB:-apartmentsdb} \
  -Dspring.datasource.username=${MYSQL_USER:-user} \
  -Dspring.datasource.password=${MYSQL_PASSWORD:-password} \
  -Dminio.url=${MINIO_URL:-http://minio:9000} \
  -Dminio.accessKey=${MINIO_ACCESS_KEY:-minioadmin} \
  -Dminio.secretKey=${MINIO_SECRET_KEY:-minioadmin} \
  -Dminio.bucket=${MINIO_BUCKET:-apartments} \
  -Deureka.client.serviceUrl.defaultZone=http://localhost:8761/eureka/ \
  -jar apartment.jar \
  > /app/logs/apartment.log 2>&1 &
APARTMENT_PID=$!
echo "Apartment Service PID: $APARTMENT_PID"

# Iniciar Booking Service
echo "Starting Booking Service..."
java -Xmx256m -Xms128m \
  -Dserver.port=8082 \
  -Dserver.ssl.enabled=false \
  -Dspring.datasource.url=jdbc:mysql://mysql-bookings:3306/${MYSQL_BOOKINGS_DB:-bookingsdb} \
  -Dspring.datasource.username=${MYSQL_USER:-user} \
  -Dspring.datasource.password=${MYSQL_PASSWORD:-password} \
  -Deureka.client.serviceUrl.defaultZone=http://localhost:8761/eureka/ \
  -jar booking.jar \
  > /app/logs/booking.log 2>&1 &
BOOKING_PID=$!
echo "Booking Service PID: $BOOKING_PID"

# Esperar a que los microservicios se registren
echo "Waiting for microservices to start and register with Eureka..."
sleep 20

# Verificar procesos
echo "Checking all services are running..."
for pid_name in "EUREKA_PID:eureka" "USER_PID:user" "APARTMENT_PID:apartment" "BOOKING_PID:booking"; do
  pid_var=$(echo $pid_name | cut -d: -f1)
  service_name=$(echo $pid_name | cut -d: -f2)
  pid=$(eval echo \$$pid_var)
  
  if ! kill -0 $pid 2>/dev/null; then
    echo "ERROR: $service_name service (PID $pid) is not running!"
    echo "Logs:"
    cat /app/logs/${service_name}.log
  else
    echo "✓ $service_name service is running (PID $pid)"
  fi
done

# Iniciar API Gateway
echo "Starting API Gateway with Frontend..."
exec java -Xmx512m -Xms256m \
  -Dserver.port=443 \
  -Dserver.ssl.enabled=true \
  -Dserver.ssl.key-store=file:/app/keystore.p12 \
  -Dserver.ssl.key-store-password=changeit \
  -Dserver.ssl.key-store-type=PKCS12 \
  -Dserver.ssl.key-alias=apartments \
  -Dspring.web.resources.static-locations=file:/app/static/ \
  -Deureka.client.serviceUrl.defaultZone=http://localhost:8761/eureka/ \
  -jar api-gateway.jar