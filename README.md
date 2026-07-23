# Tasks Manager

A full-stack User and Task Management System built with Angular, Spring Boot, Bootstrap, MySQL, JWT, and WebSocket notifications.

## Features

- Login with `ADMIN` and `USER` roles.
- Role-based dashboards and protected APIs.
- Admin user management: create, view, edit, delete, search, and filter users.
- Admin task management: create, assign, edit, delete, search, and filter tasks.
- Users can view assigned tasks and update their status.
- Admins and Users can view task details and add comments.
- Profile management for name, email, and password.
- Activity log for login, logout, user, task, comment, and profile actions.
- Real-time role-specific notifications with unread status.

## Technologies

- Frontend: Angular, TypeScript, Bootstrap
- Backend: Java 21, Spring Boot, Spring Security, Spring Data JPA
- Security: JWT and BCrypt
- Database: MySQL
- Real-time: WebSocket and STOMP

## Database Setup

This project uses **MySQL**.

```sql
CREATE DATABASE tasks_manager;
```

Configure the backend using `application.properties` or environment variables:

```text
DB_URL=jdbc:mysql://localhost:3306/tasks_manager
DB_USERNAME=root
DB_PASSWORD=YOUR_PASSWORD
JWT_SECRET=YOUR_SECURE_BASE64_SECRET
```

Hibernate creates and updates the tables automatically.

## Run the Project

### Backend

```bash
cd tasks-manager-backend
mvn spring-boot:run
```

```text
http://localhost:8080
```

### Frontend

```bash
cd tasks-manager-frontend
npm install
npm start
```

```text
http://localhost:4200
```

## Demo Accounts

The Admin account is created from the backend configuration.  
Regular User accounts can be created from the Admin User Management page.

## Deployment

- Frontend: Netlify
- Backend: Render
- Database: Aiven MySQL

Live frontend:

```text
https://tasks-manager-frontend.netlify.app
```

## Submission Video

The 2–3 minute video demonstrates Admin and User login, user and task management, task comments, status updates, profile management, activity logs, and real-time notifications.
