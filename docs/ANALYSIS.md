# System Analysis Document

This document provides an overview of the technologies, structure, data model, and main features of the application.

## 1. Technologies and Structure

### 1.1 Frontend

*   **Framework/Tooling:** React (with Vite)
*   **UI Library:** React
*   **Styling:** Tailwind CSS
*   **Component Library:** shadcn/ui (presence to be confirmed by checking `frontend/src/components`)
*   **Language:** TypeScript
*   **Key Directories (within `frontend/`):**
    *   `src/`: Contains the main application source code.
    *   `src/components/`: Houses reusable UI components.
    *   `src/pages/`: Contains page-level components.
    *   `src/services/`: For API interaction logic.
    *   `src/contexts/`: For React context-based state management.
    *   `src/hooks/`: Custom React hooks.
*   **Structure:** The frontend is a single-page application (SPA) built with React and Vite. Components are organized into `components` and `pages`. API interactions are likely managed in `services`. State management might be a combination of local component state, React Context, and custom hooks.

### 1.2 Backend

*   **Runtime Environment:** Node.js
*   **Framework:** Express.js
*   **Database ORM:** Prisma
*   **Language:** TypeScript
*   **Key Directories/Files (within `backend/`):**
    *   `src/`: Contains the main application source code.
    *   `src/controllers/`: Request handlers for different routes.
    *   `src/services/`: Business logic separated from controllers.
    *   `src/routes/`: Defines API endpoints.
    *   `src/middleware/`: Custom middleware (e.g., for authentication).
    *   `prisma/`: Contains the database schema (`schema.prisma`) and migration files. (Located at `backend/prisma/`)
    *   `src/index.ts`: Entry point for the backend application.
*   **Structure:** The backend is a RESTful API built with Node.js and Express.js. It follows a typical Model-View-Controller (MVC)-like pattern, with routes, controllers, and services. Prisma is used as the ORM for database interaction. Authentication is likely handled by custom middleware interacting with services.

### 1.3 Database

*   **Type:** PostgreSQL (inferred from the `provider` in `schema.prisma`)
*   **Schema Definition:** Managed by Prisma (`prisma/schema.prisma`)

## 2. Data Model

The data model is defined in `prisma/schema.prisma`.

```prisma
model User {
  id             String    @id @default(cuid())
  name           String?
  email          String    @unique
  emailVerified  DateTime?
  image          String?
  hashedPassword String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  role           UserRole  @default(USER) // Added based on e2e tests & common practice
  appointments   Appointment[] @relation("UserAppointments")
  barberAppointments Appointment[] @relation("BarberAppointments")
  services       BarberService[] // Services offered by a barber
  schedules      Schedule[]      // Schedules managed by a barber
  comments       Comment[]       // Comments made by user (generic, if applicable)
  notifications  Notification[]  // Notifications for the user
}

enum UserRole {
  USER
  BARBER
  ADMIN
}

model Service { // Renamed from Post to Service as it fits a barber app
  id          String    @id @default(cuid())
  name        String
  description String?
  price       Float
  duration    Int // Duration in minutes
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  barberServices BarberService[]
}

model BarberService { // Link table for Barbers and Services they offer
  id          String   @id @default(cuid())
  barber      User     @relation(fields: [barberId], references: [id])
  barberId    String
  service     Service  @relation(fields: [serviceId], references: [id])
  serviceId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  appointments Appointment[]

  @@unique([barberId, serviceId])
}

model Appointment {
  id              String        @id @default(cuid())
  user            User          @relation("UserAppointments", fields: [userId], references: [id])
  userId          String
  barber          User          @relation("BarberAppointments", fields: [barberId], references: [id]) // Who is performing the service
  barberId        String
  barberService   BarberService @relation(fields: [barberServiceId], references: [id])
  barberServiceId String
  startTime       DateTime
  endTime         DateTime
  status          AppointmentStatus @default(PENDING)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  notes           String?
  paymentDetails  Json?      // Could store payment intent IDs, status, etc.
  comments        Comment[]  // Comments specific to this appointment
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NOSHOW
}

model Schedule { // Represents a barber's availability
  id          String   @id @default(cuid())
  barber      User     @relation(fields: [barberId], references: [id])
  barberId    String
  dayOfWeek   Int // 0 for Sunday, 1 for Monday, etc.
  startTime   String // e.g., "09:00"
  endTime     String // e.g., "17:00"
  isAvailable Boolean  @default(true) // Allows blocking out specific times if needed, though breaks might be better
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  breaks      ScheduleBreak[]

  @@unique([barberId, dayOfWeek, startTime, endTime]) // Ensure no overlapping general schedules
}

model ScheduleBreak { // Time off within a schedule
  id          String   @id @default(cuid())
  schedule    Schedule @relation(fields: [scheduleId], references: [id])
  scheduleId  String
  breakStart  String   // e.g., "12:00"
  breakEnd    String   // e.g., "13:00"
  reason      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Comment { // More generic comment model
  id            String     @id @default(cuid())
  text          String
  user          User       @relation(fields: [userId], references: [id])
  userId        String
  appointment   Appointment? @relation(fields: [appointmentId], references: [id])
  appointmentId String?    // Comment can be on an appointment
  // Add other relations if comments can be on other things e.g. blog posts if they exist
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model Notification {
  id        String    @id @default(cuid())
  user      User      @relation(fields: [userId], references: [id])
  userId    String
  message   String
  read      Boolean   @default(false)
  type      NotificationType
  link      String?   // Link to relevant page (e.g., appointment details)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

enum NotificationType {
  APPOINTMENT_BOOKED
  APPOINTMENT_REMINDER
  APPOINTMENT_CANCELLED
  APPOINTMENT_UPDATED
  REVIEW_REQUEST
  GENERAL_ANNOUNCEMENT
}

// Removed Like model as it's less relevant for a barber booking app
// The previous Post model is now Service, and BarberService links Users (Barbers) to Services.
```

### Key Entities:

*   **`User`**: Represents users (customers, barbers, admins).
    *   Includes roles (`USER`, `BARBER`, `ADMIN`).
    *   Barbers can offer `BarberService`s and manage `Schedule`s.
    *   Users have `Appointment`s.
*   **`Service`**: Represents a type of service offered (e.g., "Haircut", "Shave").
    *   Has `name`, `description`, `price`, `duration`.
*   **`BarberService`**: Links a `User` (barber) to a `Service` they offer. This acts as the specific service offering by a particular barber.
*   **`Appointment`**: Represents a booking.
    *   Links a `User` (customer) to a `User` (barber) for a specific `BarberService`.
    *   Has `startTime`, `endTime`, `status` (e.g., PENDING, CONFIRMED, CANCELLED).
*   **`Schedule`**: Defines a barber's general availability for a `dayOfWeek`.
    *   Includes `startTime`, `endTime`.
    *   Can have `ScheduleBreak`s (e.g., lunch break).
*   **`ScheduleBreak`**: Represents a period of unavailability within a `Schedule`.
*   **`Comment`**: Can be linked to an `Appointment` (e.g., for reviews or notes).
*   **`Notification`**: For user alerts (e.g., appointment confirmations, reminders).

## 3. Main Features and Functionalities

Based on the corrected project structure and the more domain-specific data model (barber/appointment system), the application likely supports:

### 3.1 User Management & Authentication

*   **Role-Based Access Control (RBAC):** Different functionalities for `USER`, `BARBER`, `ADMIN` roles.
*   **Registration/Login:** For all user types. Backend likely uses JWTs for session management (`backend/src/middleware/auth.ts`).
*   **Profile Management:** Users can view/edit their profiles. Barbers might have extended profiles showing services and schedules.

### 3.2 Service Management (Primarily by Barbers/Admins)

*   **Create/Update/Delete Services:** Admins or Barbers define the `Service`s available (e.g., "Men's Haircut", "Beard Trim").
*   **Manage Barber Services:** Barbers associate `Service`s with their profile via `BarberService`, potentially setting their own pricing or duration if the model were extended.

### 3.3 Schedule Management (by Barbers)

*   **Define Availability:** Barbers set their weekly `Schedule` (working days, hours).
*   **Manage Breaks:** Barbers can add `ScheduleBreak`s to their schedule.
*   **View Calendar/Schedule:** Barbers can see their bookings and availability.

### 3.4 Appointment Booking & Management (Users, Barbers)

*   **Browse Barbers/Services:** Users can find barbers and the services they offer.
*   **Check Availability:** Users can see a barber's available slots based on their `Schedule` and existing `Appointment`s.
*   **Book Appointment:** Users can book an available slot.
*   **View Appointments:** Users and Barbers can see their upcoming/past appointments.
*   **Cancel/Reschedule Appointment:** Functionality to modify appointments, potentially with rules (e.g., cancellation window).
*   **Appointment Status Updates:** Status changes from `PENDING` to `CONFIRMED`, `COMPLETED`, etc.

### 3.5 Notifications

*   **Automated Notifications:** For appointment booking, reminders, cancellations (via `Notification` model and `NotificationType` enum).

### 3.6 Potential Administrative Features (ADMIN role)

*   **User Management:** Oversee all users, manage roles.
*   **Platform-wide Service Management:** Manage the canonical list of `Service` types.
*   **Oversee Appointments/Schedules:** Potentially manage any appointment or schedule in the system.
*   **Reporting/Analytics:** (Not explicitly in schema but common for admin panels).

This analysis has been updated to reflect a separate frontend/backend architecture and a data model tailored for a barber appointment system. The Prisma schema in `backend/prisma/schema.prisma` is the source of truth for the data model.

## 4. Potential Areas for Improvement

This section outlines potential areas for improvement based on a review of the codebase structure and selected files.

### 4.1 Backend (`backend/src`)

**Code Smells & Maintainability:**

*   **Large Services/Controllers:**
    *   `AppointmentService.ts` and `AppointmentController.ts` are quite large and handle many responsibilities.
    *   **Suggestion:** Consider breaking them down. For example, `AppointmentService` could delegate parts of its logic (like complex availability calculations or specific status transitions) to smaller, more focused services. `AppointmentController` actions could potentially be grouped into more granular controllers if the number of actions per resource becomes unwieldy.
*   **Complex Logic in Services:**
    *   The `getAvailableSlots` method in `AppointmentService.ts` has complex logic for merging various schedule types (global, barber, exceptions). While necessary, this is a point of high complexity.
    *   **Suggestion:** Ensure this logic is extremely well-tested. Consider if any parts can be simplified or if a different data representation for availability could make querying easier. Performance profiling under load is recommended here.
*   **Repetitive Zod Schemas:** While Zod schemas in controllers (e.g., `AppointmentController.ts`) are good for validation, there might be some repetition if similar validation logic is needed across different controllers or services.
    *   **Suggestion:** Define common Zod types in a shared location (`backend/src/types` or `backend/src/schemas`) and reuse them to improve consistency and reduce boilerplate.

**Performance:**

*   **Database Queries in `AppointmentService.ts`:**
    *   Methods like `getAvailableSlots` and `create` (with its validation steps) involve multiple database queries.
    *   **Suggestion:** While Prisma helps prevent common N+1 problems, review complex operations for query efficiency. For `getAvailableSlots`, consider if some schedule/exception data could be pre-fetched or cached, especially if it doesn't change frequently. Use `prisma.$on('query', ...)` for debugging query counts in development.
*   **Stats Calculation:** The `getStats` method performs multiple `count` queries.
    *   **Suggestion:** For more complex analytics or dashboards, consider if some statistics can be denormalized or if read replicas with optimized analytical queries would be beneficial in the long run. For current use, it's likely acceptable.

**Security:**

*   **JWT Secret Management:** `AuthService.ts` has a default JWT secret (`process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'`).
    *   **Suggestion:** Ensure this is *always* overridden by a strong, environment-specific secret in production. Document this requirement clearly. Consider tools for secret management.
*   **Authorization Logic:** The `auth.ts` middleware and controller-level checks for roles and ownership (e.g., in `AppointmentController.ts`) are good.
    *   **Suggestion:** As the application grows, ensure consistent application of these checks. For highly complex authorization rules, consider a dedicated authorization library (e.g., CASL) to centralize and manage policies. The `authorizeSameBarbershop` middleware appears to be a placeholder or simplified; it should be fully implemented if cross-barbershop access control by non-SUPER_ADMINs is a concern.

**Error Handling:**

*   Controllers generally handle Zod errors and other exceptions, returning appropriate HTTP status codes.
*   **Suggestion:** Standardize error response formats across the API for consistency. Consider a global error handling middleware in Express to catch unhandled exceptions and ensure no sensitive error details are leaked.

### 4.2 Frontend (`frontend/src`)

**Component Design & State Management:**

*   **Large Components:**
    *   `DashboardPage.tsx` is a very large component managing layout, multiple views, and its own data fetching/state.
    *   **Suggestion:** Decompose `DashboardPage.tsx` into smaller, more focused components (e.g., `Sidebar`, `PageHeader`, `DashboardMetricsGrid`, `QuickActionsPanel`). This will improve readability, testability, and reusability.
*   **State Management in `DashboardPage.tsx`:** Uses `useState` for managing dashboard metrics and view state.
    *   **Suggestion:** For its current scope, this might be acceptable. If global state becomes more complex or shared across many unrelated components, consider a lightweight global state manager (like Zustand or Jotai) or a more robust one (Redux Toolkit) if the complexity warrants it.
*   **`AuthContext.tsx`:** Provides a solid foundation for authentication.
    *   **Security:** Storing JWTs in `localStorage` (as `AuthContext.tsx` does) can be vulnerable to XSS attacks.
    *   **Suggestion:** For enhanced security, consider storing tokens in secure, HTTPOnly cookies, which are not accessible via JavaScript. This would require backend cooperation to set and read cookies.
*   **Custom Hooks (`useSchedule.ts`, `useBarberServices.ts`):** These hooks encapsulate feature-specific logic and API interactions, which is good practice.
    *   `useSchedule.ts` is quite large itself, managing state for global/barber schedules and exceptions.
    *   **Suggestion:** If these hooks grow significantly more complex, consider if they can be broken down further or if a more structured state management solution is needed for their internal state.

**API Interactions:**

*   **`appointmentApi.ts`:**
    *   The `getDashboardMetrics` function currently makes multiple `getStats` calls.
    *   **Suggestion:** If performance becomes an issue or the dashboard needs more varied data, create a dedicated backend endpoint that aggregates all necessary dashboard metrics in a single call.
    *   The `getAuthHeaders` method reads `localStorage.getItem('token')`. This should ideally use the `getToken` method from `AuthContext` if this context is meant to be the single source of truth for token management, or the API service should be context-aware.
*   **Loading and Error States:** `DashboardPage.tsx` handles loading for stats. `AuthContext` handles its own loading state.
    *   **Suggestion:** Ensure consistent handling of loading and error states across the application. Consider a more centralized way to display global notifications or errors (e.g., using a toast library integrated with API call states).

**Code Organization & Reusability:**

*   **Icon Components in `DashboardPage.tsx`:** SVG icons are defined directly within the file.
    *   **Suggestion:** Move SVG icons to a dedicated `components/icons` directory and import them. This cleans up the `DashboardPage` and makes icons reusable.
*   **Styling:** Tailwind CSS is used effectively for styling.
    *   **Suggestion:** Ensure consistent use of design tokens (colors, spacing) possibly defined in `tailwind.config.js` to maintain visual consistency.

### 4.3 Test Coverage

*   **Backend Tests (`backend/src/tests`):**
    *   `appointments.test.ts` provides good service-level integration tests for `AppointmentService` using a real database connection.
    *   **Suggestion:** Add controller-level tests to verify request/response handling, Zod validation integration, and middleware execution (authentication, authorization). Unit tests for particularly complex algorithmic parts of services (like `getAvailableSlots` logic) could also be beneficial.
*   **Frontend Tests (`frontend/src/tests`):**
    *   `useBarberServices.test.ts` shows good unit testing practice for custom hooks, mocking API dependencies.
    *   **Suggestion:**
        *   Add rendering tests for major components like `DashboardPage.tsx` (and its future sub-components) to verify UI based on different states and props (e.g., using React Testing Library).
        *   Ensure critical UI flows within components (e.g., form submissions in `ScheduleManager` or `BarberServiceManager` if they exist as described) are tested.
*   **E2E Tests (`e2e`):**
    *   `appointments.spec.ts` demonstrates good E2E testing practices with Playwright, covering various user flows by mocking API responses.
    *   **Suggestion:** While mocking is useful for isolating frontend logic, supplement these with a few key "smoke tests" or critical path tests that run against a real (test environment) backend. This helps catch integration issues between frontend and backend that mocks might miss.
*   **General Testing:**
    *   **Test Data Management:** Backend tests use `cleanDatabase` and `setupTestData`. This is good. Ensure this setup is robust and can scale with more complex test scenarios.
    *   **Coverage Reports:** Implement and regularly review code coverage reports (e.g., using Jest's `--coverage` or tools like Coveralls/Codecov) to identify untested parts of the codebase. Aim for a reasonable coverage target, focusing on critical logic.

### 4.4 General Suggestions (Organization, Maintainability, Scalability)

*   **Configuration Management:**
    *   Centralize environment variables and application configuration. Ensure clear documentation for all required environment variables (e.g., `JWT_SECRET`, `DATABASE_URL`, `VITE_API_URL`).
*   **Logging:**
    *   Implement structured logging (e.g., using Winston or Pino) on the backend for better traceability and debugging in production.
*   **Documentation:**
    *   Continue maintaining `ANALYSIS.md`.
    *   Add API documentation (e.g., using Swagger/OpenAPI for backend routes).
    *   Consider Storybook for frontend components if the component library grows significantly.
*   **Dependency Management:**
    *   Regularly review and update dependencies to patch security vulnerabilities and leverage new features. Use tools like `npm audit` or Snyk.
*   **Code Formatting and Linting:**
    *   The presence of `.prettierrc.json` and `.eslintrc.js` suggests these are already in use. Ensure they are enforced consistently, possibly with pre-commit hooks (e.g., Husky + lint-staged).
*   **Scalability Considerations (Long-term):**
    *   **Database:** For high traffic, consider read replicas, connection pooling optimization.
    *   **Backend:** Stateless backend services are easier to scale horizontally. Monitor performance and identify bottlenecks.
    *   **Frontend:** Ensure efficient rendering, code splitting (Vite handles this well), and optimized asset delivery.

These suggestions aim to enhance the robustness, maintainability, performance, and security of the application as it evolves.

## 5. Project Purpose and Functionality Summary

This section provides a high-level overview of the application's main goal, target users, and core business logic.

### 5.1 Main Goal

The primary goal of the application is to offer a comprehensive digital platform for barber shops to manage their operations efficiently. This includes streamlining appointment booking for clients, enabling barbers to manage their schedules and services, and providing administrative oversight for barbershop owners/managers. The system aims to improve the overall experience for both customers and barbershop staff.

### 5.2 Target Users

The application is designed to cater to several user roles, each with specific functionalities:

*   **Clients (Customers):**
    *   Browse available services and barbers.
    *   View barber availability and book appointments.
    *   Manage their existing appointments (e.g., view, potentially cancel or reschedule).
    *   Receive notifications about their appointments.
*   **Barbers:**
    *   Manage their work schedules, including defining working hours and breaks.
    *   List and manage the services they offer, potentially with custom pricing or duration (as per `BarberService` model).
    *   View and manage their appointments (confirm, start, complete, mark no-show).
    *   View their client list and appointment history.
*   **Barbershop Administrators (`ADMIN` role):**
    *   Oversee all operations for a specific barbershop.
    *   Manage barbers within their shop (add, remove, edit profiles/schedules).
    *   Manage the list of services offered by the barbershop.
    *   View all appointments within their barbershop.
    *   Handle exceptions and special hours for the barbershop.
    *   (Potentially) Manage client information and view barbershop-level statistics.
*   **Super Administrators (`SUPER_ADMIN` role):**
    *   (Inferred) Have full oversight over the entire platform, potentially managing multiple barbershops, platform-wide configurations, and all user accounts. This role is typical for SaaS platforms.

### 5.3 Key Business Logic

The core functionality of the application revolves around the following key business processes:

*   **User Authentication and Authorization:**
    *   Secure registration and login for all user types.
    *   Role-Based Access Control (RBAC) to ensure users can only access features relevant to their role (e.g., clients cannot access barber schedule management). This is enforced by backend middleware and checked in frontend UI components.
*   **Service Management:**
    *   Barbershops (via Admins) or the platform (via Super Admins) can define a catalog of `Service`s (e.g., "Men's Haircut", "Beard Trim") with standard descriptions, durations, and base prices.
    *   Barbers can then be associated with these services through the `BarberService` model, allowing them to specify if they offer a particular service and potentially set a `customPrice`.
*   **Schedule and Availability Management:**
    *   Barbershops can define `GlobalSchedule`s (general opening hours and global breaks like lunch).
    *   Individual `Barber`s can define their specific `BarberSchedule`s (working days, start/end times, personal breaks), which can override or complement the global schedule.
    *   Both barbershops and individual barbers can set `GlobalException`s and `BarberException`s (e.g., holidays, special hours, days off) to manage deviations from regular schedules.
    *   The system calculates actual `AvailableSlot`s by combining these layers of schedules and exceptions, also considering existing appointments and service durations.
*   **Appointment Booking and Lifecycle:**
    *   Clients can search for available slots based on criteria like barber, service, and date.
    *   The booking process involves selecting a service, barber, and an available time slot, then confirming the appointment.
    *   Appointments transition through various statuses:
        *   `SCHEDULED`: Initial status upon booking.
        *   `CONFIRMED`: Typically confirmed by a barber or admin.
        *   `IN_PROGRESS`: When the service is actively being performed.
        *   `COMPLETED`: After the service is finished.
        *   `CANCELLED`: If the appointment is cancelled by the client or staff.
        *   `NO_SHOW`: If the client does not appear for the appointment.
*   **Pricing and Payment (Basic):**
    *   The system calculates `totalPrice` for an appointment based on the `Service` price or the `BarberService` `customPrice`.
    *   The Prisma schema includes a `paymentDetails: Json?` field in the `Appointment` model, suggesting that integration with a payment system or tracking of payment information is a potential or planned feature, though the current analysis did not delve into its implementation.
*   **Notifications:**
    *   The `Notification` model and `NotificationType` enum suggest a system for alerting users about important events, such as appointment confirmations, reminders, cancellations, or updates. The exact trigger and delivery mechanisms for these notifications are not detailed in the current analysis but are a key part of the business logic.
