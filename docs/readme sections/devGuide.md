# 👨‍💻 Development Guide

## 📊 Table of Contents

1. [Introduction](#-introduction)
2. [Technology Stack](#-technology-stack)
3. [Tools](#️-tools)
4. [Architecture](#️-architecture)
5. [Quality Assurance](#-quality-assurance)
6. [Development Process](#-development-process)
7. [Code Execution and Environment Setup](#️-code-execution-and-environment-setup)

---

## 🚀 Introduction

### 📖 Overview

This application is a **web application** with a **SPA (Single Page Application)** architecture on the client side, developed with **Angular 19**.  
A SPA is an application where content and navigation are mainly managed on the client side, loading a single initial HTML page and dynamically updating views using JavaScript, without fully reloading the page on each interaction.

The **backend** is implemented with **Spring Boot**, providing a REST API that allows the frontend to interact with business logic and the database.

The **database** used is **MySQL**.

The architecture is **monolithic**, but separated into two main layers:

- **Client (frontend)**: Angular application running in the browser.
- **Server (backend)**: Spring Boot application exposing REST endpoints.
- **Database**: MySQL, accessed by the backend via JPA/Hibernate.

Communication between client and server occurs **exclusively** via **REST API** over HTTP.

### 📝 Summary

| Item               | Description                          |
|--------------------|------------------------------------|
| **Type**           | Web SPA with REST API               |
| **Frontend**       | Angular 19                         |
| **Backend**        | Spring Boot                       |
| **Database**       | MySQL                             |
| **Architecture**   | Monolithic (client, server, DB)    |
| **Communication**  | REST API (HTTP/JSON)                |
| **Deployment Env** | Docker containers (if applicable)  |
| **Quality Control**| Unit, integration and E2E tests |
| **Development Process** | Iterative and incremental, version control with Git and CI/CD with GitHub Actions |

---

## 🧰 Technology Stack

The application uses the following technologies for its execution:

### **Frontend**

- **[Angular 19](https://angular.io/)** — A Single Page Application (SPA) framework used to build the client-side of the application. In this project, Angular manages the UI rendering, routing, and state management, allowing the user to interact with the system without full page reloads.
- **[RxJS](https://rxjs.dev/)** — A library for reactive programming using observables. In this project, RxJS is used to handle asynchronous data streams from the backend, such as API calls.
- **[Zone.js](https://www.npmjs.com/package/zone.js?activeTab=readme)** — A library that helps Angular detect changes in the application state by intercepting and tracking asynchronous operations, ensuring the UI updates automatically when data changes.

### **Backend**

- **[Spring Boot](https://spring.io/projects/spring-boot)** —  A Java-based framework that simplifies backend application development with pre-configured defaults and embedded server support. In this project, it handles REST API endpoints, request processing, and business logic.

    - **spring-boot-starter-web** —  Provides the components required to build REST APIs and serve HTTP requests.
    - **spring-boot-starter-data-jpa** — Enables integration with JPA and Hibernate for database access and object-relational mapping.
    - **spring-boot-devtools** — Adds hot reload and development-time features to speed up backend development.
- **[MySQL](https://www.mysql.com/)** — A relational database management system used to store persistent application data, including user information and business records.
- **MySQL Connector/J** — The official JDBC driver that allows the Spring Boot backend to connect and interact with the MySQL database.

### **Testing**

- **[JUnit 5](https://junit.org/junit5/)** — The primary framework for writing and running unit tests in the backend. Used to validate individual components of the application logic.
- **[Mockito](https://site.mockito.org/)** — A mocking framework for creating fake objects in unit tests, allowing isolated testing of backend services without requiring real dependencies.
- **[Testcontainers](https://www.testcontainers.org/)** — A Java library to run lightweight, disposable containers for integration testing. In this project, it is used to spin up MySQL instances during tests.
- **[Rest Assured](https://rest-assured.io/)** — A Java DSL for testing REST APIs. Used to verify backend endpoints by simulating client requests and validating responses.
- **[Karma](https://karma-runner.github.io/)** — A JavaScript test runner that executes frontend tests in real browsers, ensuring compatibility and correct behavior in a browser environment.
- **[Jasmine](https://jasmine.github.io/)** — A behavior-driven testing framework for JavaScript. Used with Karma to write and structure frontend unit tests for Angular components and services.
- **[Playwright](https://playwright.dev/)** — A framework for end-to-end testing. In this project, Playwright is used to simulate real user interactions with the Angular application and validate full workflows.

---

## 🛠️ Tools

The following tools and IDEs are used to develop the application. Only the ones relevant to the development process are listed, and their role in this specific project is explained.

- **[Visual Studio Code](https://code.visualstudio.com/)** — A lightweight, extensible code editor used for writing and editing both frontend (Angular) and backend (Spring Boot) code. Its integrated terminal and plugin ecosystem streamline the development process.
- **[Postman](https://www.postman.com/)** — An API development and testing tool used to send requests to backend REST APIs and verify responses during development and debugging.
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** — A containerization platform used to run MySQL databases locally for development and testing. It also supports running backend services in containers if needed.
- **[Git](https://git-scm.com/)** — A distributed version control system for tracking changes in the source code and enabling collaboration between developers.
- **[GitHub](https://github.com/)** — A cloud-based platform for hosting the Git repository, managing code versions, and integrating Continuous Integration (CI) workflows.
- **[JaCoCo](https://www.jacoco.org/jacoco/)** — A Java code coverage library used to measure how much of the backend code is exercised by automated tests. It helps monitor testing quality and identify untested parts of the application.

---

## 🏗️ Architecture

### **Deployment Architecture**

The application follows a **monolithic** architecture with two main components deployed as separate processes:

1. **Frontend (Angular 19 SPA)**  
   - Runs in a Node.js-based development server during development and is built into static files for production.
   - Communicates exclusively with the backend via **HTTP** using a REST API.

2. **Backend (Spring Boot)**  
   - Runs as a standalone Java process (JAR) or within a servlet container.
   - Connects to a **MySQL** database for persistent data storage.
   - Exposes its functionality through a **REST API**.

**Communication Protocols:**

- **Frontend → Backend:** HTTP REST calls in JSON format.
- **Backend → Database:** JDBC protocol using the MySQL Connector/J driver.

### **REST API**

The backend REST API is defined using **OpenAPI** specification.  
A generated **HTML version** of the documentation is available for direct viewing on GitHub without executing the application:

📄 **[View REST API Documentation](/docs/api/api-docs.html)**

---

## ✅ Quality Assurance

### 🧪 Backend

The backend has undergone several layers of automated testing to ensure reliability, maintainability, and correctness of the implemented features.

#### **Types of Test**

- **Unit Tests** — Validating the logic of individual service classes in isolation.  
  - Example: `ApartmentService` tested using **Mockito** to mock the repository layer.
- **Integration Tests** — Testing service behavior with a real database connection.  
  - Example: `ApartmentService` tested using **Testcontainers** with a **MySQL** container.
- **End-to-End (E2E) Tests** — Validating the full API functionality from request to database.  
  - Example: API tested using **Testcontainers** with **MySQL** for persistence.

#### **Test Execution Metrics**

The following table summarizes the coverage report for the backend (generated using **JaCoCo**):

| Metric                | Value         |
|-----------------------|--------------|
| **Line Coverage**     | 73% (55/210 instructions missed) |
| **Branch Coverage**   | 100% (0/2 branches missed)        |
| **Number of Classes** | 6            |
| **Number of Methods** | 33 total, 11 missed              |

#### **Coverage by Package**

| Package | Line Coverage | Branch Coverage |
|---------|--------------|----------------|
| `com.skyapartments.backend.dto`        | 47% | N/A |
| `com.skyapartments.backend.model`      | 62% | N/A |
| `com.skyapartments.backend`            | 37% | N/A |
| `com.skyapartments.backend.service`    | 100%| N/A |
| `com.skyapartments.backend.controller` | 100%| 100% |

#### **Coverage Report Screenshot**

![Backend Coverage Report](/docs/coverage-report/backend.jpg)

### 🧪 Frontend

It has been tested at three different levels: **unit testing**, **integration testing**, and **end-to-end (E2E) testing**.  
The goal of these tests is to ensure the correct functionality of individual components, service integration, and the overall user flow.

#### **Types of Test**

- **Unit Tests** — Validating the logic of individual components in isolation using a virtual DOM and mocked services.  
  - Example: Testing `ApartmentListComponent` with mocked `ApartmentService` using **Jasmine** and **Karma**.  
- **Integration Tests** — Testing component and service interactions using **TestBed** with a real database connection.  
  - Example: Testing `BookingComponent` with **TestBed** against a real **MySQL** instance.  
- **End-to-End (E2E) Tests** — Validating the complete user flow in the browser.  
  - Example: Booking flow tested using **Playwright** from UI actions to backend responses.  

#### **Coverage Metrics - Unit & Integration Tests**

Frontend test coverage is generated using **Karma + Istanbul** with the command:

```bash
ng test --code-coverage
```

This generates a coverage report in `frontend/coverage/frontend` folder.

##### **Coverage Sumary**

|Type      |Coverage|
|----------|--------|
|Lines     | 100%   |
|Functions | 100%   |
|Branches  | 100%   |
|Statements| 100%   |

![Frontend Coverage Report](/docs/coverage-report/frontend_Unit_Integration.jpg)

#### **Ent-to-End (E2E) Tests**

Executed with:

``` bash
npx playwright test
```

To open the interactive report:

```bash
npx playwright show-report
```

![📸 Playwright report screenshot](/docs/coverage-report/frontend_e2e.jpg)

---

## 🔄 Development Process

The development of the application followed an **iterative and incremental process**, inspired by the **Agile Manifesto** principles.

Although the project does not strictly follow Scrum or Kanban, some **Extreme Programming (XP)** practices were applied, such as continuous integration, automated testing, and short development iterations.

---

## 1. Task Management

Task management was handled using **GitHub Issues** and **GitHub Projects**, supported by a **visual Kanban board**.  
This allowed clear tracking of requirements, prioritization of tasks, and progress monitoring.

- **GitHub Issues** → Used to register bugs, enhancements, and new features.  
- **GitHub Projects (Kanban board)** → Provided a visual workflow with columns such as *To Do*, *In Progress*, and *Done*.  

📸 *Example of GitHub Project board:*  
![GitHub Project Board](/docs/images/github_project.jpg)

---

## 2. Git Workflow

Version control was managed using **Git** with a **branching strategy** based on *feature branches*, *fix branches*, and *main branch protection*.

- **`main` branch** → Stable branch, always deployable.  
- **Feature branches** (`feature/*`) → Created for each new functionality.  
- **Fix branches** (`fix/*`) → Created for bug resolution.  
- **Other branches** (`testing/*`, `ci/*`, `docs/*`) → Used for upload documentation, testing, or workflow configuration.  
- **Pull Requests** → Enforced code reviews and CI execution before merging.

---

## 3. Continuous Integration (CI)

The project used **GitHub Actions** for continuous integration.  
Two workflows were defined:

### 🔹 Basic Quality Check

- Triggered on pushes to `feature/*`, `fix/*`, `testing/*`, and `ci/*`.
- Runs **basic unit tests** for both backend and frontend.  

**Jobs:**

- `backend-basic` → Executes backend unit tests (`mvn test -Dtest='*UnitTest'`).
- `frontend-basic` → Installs dependencies and runs frontend unit tests (`npm run test:unit`).  

---

### 🔹 Full Quality Check

- Triggered on pull requests to `main`.  
- Executes **all test types** for both backend and frontend.  

**Jobs:**

- `backend-full`  
  - Runs **unit tests**, **integration tests**, and **end-to-end (E2E)** tests in Spring Boot.  

- `frontend-integration`  
  - Spins up a **MySQL container** and the backend.  
  - Runs **frontend integration tests** with a live database and backend.  

- `frontend-unit-e2e`  
  - Runs **frontend unit tests**.  
  - Starts the frontend server.  
  - Executes **Playwright E2E tests** in a real browser.  

---

## 4. Workflow Diagram

```mermaid
flowchart TD

    A[GitHub Issue Created] --> B[Branch Created]
    B -->|feature/* or fix/*| C[Push to Branch]
    C --> D[Basic Quality Check]
    D --> E[Pull Request to main]
    E --> F[Full Quality Check]
    F -->|All tests pass| G[Merge to main]
    F -->|Failure| H[Fix Issues and Repeat]
```

## 5. Summary

- The development process was **iterative and incremental**, adopting lightweight Agile practices.

- Task management relied on **GitHub Issues and Projects**, ensuring transparency.

- A clear **Git branching strategy** was applied, including `feature/*` and `fix/*`.

- **Continuous Integration** was implemented via **GitHub Actions**, with two workflows:

  - `Basic Quality Check` (on branch pushes).

  - `Full Quality Check` (on pull requests to `main`).

---

## ▶️ Code Execution and Environment Setup

## 1. Repository Setup

To clone the repository, use the following command:

```bash
git clone https://github.com/codeurjc-students/2025-sky-apartments.git
cd 2025-sky-apartments
```

## 2. Prerequisites

- **Java:** 17  
- **Node.js:** 20.18.0  
- **MySQL:** 8.0 (via Docker)  
- **Maven Wrapper** (included in the repository, so no need to install Maven globally).

## 3. Database Setup

Run the following Docker command to start the MySQL container:

```bash
docker run --name mysql-skyapartments   -e MYSQL_ROOT_PASSWORD=root   -e MYSQL_DATABASE=skyapartments   -e MYSQL_USER=user   -e MYSQL_PASSWORD=password   -p 3306:3306   -d mysql:8.0
```

## 4. Backend Execution

Navigate to the backend folder and start the Spring Boot server:

```bash
cd backend
mvn spring-boot:run
```

The backend will run on: **http://localhost:8080**  
API base URL: **http://localhost:8080/api/apartments/**

## 5. Frontend Execution

Navigate to the frontend folder and start Angular:

```bash
cd frontend
npm install
npm start
# or
ng serve
```

The frontend will be available at: **http://localhost:4200**

A proxy configuration is used to forward `/api` requests to the backend.

## 6. Development Tools

- **IDE:** Any Java-compatible IDE (e.g., IntelliJ IDEA, VS Code, Eclipse) for backend, and VS Code for frontend.  
- **Postman:** Used to interact with the backend REST API.  
  - The Postman collection is provided in the repository:  
    `backend/postman/Sky Apartments.postman_collection.json`

This file includes example requests for all REST API operations with sample data.

## 7. Running Tests

### Backend Tests

```bash
cd backend
mvn test
```

### Frontend Unit & Integration Tests

```bash
cd frontend
npm run test
npm run test:integration  # backend must be running
```

### End-to-End Tests (Playwright)

```bash
cd frontend
npm run test:e2e  # backend and frontend must be running
```

To view the Playwright report:

```bash
npx playwright show-report
```

## 8. Creating a Release

Releases are created manually via **GitHub Releases**.

Go to the repository’s **Releases** section, draft a new release, tag it, and publish.

---
[👉 Go back](/README.md)
