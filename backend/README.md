# Leave Management System — Backend API

> A RESTful backend API for managing employee leaves, built with **Node.js**, **Express.js**, and **MongoDB**.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Database Schema / Models](#3-database-schema--models)
4. [Authentication Mechanism](#4-authentication-mechanism)
5. [Middleware](#5-middleware)
6. [Error Handling Strategy](#6-error-handling-strategy)
7. [Standard API Response Structure](#7-standard-api-response-structure)
8. [Pagination Structure](#8-pagination-structure)
9. [Environment Variables](#9-environment-variables)
10. [Setup & Running Locally](#10-setup--running-locally)
11. [API Endpoints Reference](#11-api-endpoints-reference)
    - [Users](#111-users-apiusers)
    - [Departments](#112-departments-apidepartments)
    - [Leave Types](#113-leave-types-apileave-types)
    - [Leave Requests](#114-leave-requests-apileave-requests)
    - [Leave Balances](#115-leave-balances-apileave-balances)
12. [Role & Permission Matrix](#12-role--permission-matrix)
13. [Frontend Developer Guide](#13-frontend-developer-guide)

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18 |
| Framework | Express.js | ^5.2.1 |
| Database | MongoDB (via Mongoose) | ^9.2.3 |
| Authentication | JSON Web Tokens (JWT) | ^9.0.3 |
| Password Hashing | bcrypt | ^6.0.0 |
| Input Validation | express-validator | ^7.3.1 |
| Cookie Parsing | cookie-parser | ^1.4.7 |
| CORS | cors | ^2.8.6 |
| Config | dotenv | ^17.3.1 |
| Dev Server | nodemon | ^3.1.14 |
| Module System | ES Modules (`type: "module"`) | — |

---

## 2. Project Structure

```
backend/
├── package.json              # Project metadata & npm scripts
├── public/
│   └── temp/                 # Temporary file storage (static)
└── src/
    ├── app.js                # Express app setup (CORS, middleware, routes, global error handler)
    ├── constant.js           # App-wide constants (DB_NAME)
    ├── index.js              # Entry point: env validation, DB connect, server start
    ├── seed.js               # Database seeding script
    ├── controller/           # Route handlers (business logic)
    │   ├── user.controller.js
    │   ├── department.controller.js
    │   ├── leaveType.controller.js
    │   ├── leaveRequest.controller.js
    │   └── leaveBalance.controller.js
    ├── db/
    │   └── index.js          # Mongoose connection
    ├── middleware/
    │   ├── auth.middleware.js     # JWT verification & role authorization
    │   └── validate.middleware.js # express-validator error collector
    ├── model/                # Mongoose schemas & models
    │   ├── User.js
    │   ├── Department.js
    │   ├── LeaveType.js
    │   ├── LeaveRequest.js
    │   └── LeaveBalance.js
    ├── routes/               # Express routers
    │   ├── user.route.js
    │   ├── department.route.js
    │   ├── leaveType.route.js
    │   ├── leaveRequest.route.js
    │   └── leaveBalance.route.js
    ├── utils/
    │   ├── apiError.js       # Custom error class
    │   ├── apiResponse.js    # Standard response wrapper
    │   └── asyncHandler.js   # Async error propagation helper
    └── validators/           # express-validator rule arrays
        ├── user.validators.js
        ├── department.validators.js
        ├── leaveType.validators.js
        ├── leaveRequest.validators.js
        └── leaveBalance.validators.js
```

---

## 3. Database Schema / Models

### 3.1 User

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | Yes | Trimmed, 2–50 chars |
| `email` | String | Yes | Unique, lowercase, indexed |
| `password` | String | Yes | Min 6 chars, hashed via bcrypt, `select: false` |
| `role` | String (enum) | No | `employee` \| `manager` \| `hr` \| `admin`. Default: `employee` |
| `department` | ObjectId → Department | Yes | Indexed |
| `designation` | String | Yes | Job title |
| `status` | String (enum) | No | `active` \| `inactive`. Default: `active` |
| `refreshToken` | String | No | Stored on login, cleared on logout, `select: false` |
| `createdAt` / `updatedAt` | Date | Auto | Mongoose timestamps |

**Indexes:** `email`, `role`, `status`, `department`, compound `{role, status}`

**Methods:**
- `isPasswordCorrect(password)` — bcrypt comparison
- `generateAccessToken()` — signs JWT with `_id`, `email`, `name`, `role`
- `generateRefreshToken()` — signs JWT with `_id` only

---

### 3.2 Department

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | Yes | Unique, trimmed, indexed |
| `description` | String | No | Optional |
| `manager` | ObjectId → User | No | Must have role `manager`, `hr`, or `admin` |
| `createdAt` / `updatedAt` | Date | Auto | Mongoose timestamps |

---

### 3.3 LeaveType

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | Yes | Unique, trimmed, indexed |
| `maxDaysPerYear` | Number | Yes | Min: 1 |
| `carryForwardAllowed` | Boolean | No | Default: `false` |
| `description` | String | No | Optional policy note |
| `isActive` | Boolean | No | Default: `true`, indexed |
| `createdAt` / `updatedAt` | Date | Auto | Mongoose timestamps |

---

### 3.4 LeaveRequest

| Field | Type | Required | Notes |
|---|---|---|---|
| `employee` | ObjectId → User | Yes | Indexed |
| `leaveType` | ObjectId → LeaveType | Yes | Indexed |
| `fromDate` | Date | Yes | — |
| `toDate` | Date | Yes | Must be ≥ `fromDate` (pre-validate hook) |
| `totalDays` | Number | Yes | Calculated (Mon–Sat, skips Sunday) |
| `reason` | String | Yes | Trimmed |
| `status` | String (enum) | No | `pending` \| `approved` \| `rejected` \| `cancelled`. Default: `pending` |
| `approvedBy` | ObjectId → User | No | Set on approve/reject |
| `rejectionReason` | String | No | Required when rejecting |
| `appliedAt` | Date | No | Default: `Date.now` |
| `actionedAt` | Date | No | Set on approve/reject/cancel |
| `createdAt` / `updatedAt` | Date | Auto | Mongoose timestamps |

**Indexes:** `{employee, status}`, `{employee, fromDate}`

---

### 3.5 LeaveBalance

| Field | Type | Required | Notes |
|---|---|---|---|
| `user` | ObjectId → User | Yes | Indexed |
| `leaveType` | ObjectId → LeaveType | Yes | Indexed |
| `year` | Number | Yes | e.g., `2025` |
| `totalAllocated` | Number | Yes | Min: 0 |
| `used` | Number | No | Default: `0` |
| `remaining` | Number | Yes | `totalAllocated - used`, kept in sync |
| `createdAt` / `updatedAt` | Date | Auto | Mongoose timestamps |

**Unique Compound Index:** `{user, leaveType, year}` — one record per user per leave type per year.

---

## 4. Authentication Mechanism

### Flow

```
1. POST /api/users/login
   ↓ Validates credentials
   ↓ Generates accessToken (JWT, default 1d) + refreshToken (JWT, default 10d)
   ↓ Stores refreshToken in DB (User.refreshToken)
   ↓ Sets both tokens as httpOnly cookies
   ↓ Also returns accessToken in JSON body

2. Every protected request
   ↓ verifyJWT middleware reads token from:
     (a) Cookie: accessToken
     (b) Header: Authorization: Bearer <token>
   ↓ Verifies signature, decodes payload
   ↓ Fetches user from DB, checks status not "inactive"
   ↓ Attaches user to req.user

3. POST /api/users/refresh-token
   ↓ Reads refreshToken from cookie or body
   ↓ Verifies & matches against DB value (rotation check)
   ↓ Issues new accessToken + refreshToken pair
   ↓ Updates DB, sets new cookies

4. POST /api/users/logout
   ↓ Clears refreshToken in DB
   ↓ Clears both cookies
```

### Token Details

| Token | Payload | Secret Env Var | Default Expiry |
|---|---|---|---|
| Access Token | `{ _id, email, name, role }` | `ACCESS_TOKEN_SECRET` | `1d` |
| Refresh Token | `{ _id }` | `REFRESH_TOKEN_SECRET` | `10d` |

### Cookie Settings

| Setting | Value |
|---|---|
| `httpOnly` | `true` (not accessible via JS) |
| `secure` | `true` in production, `false` in development |

---

## 5. Middleware

### `verifyJWT` (`auth.middleware.js`)
- Extracts JWT from `req.cookies.accessToken` or `Authorization: Bearer <token>` header.
- Verifies the token against `ACCESS_TOKEN_SECRET`.
- Fetches the user from DB; blocks inactive accounts with `403`.
- Attaches the user object (without `password` and `refreshToken`) to `req.user`.

### `authorizeRoles(...roles)` (`auth.middleware.js`)
- Must be used **after** `verifyJWT`.
- Checks `req.user.role` against the allowed roles array.
- Throws `403` if the role is not permitted.
- Usage: `authorizeRoles("admin", "hr")`

### `validate` (`validate.middleware.js`)
- Placed after `express-validator` rule arrays in routes.
- Calls `validationResult(req)` and throws a `400 ApiError` with the first error message if validation fails.
- The full list of messages is included in the `errors` array of the response.

---

## 6. Error Handling Strategy

All errors are handled by a **global Express error handler** in `app.js`:

```javascript
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
    });
});
```

Controllers throw `ApiError` instances (extending the native `Error` class). The `asyncHandler` utility wraps every async controller and forwards any thrown error to `next(err)`, which triggers the global handler.

### `ApiError` Class

```javascript
new ApiError(statusCode, message, errorsArray)
```

| Property | Description |
|---|---|
| `statusCode` | HTTP status code (400, 401, 403, 404, 409, 500, …) |
| `message` | Human-readable error description |
| `errors` | Array of detailed error messages (from validation etc.) |
| `success` | Always `false` |

---

## 7. Standard API Response Structure

### Success Response

```json
{
  "statusCode": 200,
  "data": { },
  "message": "Operation successful",
  "success": true
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 6 characters"
  ]
}
```

> **Note:** `errors` is an empty array `[]` when there are no additional error details.

---

## 8. Pagination Structure

Endpoints that return lists support pagination via query parameters `page` (default `1`) and `limit` (default `10`).

**Paginated response `data` shape:**

```json
{
  "users": [ ],
  "pagination": {
    "total": 45,
    "page": 2,
    "limit": 10,
    "totalPages": 5
  }
}
```

Paginated endpoints:
- `GET /api/users`
- `GET /api/leave-requests/my`
- `GET /api/leave-requests`
- `GET /api/leave-balances`

---

## 9. Environment Variables

Create a `.env` file in the project root (`backend/.env`):

```env
# ── Required ──────────────────────────────────────────────────────────────────
MONGO_DB_URI=mongodb://localhost:27017
ACCESS_TOKEN_SECRET=your_super_secret_access_key_here
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key_here

# ── Optional (defaults applied if missing) ────────────────────────────────────
PORT=8000
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_DB_URI` | **Yes** | — | MongoDB connection string (without DB name) |
| `ACCESS_TOKEN_SECRET` | **Yes** | — | Secret key for signing access JWTs |
| `REFRESH_TOKEN_SECRET` | **Yes** | — | Secret key for signing refresh JWTs |
| `PORT` | No | `8000` | Port the server listens on |
| `ACCESS_TOKEN_EXPIRY` | No | `1d` | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRY` | No | `10d` | JWT refresh token lifetime |
| `CORS_ORIGIN` | No | `http://localhost:4200` | Allowed CORS origin |
| `NODE_ENV` | No | `development` | Environment (`development` / `production`) |

> The server will **crash on startup** with a descriptive message if `MONGO_DB_URI`, `ACCESS_TOKEN_SECRET`, or `REFRESH_TOKEN_SECRET` are missing.

---

## 10. Setup & Running Locally

### Prerequisites

- Node.js ≥ 18
- MongoDB running locally or a MongoDB Atlas URI

### Step-by-step

```bash
# 1. Clone the repository
git clone <repository-url>
cd "leave management system/backend"

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Then edit .env with your values

# 4. (Optional) Seed the database with sample data
npm run seed

# 5. (Optional) Fresh seed — drops existing data first
npm run seed:fresh

# 6. Start the development server (with auto-reload)
npm start
```

The server starts on `http://localhost:8000` (or the configured `PORT`).

### npm Scripts

| Script | Command | Description |
|---|---|---|
| `npm start` | `nodemon ./src/index.js` | Start with auto-reload |
| `npm run seed` | `node ./src/seed.js` | Seed database |
| `npm run seed:fresh` | `node ./src/seed.js --fresh` | Drop & re-seed database |

### Database Configuration

The database name is fixed as `leave-management` (defined in `src/constant.js`). The full connection URI used is:

```
${MONGO_DB_URI}/leave-management
```

Example with local MongoDB:

```env
MONGO_DB_URI=mongodb://localhost:27017
```

Example with MongoDB Atlas:

```env
MONGO_DB_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net
```

---

## 11. API Endpoints Reference

**Base URL:** `http://localhost:8000/api`

**Common Headers for Protected Routes:**

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

> Alternatively, if you send cookies (browser / cookie-aware client), the `accessToken` cookie is read automatically.

---

### 11.1 Users (`/api/users`)

---

#### `POST /api/users/register`

Register a new user.

- **Auth Required:** No
- **Roles:** Public

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "department": "64f1a2b3c4d5e6f7a8b9c0d1",
  "designation": "Software Engineer",
  "role": "employee"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | String | Yes | 2–50 characters |
| `email` | String | Yes | Valid email format |
| `password` | String | Yes | Min 6 characters |
| `department` | String (MongoId) | Yes | Valid MongoDB ObjectId |
| `designation` | String | Yes | Non-empty |
| `role` | String | No | `employee` \| `manager` \| `hr` \| `admin` |

**Success Response `201`:**

```json
{
  "statusCode": 201,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employee",
    "department": "64f1a2b3c4d5e6f7a8b9c0d1",
    "designation": "Software Engineer",
    "status": "active",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "User registered successfully",
  "success": true
}
```

**Error Responses:**

| Status | Message |
|---|---|
| `400` | Validation errors (name, email, password, etc.) |
| `409` | User with this email already exists |

---

#### `POST /api/users/login`

Login and receive tokens.

- **Auth Required:** No
- **Roles:** Public

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Success Response `200`:**

Sets `accessToken` and `refreshToken` as `httpOnly` cookies.

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "employee",
      "department": { "_id": "64f1a2b3c4d5e6f7a8b9c0d1", "name": "Engineering" },
      "designation": "Software Engineer",
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Logged in successfully",
  "success": true
}
```

**Error Responses:**

| Status | Message |
|---|---|
| `400` | Email and password are required |
| `401` | Invalid credentials |
| `403` | Your account is inactive. Contact admin. |
| `404` | User not found |

---

#### `POST /api/users/logout`

Logout the current user.

- **Auth Required:** Yes

**Request Body:** None

**Success Response `200`:**

Clears `accessToken` and `refreshToken` cookies.

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Logged out successfully",
  "success": true
}
```

---

#### `POST /api/users/refresh-token`

Get a new access token using a refresh token.

- **Auth Required:** No (refresh token used instead)

**Request Body (if not using cookies):**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> The refresh token is also accepted from the `refreshToken` cookie automatically.

**Success Response `200`:**

Sets new `accessToken` and `refreshToken` cookies.

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Access token refreshed successfully",
  "success": true
}
```

**Error Responses:**

| Status | Message |
|---|---|
| `401` | Unauthorized request |
| `401` | Invalid or expired refresh token |
| `401` | Refresh token is expired or already used |

---

#### `GET /api/users/me`

Get the currently authenticated user's profile.

- **Auth Required:** Yes

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employee",
    "department": { "_id": "64f1a2b3c4d5e6f7a8b9c0d1", "name": "Engineering" },
    "designation": "Software Engineer",
    "status": "active"
  },
  "message": "Current user fetched successfully",
  "success": true
}
```

---

#### `PATCH /api/users/update`

Update the current user's account details.

- **Auth Required:** Yes

**Request Body (all fields optional, at least one required):**

```json
{
  "name": "John Updated",
  "designation": "Senior Engineer",
  "department": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "name": "John Updated",
    "email": "john@example.com",
    "role": "employee",
    "department": "64f1a2b3c4d5e6f7a8b9c0d1",
    "designation": "Senior Engineer",
    "status": "active"
  },
  "message": "Account details updated successfully",
  "success": true
}
```

---

#### `PATCH /api/users/change-password`

Change the current user's password.

- **Auth Required:** Yes

**Request Body:**

```json
{
  "oldPassword": "secret123",
  "newPassword": "newSecret456"
}
```

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password changed successfully",
  "success": true
}
```

**Error Responses:**

| Status | Message |
|---|---|
| `400` | Old password is incorrect |
| `400` | New password must be different from old password |

---

#### `GET /api/users`

Get all users with optional filtering and pagination.

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `role` | String | Filter by role (`employee`, `manager`, `hr`, `admin`) |
| `status` | String | Filter by status (`active`, `inactive`) |
| `department` | String (MongoId) | Filter by department ID |
| `page` | Number | Page number (default: `1`) |
| `limit` | Number | Results per page (default: `10`) |

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "users": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "employee",
        "department": { "_id": "64f1a2b3c4d5e6f7a8b9c0d1", "name": "Engineering" },
        "designation": "Software Engineer",
        "status": "active"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  },
  "message": "Users fetched successfully",
  "success": true
}
```

---

#### `PATCH /api/users/:id/status`

Activate or deactivate a user account.

- **Auth Required:** Yes
- **Roles:** `admin`

**Path Parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | String (MongoId) | User ID |

**Request Body:**

```json
{
  "status": "inactive"
}
```

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "name": "John Doe",
    "status": "inactive"
  },
  "message": "User status updated to inactive",
  "success": true
}
```

---

### 11.2 Departments (`/api/departments`)

All department routes require authentication (`verifyJWT` applied globally on the router).

---

#### `GET /api/departments`

Get all departments (sorted by name).

- **Auth Required:** Yes
- **Roles:** Any authenticated user

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Engineering",
      "description": "Software development team",
      "manager": {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "manager",
        "designation": "Engineering Manager"
      }
    }
  ],
  "message": "Departments fetched successfully",
  "success": true
}
```

---

#### `POST /api/departments`

Create a new department.

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`

**Request Body:**

```json
{
  "name": "Engineering",
  "description": "Software development team",
  "manager": "64f1a2b3c4d5e6f7a8b9c0d3"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | Yes | Must be unique |
| `description` | String | No | Optional |
| `manager` | String (MongoId) | No | User must have role `manager`, `hr`, or `admin` |

**Success Response `201`:**

```json
{
  "statusCode": 201,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Engineering",
    "description": "Software development team",
    "manager": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "manager"
    }
  },
  "message": "Department created successfully",
  "success": true
}
```

**Error Responses:**

| Status | Message |
|---|---|
| `400` | Department name is required |
| `400` | Manager must have role: manager, hr, or admin |
| `404` | Manager user not found |
| `409` | Department with this name already exists |

---

#### `GET /api/departments/:id`

Get a single department by ID.

- **Auth Required:** Yes
- **Roles:** Any authenticated user

**Path Parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | String (MongoId) | Department ID |

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Engineering",
    "description": "Software development team",
    "manager": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "manager",
      "designation": "Engineering Manager"
    }
  },
  "message": "Department fetched successfully",
  "success": true
}
```

---

#### `PATCH /api/departments/:id`

Update a department.

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`

**Path Parameters:** `id` — Department ID

**Request Body (all optional, at least one required):**

```json
{
  "name": "Engineering Updated",
  "description": "Updated description",
  "manager": "64f1a2b3c4d5e6f7a8b9c0d3"
}
```

> Set `manager` to `null` to remove the manager.

**Success Response `200`:** Returns the updated department object.

---

#### `DELETE /api/departments/:id`

Delete a department.

- **Auth Required:** Yes
- **Roles:** `admin`

**Path Parameters:** `id` — Department ID

> **Note:** Department cannot be deleted if any users are assigned to it.

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Department deleted successfully",
  "success": true
}
```

**Error Responses:**

| Status | Message |
|---|---|
| `400` | Cannot delete department. N user(s) are still assigned to it. |
| `404` | Department not found |

---

### 11.3 Leave Types (`/api/leave-types`)

All leave type routes require authentication.

---

#### `GET /api/leave-types`

Get all leave types. By default, returns only **active** leave types.

- **Auth Required:** Yes
- **Roles:** Any authenticated user

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `isActive` | Boolean (string) | `"true"` or `"false"`. Omit to get only active (default) |

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0e1",
      "name": "Casual Leave",
      "maxDaysPerYear": 12,
      "carryForwardAllowed": false,
      "description": "For personal reasons",
      "isActive": true
    }
  ],
  "message": "Leave types fetched successfully",
  "success": true
}
```

---

#### `POST /api/leave-types`

Create a new leave type.

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`

**Request Body:**

```json
{
  "name": "Casual Leave",
  "maxDaysPerYear": 12,
  "carryForwardAllowed": false,
  "description": "For personal reasons"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | Yes | Must be unique |
| `maxDaysPerYear` | Number | Yes | Min: 1 |
| `carryForwardAllowed` | Boolean | No | Default: `false` |
| `description` | String | No | Optional |

**Success Response `201`:** Returns the created leave type object.

---

#### `GET /api/leave-types/:id`

Get a leave type by ID.

- **Auth Required:** Yes
- **Roles:** Any authenticated user

---

#### `PATCH /api/leave-types/:id`

Update a leave type.

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`

**Request Body (all optional, at least one required):**

```json
{
  "name": "Sick Leave",
  "maxDaysPerYear": 10,
  "carryForwardAllowed": true,
  "description": "Medical leave"
}
```

**Success Response `200`:** Returns the updated leave type object.

---

#### `PATCH /api/leave-types/:id/toggle-status`

Toggle the `isActive` status of a leave type (activate/deactivate).

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`

**Request Body:** None

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0e1",
    "name": "Casual Leave",
    "isActive": false
  },
  "message": "Leave type deactivated successfully",
  "success": true
}
```

---

#### `DELETE /api/leave-types/:id`

Delete a leave type permanently.

- **Auth Required:** Yes
- **Roles:** `admin`

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Leave type deleted successfully",
  "success": true
}
```

---

### 11.4 Leave Requests (`/api/leave-requests`)

All leave request routes require authentication.

---

#### `POST /api/leave-requests/apply`

Submit a new leave application.

- **Auth Required:** Yes
- **Roles:** Any authenticated user (employee applies for themselves)

**Request Body:**

```json
{
  "leaveType": "64f1a2b3c4d5e6f7a8b9c0e1",
  "fromDate": "2025-03-10",
  "toDate": "2025-03-12",
  "reason": "Family function"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `leaveType` | String (MongoId) | Yes | Must be active |
| `fromDate` | String (ISO Date) | Yes | e.g., `"2025-03-10"` |
| `toDate` | String (ISO Date) | Yes | Must be ≥ `fromDate` |
| `reason` | String | Yes | Non-empty |

**Business Rules:**
- Leave type must be active.
- Employee must have sufficient leave balance for the current year.
- No overlapping `pending` or `approved` requests allowed.
- `totalDays` is auto-calculated counting **Mon–Sat** (Sundays excluded).

**Success Response `201`:**

```json
{
  "statusCode": 201,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
    "employee": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Software Engineer"
    },
    "leaveType": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0e1",
      "name": "Casual Leave",
      "maxDaysPerYear": 12
    },
    "fromDate": "2025-03-10T00:00:00.000Z",
    "toDate": "2025-03-12T00:00:00.000Z",
    "totalDays": 3,
    "reason": "Family function",
    "status": "pending",
    "appliedAt": "2025-03-01T10:00:00.000Z"
  },
  "message": "Leave application submitted successfully",
  "success": true
}
```

**Error Responses:**

| Status | Message |
|---|---|
| `400` | Invalid date format |
| `400` | toDate must be greater than or equal to fromDate |
| `400` | This leave type is currently inactive |
| `400` | No leave balance allocated for this leave type in the current year |
| `400` | Insufficient leave balance. Available: X, Requested: Y |
| `404` | Leave type not found |
| `409` | You already have a pending or approved leave that overlaps with these dates |

---

#### `GET /api/leave-requests/my`

Get the current user's own leave requests.

- **Auth Required:** Yes
- **Roles:** Any authenticated user

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | String | Filter by `pending` \| `approved` \| `rejected` \| `cancelled` |
| `year` | Number | Filter by year (e.g., `2025`) |
| `page` | Number | Default: `1` |
| `limit` | Number | Default: `10` |

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "requests": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
        "leaveType": { "_id": "64f1a2b3c4d5e6f7a8b9c0e1", "name": "Casual Leave" },
        "fromDate": "2025-03-10T00:00:00.000Z",
        "toDate": "2025-03-12T00:00:00.000Z",
        "totalDays": 3,
        "reason": "Family function",
        "status": "pending",
        "approvedBy": null,
        "appliedAt": "2025-03-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  },
  "message": "Leave requests fetched successfully",
  "success": true
}
```

---

#### `GET /api/leave-requests`

Get all leave requests (admin/HR/manager view).

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`, `manager`

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | String | Filter by status |
| `employee` | String (MongoId) | Filter by employee ID |
| `leaveType` | String (MongoId) | Filter by leave type ID |
| `year` | Number | Filter by year |
| `page` | Number | Default: `1` |
| `limit` | Number | Default: `10` |

**Success Response `200`:** Same pagination structure as above, with full employee details populated.

---

#### `GET /api/leave-requests/:id`

Get a single leave request by ID.

- **Auth Required:** Yes
- **Roles:** Any authenticated user (employees can only view their own)

**Path Parameters:** `id` — Leave Request ID

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
    "employee": { "_id": "...", "name": "John Doe", "email": "john@example.com", "designation": "Software Engineer" },
    "leaveType": { "_id": "...", "name": "Casual Leave", "maxDaysPerYear": 12 },
    "fromDate": "2025-03-10T00:00:00.000Z",
    "toDate": "2025-03-12T00:00:00.000Z",
    "totalDays": 3,
    "reason": "Family function",
    "status": "pending",
    "approvedBy": null,
    "rejectionReason": null,
    "appliedAt": "2025-03-01T10:00:00.000Z",
    "actionedAt": null
  },
  "message": "Leave request fetched successfully",
  "success": true
}
```

**Error Responses:**

| Status | Message |
|---|---|
| `403` | You are not allowed to view this leave request |
| `404` | Leave request not found |

---

#### `PATCH /api/leave-requests/:id/approve`

Approve a pending leave request. Automatically deducts from the employee's leave balance.

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`, `manager`

**Path Parameters:** `id` — Leave Request ID

**Request Body:** None

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
    "status": "approved",
    "approvedBy": { "_id": "...", "name": "Jane Smith", "email": "jane@example.com" },
    "actionedAt": "2025-03-02T08:00:00.000Z"
  },
  "message": "Leave request approved successfully",
  "success": true
}
```

**Error Responses:**

| Status | Message |
|---|---|
| `400` | Cannot approve a request that is already approved/rejected/cancelled |
| `400` | Employee does not have sufficient leave balance to approve this request |
| `404` | Leave request not found |

---

#### `PATCH /api/leave-requests/:id/reject`

Reject a pending leave request.

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`, `manager`

**Path Parameters:** `id` — Leave Request ID

**Request Body:**

```json
{
  "rejectionReason": "Project deadline conflict"
}
```

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
    "status": "rejected",
    "rejectionReason": "Project deadline conflict",
    "approvedBy": { "_id": "...", "name": "Jane Smith", "email": "jane@example.com" },
    "actionedAt": "2025-03-02T08:00:00.000Z"
  },
  "message": "Leave request rejected successfully",
  "success": true
}
```

---

#### `PATCH /api/leave-requests/:id/cancel`

Cancel a leave request (only by the employee who applied).

- **Auth Required:** Yes
- **Roles:** Any authenticated user (owner only)

**Path Parameters:** `id` — Leave Request ID

**Request Body:** None

> **Note:** If the request was already `approved`, the leave balance is automatically **restored**.

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
    "status": "cancelled",
    "actionedAt": "2025-03-02T09:00:00.000Z"
  },
  "message": "Leave request cancelled successfully",
  "success": true
}
```

**Error Responses:**

| Status | Message |
|---|---|
| `400` | Cannot cancel a request that is already rejected/cancelled |
| `403` | You can only cancel your own leave requests |

---

### 11.5 Leave Balances (`/api/leave-balances`)

All leave balance routes require authentication.

---

#### `GET /api/leave-balances/my`

Get the current user's leave balance for a given year.

- **Auth Required:** Yes
- **Roles:** Any authenticated user

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `year` | Number | Year to query (default: current year) |

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0a1",
      "leaveType": {
        "_id": "64f1a2b3c4d5e6f7a8b9c0e1",
        "name": "Casual Leave",
        "maxDaysPerYear": 12,
        "carryForwardAllowed": false
      },
      "year": 2025,
      "totalAllocated": 12,
      "used": 3,
      "remaining": 9
    }
  ],
  "message": "Leave balance for year 2025 fetched successfully",
  "success": true
}
```

---

#### `GET /api/leave-balances`

Get all leave balances (admin/HR/manager view) with pagination.

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`, `manager`

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `year` | Number | Filter by year |
| `leaveType` | String (MongoId) | Filter by leave type |
| `page` | Number | Default: `1` |
| `limit` | Number | Default: `10` |

---

#### `POST /api/leave-balances`

Allocate leave balance for a user (single leave type).

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`

**Request Body:**

```json
{
  "user": "64f1a2b3c4d5e6f7a8b9c0d2",
  "leaveType": "64f1a2b3c4d5e6f7a8b9c0e1",
  "year": 2025,
  "totalAllocated": 12
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `user` | String (MongoId) | Yes | Must be an existing user |
| `leaveType` | String (MongoId) | Yes | Must be active |
| `year` | Number | Yes | e.g., `2025` |
| `totalAllocated` | Number | Yes | Min: 0, Max: `leaveType.maxDaysPerYear` |

**Success Response `201`:** Returns the created balance record.

**Error Responses:**

| Status | Message |
|---|---|
| `400` | totalAllocated cannot exceed maxDaysPerYear (X) |
| `400` | Cannot allocate balance for an inactive leave type |
| `404` | User not found / Leave type not found |
| `409` | Leave balance already allocated for this user, leave type, and year |

---

#### `POST /api/leave-balances/bulk`

Bulk allocate all active leave types (with their `maxDaysPerYear`) to a user for a year.

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`

**Request Body:**

```json
{
  "user": "64f1a2b3c4d5e6f7a8b9c0d2",
  "year": 2025
}
```

**Success Response `201`:**

```json
{
  "statusCode": 201,
  "data": {
    "allocated": 3,
    "skipped": ["Casual Leave"]
  },
  "message": "Bulk allocation complete. 3 record(s) created, 1 skipped (already exist).",
  "success": true
}
```

> Already-existing balance records for the same user/year combination are skipped (not overwritten).

---

#### `GET /api/leave-balances/user/:userId`

Get leave balance for a specific user.

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`, `manager`

**Path Parameters:** `userId` — User ID

**Query Parameters:** `year` — (optional) defaults to current year

**Success Response `200`:** Returns an array of balance records (same shape as `/my`).

---

#### `PATCH /api/leave-balances/:id`

Manually adjust the `totalAllocated` for a balance record. `remaining` is automatically recalculated.

- **Auth Required:** Yes
- **Roles:** `admin`, `hr`

**Path Parameters:** `id` — LeaveBalance ID

**Request Body:**

```json
{
  "totalAllocated": 15
}
```

> `totalAllocated` cannot be set lower than already `used` days.

**Success Response `200`:** Returns the updated balance record.

---

## 12. Role & Permission Matrix

| Endpoint | employee | manager | hr | admin |
|---|:---:|:---:|:---:|:---:|
| Register / Login / Refresh Token | ✅ | ✅ | ✅ | ✅ |
| GET /users/me | ✅ | ✅ | ✅ | ✅ |
| PATCH /users/update | ✅ | ✅ | ✅ | ✅ |
| PATCH /users/change-password | ✅ | ✅ | ✅ | ✅ |
| GET /users (all) | ❌ | ❌ | ✅ | ✅ |
| PATCH /users/:id/status | ❌ | ❌ | ❌ | ✅ |
| GET /departments | ✅ | ✅ | ✅ | ✅ |
| GET /departments/:id | ✅ | ✅ | ✅ | ✅ |
| POST /departments | ❌ | ❌ | ✅ | ✅ |
| PATCH /departments/:id | ❌ | ❌ | ✅ | ✅ |
| DELETE /departments/:id | ❌ | ❌ | ❌ | ✅ |
| GET /leave-types | ✅ | ✅ | ✅ | ✅ |
| GET /leave-types/:id | ✅ | ✅ | ✅ | ✅ |
| POST /leave-types | ❌ | ❌ | ✅ | ✅ |
| PATCH /leave-types/:id | ❌ | ❌ | ✅ | ✅ |
| PATCH /leave-types/:id/toggle-status | ❌ | ❌ | ✅ | ✅ |
| DELETE /leave-types/:id | ❌ | ❌ | ❌ | ✅ |
| POST /leave-requests/apply | ✅ | ✅ | ✅ | ✅ |
| GET /leave-requests/my | ✅ | ✅ | ✅ | ✅ |
| GET /leave-requests/:id | ✅ (own only) | ✅ | ✅ | ✅ |
| GET /leave-requests (all) | ❌ | ✅ | ✅ | ✅ |
| PATCH /leave-requests/:id/approve | ❌ | ✅ | ✅ | ✅ |
| PATCH /leave-requests/:id/reject | ❌ | ✅ | ✅ | ✅ |
| PATCH /leave-requests/:id/cancel | ✅ (own only) | ✅ (own only) | ✅ (own only) | ✅ (own only) |
| GET /leave-balances/my | ✅ | ✅ | ✅ | ✅ |
| GET /leave-balances (all) | ❌ | ✅ | ✅ | ✅ |
| POST /leave-balances | ❌ | ❌ | ✅ | ✅ |
| POST /leave-balances/bulk | ❌ | ❌ | ✅ | ✅ |
| GET /leave-balances/user/:userId | ❌ | ✅ | ✅ | ✅ |
| PATCH /leave-balances/:id | ❌ | ❌ | ✅ | ✅ |

---

## 13. Frontend Developer Guide

### 13.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Call POST /api/users/login                              │
│     → Save accessToken from response body (JSON)           │
│     → Cookies are auto-set if using browser fetch/axios    │
│                                                             │
│  2. Include on every protected request:                     │
│     Header: Authorization: Bearer <accessToken>            │
│     OR rely on cookie (if browser with credentials: true)  │
│                                                             │
│  3. If you get a 401 "Unauthorized":                        │
│     → Call POST /api/users/refresh-token                   │
│       (send refreshToken in body or allow cookie)          │
│     → Save the new accessToken                             │
│     → Retry the original request                           │
│                                                             │
│  4. On logout:                                              │
│     → Call POST /api/users/logout                          │
│     → Clear accessToken from local storage                 │
└─────────────────────────────────────────────────────────────┘
```

### 13.2 Recommended: Axios Setup

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true, // send cookies automatically
});

// Attach token from storage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { data } = await api.post('/users/refresh-token');
      localStorage.setItem('accessToken', data.data.accessToken);
      original.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(original);
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 13.3 Example API Calls

**Login:**

```javascript
const { data } = await api.post('/users/login', {
  email: 'john@example.com',
  password: 'secret123',
});
localStorage.setItem('accessToken', data.data.accessToken);
const user = data.data.user;
```

**Get current user:**

```javascript
const { data } = await api.get('/users/me');
console.log(data.data); // user object
```

**Apply for leave:**

```javascript
const { data } = await api.post('/leave-requests/apply', {
  leaveType: '64f1a2b3c4d5e6f7a8b9c0e1',
  fromDate: '2025-03-10',
  toDate: '2025-03-12',
  reason: 'Personal work',
});
```

**Get my leave balance:**

```javascript
const { data } = await api.get('/leave-balances/my?year=2025');
console.log(data.data); // array of balance objects
```

**Get all users (admin/HR only):**

```javascript
const { data } = await api.get('/users?role=employee&status=active&page=1&limit=10');
const { users, pagination } = data.data;
```

### 13.4 Date Format

All dates must be sent as **ISO 8601 strings** (e.g., `"2025-03-10"` or `"2025-03-10T00:00:00.000Z"`). All dates in responses are returned as ISO 8601 UTC strings.

### 13.5 IDs

All IDs are **MongoDB ObjectId strings** (24-character hex, e.g., `"64f1a2b3c4d5e6f7a8b9c0d1"`).

### 13.6 Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Sending `role` as part of registration without admin rights | `role` defaults to `"employee"`; only include it when needed |
| Not including `Content-Type: application/json` header | Always set this header for POST/PATCH requests with a body |
| Using the same token after logout | Always clear local `accessToken` on logout |
| Sending `fromDate` > `toDate` | Validate date order client-side before sending |
| Calling `GET /leave-types` expecting inactive types | Pass `?isActive=false` explicitly to include inactive types |
| Not handling `errors` array in validation error responses | Always display `errors[0]` or iterate `errors` for form validation |
| Sending `totalAllocated` value exceeding `maxDaysPerYear` | Read `maxDaysPerYear` from the leave type before allocating balance |
| Not sending `rejectionReason` when rejecting a request | `rejectionReason` is mandatory for the reject endpoint |
| Trying to cancel someone else's leave as an employee | Only the requesting employee can cancel their own leave |
| Pagination — expecting all records without query params | Default `limit` is `10`; use `page` and `limit` params to paginate |

### 13.7 HTTP Status Codes Used

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created successfully |
| `400` | Validation error / bad request |
| `401` | Unauthenticated (missing or invalid token) |
| `403` | Forbidden (insufficient role or inactive account) |
| `404` | Resource not found |
| `409` | Conflict (duplicate email, department name, etc.) |
| `500` | Internal server error |
