# 🔍 Analysis

## 🧱 Wireframes & Navigation

![Wireframe - Home Page](docs/images/wireframes/homePage_wireframe.png)
![Wireframe - Book Page](docs/images/wireframes/book_wireframe.png)
![Wireframe - Apartments Page](docs/images/wireframes/apartments_wireframe.png)
![Wireframe - Apartment Page](docs/images/wireframes/apartment_wireframe.png)
![Wireframe - Confirm booking Page](docs/images/wireframes/bookingConfirmation_wireframe.png)
![Wireframe - Registered user Page](docs/images/wireframes/registeredUser_wireframe.png)
![Wireframe - Admin Page](docs/images/wireframes/admin_wireframe.png)
![Wireframe - Log in/Sign up Page](docs/images/wireframes/loginSignup_wireframe.png)
![Wireframe - Editing/new apartment Page](docs/images/wireframes/editingNewApartment_wireframe.png)
![Navigation between wireframes](docs/images/wireframes/all_wireframe.png)

> 📁 *The wireframes are available in the folder `/docs/images/wireframes`.*

---

## 🔹 Entities & Relations

![Entity diagram](docs/images/entity_diagram.png)

## 🔐 Permissions

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

## 🖼️ Images

- `Apartment`: multiple images per apartment.

## 📊 Charts

- Booking trends: line chart
- Revenue by month: bar chart
- Ratings distribution: pie chart

## 🔌 Complementary Technologies

- **Email**: for booking confirmation
- **Maps**: Google Maps for apartment´s location
- **Chart.js**: for admin´s charts

## 🚀 Advanced Feature

**Dynamic nightly pricing** based on:

- Day of the week
- Season (high/medium/low)
- Overall occupancy
- Last-minute advance notice
