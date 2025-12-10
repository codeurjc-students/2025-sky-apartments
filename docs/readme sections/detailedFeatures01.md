# Detailed Features

This document provides a comprehensive list of all planned features for Sky Apartments, indicating their implementation status.

## ✅ Implemented Features (up to Version 0.2)

### Anonymous Users
- ✅ View complete apartment catalog
- ✅ Advanced search system with combined filters:
  - Number of guests
  - Amenities (terrace, balcony, parking, pool, etc.)
  - Location (city, neighborhood)
  - Price range
  - Date availability
- ✅ View detailed apartment information with images
- ✅ Check availability for specific dates

### Registered Users
- ✅ User registration with email validation
- ✅ Secure login using Spring Security
- ✅ View and edit personal profile
- ✅ Make reservations on available apartments
- ✅ View complete booking history
- ✅ Cancel active reservations
- ✅ Receive booking confirmation
- ✅ Review past stays and rate apartments (1-5 stars)

### Administrators
- ✅ Secure admin login using configuration credentials
- ✅ Full CRUD operations for apartments:
  - Create new apartments
  - Edit existing apartments
  - Delete apartments
  - View all apartments
- ✅ Upload and manage apartment images (stored in database)
- ✅ View and manage all system bookings
- ✅ Cancel any booking in the system

### Technical Features
- ✅ HTTPS communication on port 443
- ✅ Spring Security for authentication and authorization
- ✅ Role-based access control
- ✅ Images stored in database for simplified deployment
- ✅ RESTful API following best practices:
  - All endpoints start with `/api/v1`
  - Proper HTTP methods (GET, POST, PUT, DELETE)
  - Resources identified in English and plural form
  - Appropriate HTTP status codes
  - Location header for creation operations
  - Pagination for list operations
  - Query parameters for filtering and searching
- ✅ Dockerized application with Docker Compose
- ✅ Published on DockerHub
- ✅ Custom error pages matching application style
- ✅ Pagination for large result sets
- ✅ Sample data loaded on startup

### Statistics and Analytics (Admin)
- ✅ Most booked apartments (ranking)
- ✅ Occupancy rate
- ✅ Most common KPIs: total bookings, active bookings, total revenue, average occupancy

## 🚧 Planned Features (Future Versions)

### User Experience Enhancements
- ✅ Interactive calendar with real-time availability visualization
- ✅ Email notifications for booking confirmations, cancellations, updates
- ⏳ Booking reminders before check-in date

### Rating and Review System
- ✅ Users can rate apartments after their stay (1-5 stars)
- ✅ Display average rating on apartment cards
- ⏳ Filter apartments by minimum rating

### Dynamic Pricing
- ⏳ Base price configuration per apartment
- ⏳ Price multipliers based on:
  - Day of the week (weekends vs. weekdays)
  - Season (low, medium, high)
  - Occupancy percentage
  - Booking lead time (last-minute vs. advance)
- ⏳ Special pricing for holidays and events
- ⏳ Discounts for long stays
- ⏳ Price history and analytics

### Statistics and Analytics (Admin)
- ✅ Revenue per month (chart)
- ✅ Average booking duration
- ✅ Top 10 apartments by rating

### Enhanced Media Management
- ✅ Support for multiple images per apartment (gallery)

## 📊 Implementation Progress

| Feature Category | Progress |
|-----------------|----------|
| Core Functionality | 100% ✅ |
| User Management | 100% ✅ |
| Admin Panel | 100% ✅ |
| Search & Filters | 100% ✅ |
| Booking System | 100% ✅ |
| Map Integration | 100% ✅ |
| Rating & Reviews | 100% ✅ |
| Statistics | 100% ✅ |
| Dynamic Pricing | 0% ⏳ |

---

**Legend:**
- ✅ Implemented and tested
- ⏳ Planned for future versions

---
[👉 Go back](/README.md)