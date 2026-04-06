# Execution Guide

This guide provides step-by-step instructions to run Sky Apartments using Docker Compose.

## Prerequisites

### Install Docker

The application requires Docker to run. Installation instructions vary by operating system:

#### Windows
- Download and install **Docker Desktop for Windows**
- Visit: https://docs.docker.com/desktop/install/windows-install/
- System requirements: Windows 10 64-bit or later

#### macOS
- Download and install **Docker Desktop for Mac**
- Visit: https://docs.docker.com/desktop/install/mac-install/
- Available for both Intel and Apple Silicon chips

#### Linux
You need to install both **Docker Engine** and **Docker Compose**:

**Docker Engine:**
- Visit: https://docs.docker.com/engine/install/
- Select your Linux distribution (Ubuntu, Debian, Fedora, etc.)

**Docker Compose:**
- Visit: https://docs.docker.com/compose/install/
- Follow the installation steps for standalone Docker Compose

### Verify Installation

After installation, verify Docker is working correctly:
```bash
docker --version
docker compose version
```

## Running the Application

### Option 1: Using DockerHub Registry (Recommended)

No additional tools required. Run the following command to start the application 
directly from the published OCI artifact:
```bash
docker compose -f oci://eloydsdlh/apartments-compose:1.0 up -d
```

Replace `1.0` with the desired version tag. Available tags can be found on the 
[DockerHub registry](https://hub.docker.com/r/eloydsdlh/apartments-compose/tags).

### Option 2: Using a Local Docker Compose File

If you prefer to inspect or modify the configuration before running, download the 
`docker-compose.yml` file for the desired version from the repository:

https://github.com/codeurjc-students/2025-sky-apartments/releases

Then start the application:
```bash
docker compose up -d
```

This command will:
- Download the Sky Apartments image from DockerHub
- Download the MySQL image
- Create and start containers
- Set up the network between them

### Wait for the Application to Start

The first time you run the application, it may take a few minutes to:
- Download all required images
- Initialize the database
- Load sample data

You can monitor the progress with:
```bash
docker compose logs -f
```

### Access the Application

Once the logs show "Application started successfully", open your browser and navigate to:
```
https://localhost
```

**Note:** You may see a security warning because the application uses a self-signed 
SSL certificate. This is expected in development. Click "Advanced" and 
"Proceed to localhost" to continue.

## Accessing the Application

### Web Interface

Open your browser and go to: **https://localhost**

### Sample Data and Credentials

The application comes preloaded with sample data for testing purposes.

#### Administrator Access
- **Username:** `admin@example.com`
- **Password:** `Password@1234`

The administrator account has full access to:
- Apartment management (create, edit, delete)
- All apartments management
- User management
- System statistics

#### Sample User Accounts

You can use these test accounts or create your own:

**User:**
  - Email: `user@example.com`
  - Password: `Password@1234`

#### Sample Apartments

The database includes 10 sample apartments with:
- **Name**
- **Description**
- **Number of maximum guests**
- **Amenities:** Different combinations of terrace, balcony, parking, pool, etc.
- **Images:** Representative photos for each apartment
- **Price per night**

#### Sample Bookings

Some sample bookings are preloaded to demonstrate:
- Active reservations
- Past reservations

#### Sample Reviews

Several reviews are included to showcase the review system.

## Environment Variables

The application runs out of the box with sensible defaults — no configuration is required 
for a basic local setup. However, two variables have no default value and must be provided 
for email notifications to work:

| Variable         | Required | Default | Description                        |
|------------------|----------|---------|------------------------------------|
| `MAIL_USERNAME`  | **Yes**  | —       | Email account for notifications    |
| `MAIL_PASSWORD`  | **Yes**  | —       | Email account password or app password |

All other variables are optional and already have defaults. You can override any of them 
by creating a `.env` file in the same directory as your compose file:
```env
# Email (required for notifications)
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=yourAppPassword

# Database
MYSQL_ROOT_PASSWORD=password
MYSQL_USER=user
MYSQL_PASSWORD=password
MYSQL_USERS_DB=usersdb
MYSQL_APARTMENTS_DB=apartmentsdb
MYSQL_BOOKINGS_DB=bookingsdb
MYSQL_REVIEWS_DB=reviewsdb

# MinIO storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=apartments-images
MINIO_EXTERNAL_URL=https://localhost:443/minio

# JWT secret — recommended to change in production
JWT_SECRET=Xv5s7JxGg9YhQwD8M1lA0VhG7yJrL6hE9F1N8KxV2bW3ZpQxUsyR7Cj4KsE8YfHd

# SSL
SSL_KEY_STORE=classpath:keystore.p12
SSL_KEY_STORE_PASSWORD=changeit
SSL_KEY_STORE_TYPE=PKCS12
SSL_KEY_ALIAS=apartments

# Spring profile
SPRING_PROFILE=prod
```

Docker Compose loads the `.env` file automatically if it is placed in the same directory 
as the compose file, with no extra flags needed.

## Managing the Application

### Stop the Application
```bash
docker compose down
```

This stops and removes the containers but preserves the database data.

### Stop and Remove All Data
```bash
docker compose down -v
```

**Warning:** This will delete all data including the database. The next time you 
start the application, it will reload the sample data.

### View Logs
```bash
# All services
docker compose logs

# Follow logs in real-time
docker compose logs -f

# Specific service
docker compose logs app
docker compose logs db
```

### Restart the Application
```bash
docker compose restart
```

### Update to a New Version
```bash
# Pull the desired version and restart
docker compose -f oci://eloydsdlh/apartments-compose:1.0 pull
docker compose -f oci://eloydsdlh/apartments-compose:1.0 up -d
```

## Troubleshooting

### Port Already in Use

If port 443 or 3306 is already in use, you'll see an error. Solutions:

1. **Stop conflicting services:**
   - Stop any web server using port 443 (Apache, Nginx, IIS)
   - Stop any MySQL/MariaDB service using port 3306

2. **Modify ports in docker-compose.yml:**
```yaml
   services:
     app:
       ports:
         - "8443:443"  # Use port 8443 instead
```
   Then access the app at: https://localhost:8443

### Database Connection Issues

If the application can't connect to the database:

1. Wait a few more seconds - the database needs time to initialize
2. Check database logs: `docker compose logs db`
3. Restart the services: `docker compose restart`

### SSL Certificate Warning

This is normal in development. The application uses a self-signed certificate. 
In production, a proper SSL certificate from a Certificate Authority will be used.

### Application Not Loading

1. Check if containers are running:
```bash
   docker compose ps
```

2. Check application logs:
```bash
   docker compose logs app
```

3. Verify your Docker installation:
```bash
   docker --version
   docker compose version
```

### Clear Browser Cache

If you see old versions or styling issues, clear your browser cache or try 
incognito/private mode.

## Development Version

To run the latest development version (may be unstable):
```bash
docker compose -f oci://eloydsdlh/apartments-compose:dev up -d
```

The `dev` tag corresponds to the latest build from the `main` branch and 
includes the most recent features.

## Additional Resources

- **Docker Documentation:** https://docs.docker.com
- **Docker Compose Documentation:** https://docs.docker.com/compose/
- **Sky Apartments Repository:** https://github.com/codeurjc-students/2025-sky-apartments

---

*For more detailed development instructions, see the [Development Guide](devGuide.md)*

---
[👉 Go back](/README.md)
