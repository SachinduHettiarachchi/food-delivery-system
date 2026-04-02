# 🍔 FoodExpress — Food Delivery System
**IT3052 Programming Frameworks | General Sir John Kotelawala Defence University**

---

## 📁 Project Structure

```
food-delivery/
├── backend/                        # Node.js + Express.js API
│   ├── config/
│   │   └── database.js             # Singleton DB connection (Sequelize + MySQL)
│   ├── controllers/                # MVC — Business logic layer
│   │   ├── AuthController.js
│   │   ├── RestaurantController.js
│   │   ├── MenuItemController.js
│   │   ├── OrderController.js
│   │   ├── PaymentController.js    # Polymorphic processPayment()
│   │   └── AdminController.js
│   ├── middleware/
│   │   ├── auth.js                 # JWT authentication + RBAC
│   │   ├── errorHandler.js         # Global error handler
│   │   └── validate.js             # express-validator middleware
│   ├── models/                     # Sequelize ORM models
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   ├── Payment.js
│   │   └── index.js                # All associations defined here
│   ├── repositories/               # Repository Pattern
│   │   ├── UserRepository.js
│   │   ├── RestaurantRepository.js
│   │   ├── MenuItemRepository.js
│   │   ├── OrderRepository.js
│   │   └── PaymentRepository.js
│   ├── routes/                     # Express Router
│   │   ├── auth.js
│   │   ├── restaurants.js
│   │   ├── menu.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   └── admin.js
│   ├── server.js                   # Express app entry point
│   ├── seed.js                     # Demo data seeder
│   ├── .env.example
│   └── package.json
│
└── frontend/                       # React.js
    └── src/
        ├── components/
        │   └── common/
        │       ├── Navbar.js
        │       └── ProtectedRoute.js   # Role-based route guarding
        ├── context/
        │   ├── AuthContext.js          # Global auth state (JWT)
        │   └── CartContext.js          # Shopping cart state
        ├── pages/
        │   ├── auth/
        │   │   ├── LoginPage.js
        │   │   └── RegisterPage.js
        │   ├── customer/
        │   │   ├── RestaurantsPage.js
        │   │   ├── RestaurantDetailPage.js
        │   │   ├── CartPage.js
        │   │   ├── OrdersPage.js       # Order history + tracker
        │   │   └── OrderDetailPage.js  # Full order tracking
        │   ├── restaurant/
        │   │   ├── RestaurantDashboard.js
        │   │   └── MenuManagementPage.js
        │   └── admin/
        │       ├── AdminDashboard.js
        │       ├── AdminUsersPage.js
        │       └── AdminOrdersPage.js
        ├── services/
        │   └── api.js                  # Centralized Axios API client
        ├── App.js                      # All routes defined here
        ├── index.js
        └── index.css                   # Complete UI styles
```

---

## ⚙️ Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Frontend   | React.js 18, React Router v6       |
| Backend    | Node.js, Express.js                |
| Database   | MySQL + Sequelize ORM              |
| Auth       | JWT (jsonwebtoken) + bcryptjs      |
| Validation | express-validator                  |
| HTTP       | Axios                              |
| Toasts     | react-toastify                     |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- npm

---

### Step 1 — MySQL Database
```sql
CREATE DATABASE food_delivery_db;
```

---

### Step 2 — Backend Setup
```bash
cd backend
npm install

# Copy and edit environment variables
cp .env.example .env
# Edit .env — set DB_USER, DB_PASSWORD, JWT_SECRET

# Seed demo data (creates tables + sample restaurants, users, menu items)
node seed.js

# Start development server
npm run dev
```
Backend runs on: **http://localhost:5000**

---

### Step 3 — Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend runs on: **http://localhost:3000**

---

## 🔑 Demo Credentials

| Role             | Email                  | Password     |
|------------------|------------------------|--------------|
| Customer         | customer@demo.com      | password123  |
| Restaurant Admin | restaurant@demo.com    | password123  |
| System Admin     | admin@demo.com         | password123  |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint                  | Access     | Description        |
|--------|---------------------------|------------|--------------------|
| POST   | /api/auth/register        | Public     | Register user      |
| POST   | /api/auth/login           | Public     | Login + get token  |
| GET    | /api/auth/me              | Protected  | Get current user   |
| PUT    | /api/auth/me              | Protected  | Update profile     |
| PUT    | /api/auth/change-password | Protected  | Change password    |

### Restaurants
| Method | Endpoint                         | Access            |
|--------|----------------------------------|-------------------|
| GET    | /api/restaurants                 | Public            |
| GET    | /api/restaurants/:id             | Public            |
| GET    | /api/restaurants/:id/menu        | Public            |
| POST   | /api/restaurants                 | Restaurant Admin  |
| PUT    | /api/restaurants/:id             | Restaurant Admin  |
| DELETE | /api/restaurants/:id             | System Admin      |
| POST   | /api/restaurants/:id/menu        | Restaurant Admin  |

### Orders
| Method | Endpoint                         | Access            |
|--------|----------------------------------|-------------------|
| POST   | /api/orders                      | Customer          |
| GET    | /api/orders/my                   | Customer          |
| GET    | /api/orders/:id                  | All roles         |
| GET    | /api/orders/restaurant/:id       | Restaurant Admin  |
| PATCH  | /api/orders/:id/status           | Restaurant Admin  |

### Payments
| Method | Endpoint                         | Access            |
|--------|----------------------------------|-------------------|
| POST   | /api/payments                    | Customer          |
| GET    | /api/payments/order/:orderId     | Protected         |
| GET    | /api/payments                    | System Admin      |

### Admin
| Method | Endpoint                         | Access            |
|--------|----------------------------------|-------------------|
| GET    | /api/admin/dashboard             | System Admin      |
| GET    | /api/admin/users                 | System Admin      |
| DELETE | /api/admin/users/:id             | System Admin      |
| GET    | /api/admin/restaurants           | System Admin      |
| GET    | /api/admin/orders                | System Admin      |

---

## 🧩 OOP & Design Patterns Applied

| Pattern / Principle | Where Applied                                           |
|---------------------|---------------------------------------------------------|
| **Singleton**       | `database.js` — single DB connection instance          |
| **Repository**      | `UserRepository`, `OrderRepository`, etc.              |
| **MVC**             | Models / React Views / Express Controllers             |
| **Encapsulation**   | All models group data + behavior in Sequelize classes  |
| **Inheritance**     | User model has role field (customer/admin extend base) |
| **Polymorphism**    | `processPayment()` behaves differently per method type |
| **Abstraction**     | `placeOrder()`, `trackOrder()`, `processPayment()`     |
| **RBAC**            | JWT + role-based middleware guards all routes          |

---

## 👥 Group Members

| Name              | Reg. No.      |
|-------------------|---------------|
| AMSC Adhikari     | 6935          |
| GID De Zoysa      | D/BIT/24/0003 |
| DPR Pabasara      | D/BIT/24/0007 |
| LCM De Silva      | D/BIT/24/0010 |
| SO Galappaththi   | D/BIT/24/0023 |
| AKR Silva         | D/BIT/24/0024 |
| SH Hettiarachchi  | D/BIT/24/0057 |
| AMPK Adikari      | D/BIT/24/0059 |
| KPK Hettiarachchi | D/BIT/24/0082 |
