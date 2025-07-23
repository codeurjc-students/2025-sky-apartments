# Sky Apartments: Apartment Management Web Application

`Sky Apartments` is a web application designed to help apartment owner manage and showcase their properties and allow users to book apartments through a friendly and filtered interface. The application will support user roles such as guests, registered users, and administrators, offering different functionalities tailored to each profile.

![Home Page Wireframe](docs\images\wireframes\homePage_wireframe.png)
![Apartment Page Wireframe](docs\images\wireframes\apartment_wireframe.png)

---

## Project status

> ⚠️ This document only defines the **functional** and **technical** objectives of the application. The implementation has not started yet.

---

## 🎯 Objectives

### Functional Objectives

This application is aimed at simplifying the process of apartment reservations while providing clear management tools for the owner.

- Apartment listing with filters (number of guests, balcony, terrace, etc.)
- Booking system with availability and date management
- User registration and login
- Owner dashboard to manage apartments and bookings
- Email confirmation for bookings
- Review and rating system
- Mobile-responsive design

### Technical Objectives

The project will be developed using modern web technologies, ensuring scalability, maintainability, and automated quality control.

- Backend using Spring Boot (Java)
- Frontend using Angular
- MySQL database
- Integration with external APIs (e.g., maps)
- GitHub Actions for Continuous Integration
- Docker for environment replication
- RESTful API structure
- JWT-based authentication
- End-to-end testing with Selenium

---

## 🛠️ Methodology

The project will follow an iterative and incremental development model with the following phases:

### Phases

- **Phase 1: Functionality Definition**  
  Documentation of general and detailed application functionalities.

- **Phase 2: Tech and Tooling Configuration**  
  Setup of development environment and continuous integration.

- **Phases 3–5: Iterative Development**  
  Incremental implementation of the application with a release at the end of each phase.

- **Phase 6: Writing the Final Report**

- **Phase 7: Final Presentation Preparation**

### Timeline

| Phase | Start Date | End Date   |
|-------|------------|------------|
| 1     | 18-07-2025 | 15-09-2025 |
| 2     | 15-09-2025 | 15-10-2025 |
| 3     | 15-10-2025 | 15-12-2025 |
| 4     | 15-12-2025 | 01-03-2026 |
| 5     | 01-03-2026 | 15-04-2026 |
| 6     | 15-04-2026 | 15-05-2026 |
| 7     | 15-05-2026 | 15-06-2026 |

---

## 📋 Functionalities (planned)

### ✅ Basic functionality

**🔓 Anonymous User:**

- View list of apartments.
- Filter by number of guests, terrace/balcony availability, location, etc.
- View apartment details (photos, description, price per night).
- Check availability (without booking).

**👤 Registered User:**

- Sign up and log in.
- View and edit profile.
- Book available apartments.
- View booking history.
- Cancel a booking.

**🛠️ Administrator:**

- Log in using credentials from a configuration file.
- Full CRUD operations for apartments (create, edit, delete).
- Upload images for apartments.
- Manage all user bookings.

### ⚙️ Intermediate functionality

- Advanced apartment search with combined filters.
- Show apartment location on a map (Google Maps).
- Display availability with a calendar.
- Booking confirmation via email.
- Apartment rating and review system.
- Display statistics (bookings per month, most booked apartments).
- Option to upload multiple images per apartment.

### 🚀 Advanced functionality

- Interactive charts:

  - Bookings per month.
  - Most demanded apartments.

- Intelligent search algorithm: Prioritizes apartments with better reviews and optimal availability based on selected dates.
- Dynamic pricing: The price per night will vary depending on the day of the week, season (low, medium, or high), occupancy, and proximity to the booking date (last-minute reservations, etc.).

---

## 🔍 Analysis

### 🧱 Wireframes & Navigation

![Wireframe - Home Page](docs\images\wireframes\homePage_wireframe.png)
![Wireframe - Book Page](docs\images\wireframes\book_wireframe.png)
![Wireframe - Apartments Page](docs\images\wireframes\apartments_wireframe.png)
![Wireframe - Apartment Page](docs\images\wireframes\apartment_wireframe.png)
![Wireframe - Confirm booking Page](docs\images\wireframes\bookingConfirmation_wireframe.png)
![Wireframe - Registered user Page](docs\images\wireframes\registeredUser_wireframe.png)
![Wireframe - Admin Page](docs\images\wireframes\admin_wireframe.png)
![Wireframe - Log in/Sign up Page](docs\images\wireframes\loginSignup_wireframe.png)
![Wireframe - Editing/new apartment Page](docs\images\wireframes\editingNewApartment_wireframe.png)
![Navigation between wireframes](docs\images\wireframes\all_wireframe.png)

> 📁 *The wireframes are available in the folder `/docs/images/wireframes`.*

---

### 🔹 Entities & Relations

![Entity diagram](docs\images\entity_diagram.png)

### 🔐 Permissions

| Acción / Entidad   | Guest | Registered user | Admin |
|--------------------|-------|-----------------|-------|
| View Apartments    | ✅    | ✅             | ✅    |
| Book               | ❌    | ✅             | ❌    |
| Cancel books       | ❌    | ✅             | ✅    |
| Make reviews       | ❌    | ✅             | ❌    |
| Manage Apartments  | ❌    | ❌             | ✅    |
| Upload images      | ❌    | ❌             | ✅    |
| See charts         | ❌    | ❌             | ✅    |
| Manage prices      | ❌    | ❌             | ✅    |


### 🖼️ Images

- `Apartment`: multiple images per apartment.

### 📊 Charts

- Booking trends: line chart
- Revenue by month: bar chart
- Ratings distribution: pie chart

### 🔌 Complementary Technologies

- **Email**: for booking confirmation
- **Maps**: Google Maps for apartment´s location
- **Chart.js**: for admin´s charts

### 🚀 Advanced Feature

**Dynamic nightly pricing** based on:

- Day of the week
- Season (high/medium/low)
- Overall occupancy
- Last-minute advance notice

## 📢 Progress Tracking

- Project Blog on Medium: [Medium Blog](https://medium.com/@e.desande.2021/list/sky-apartments-ee8b01d00929)
- GitHub Project Board: [GitHub Projects](https://github.com/orgs/codeurjc-students/projects/16)

---

## 👤 Author

This application is developed as part of the **Bachelor’s Final Project (TFG)** in the **Bachelor’s Degree in Software Engineering** at **ETSII - URJC**.

- **Student**: Eloy de Sande de las Heras
- **Supervisor**: Micael Gallego Carrillo

---

## 📄 License

This project is under license. See the [`LICENSE`](./LICENSE) file for details.
