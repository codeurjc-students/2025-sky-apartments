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
| **Quality Control**| Unit, integration and E2E tests; static code analysis |
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

---

## 🏗️ Architecture



---

### ✅ Quality Assurance

---

### 🔄 Development Process

---

### ▶️ Code Execution and Environment Setup

---
[👉 Go back](/README.md)
