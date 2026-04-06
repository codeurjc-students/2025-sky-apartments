-- Sky Apartments - Database initialization script
-- Creates 4 independent schemas (one per microservice)
-- Tables are created automatically by Hibernate/JPA on startup

CREATE DATABASE IF NOT EXISTS usersdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS apartmentsdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS bookingsdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS reviewsdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions to the application user on all schemas
GRANT ALL PRIVILEGES ON usersdb.* TO 'user'@'%';
GRANT ALL PRIVILEGES ON apartmentsdb.* TO 'user'@'%';
GRANT ALL PRIVILEGES ON bookingsdb.* TO 'user'@'%';
GRANT ALL PRIVILEGES ON reviewsdb.* TO 'user'@'%';

FLUSH PRIVILEGES;