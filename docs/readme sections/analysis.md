# 🔍 Analysis

## 🧱 Wireframes & Navigation

![Wireframe - Home Page](../images/wireframes/homePage_wireframe.png)
![Wireframe - Book Page](../images/wireframes/book_wireframe.png)
![Wireframe - Apartments Page](../images/wireframes/apartments_wireframe.png)
![Wireframe - Apartment Page](../images/wireframes/apartment_wireframe.png)
![Wireframe - Confirm booking Page](../images/wireframes/bookingConfirmation_wireframe.png)
![Wireframe - Registered user Page](../images/wireframes/registeredUser_wireframe.png)
![Wireframe - Admin Page](../images/wireframes/admin_wireframe.png)
![Wireframe - Log in/Sign up Page](../images/wireframes/loginSignup_wireframe.png)
![Wireframe - Editing/new apartment Page](../images/wireframes/editingNewApartment_wireframe.png)
![Navigation between wireframes](../images/wireframes/all_wireframe.png)

> 📁 *The wireframes are available in the folder `/docs/images/wireframes`.*

---

## 🔹 Entities & Relations

![Entity diagram](../images/entity_diagram.png)

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

---
[👉 Go back](/README.md)
