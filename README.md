# Skincare Ingredient Explorer - Backend API

This is the backend Node.js & Express API for the Skincare Ingredient Explorer application. It connects to a MySQL database populated with scraped Paula's Choice ingredient data and serves the frontend.

## Features

- **Express & MySQL Integration**: Uses high-performance `mysql2/promise` with connection pooling.
- **Fast Search API**: Search ingredients with details in an optimized manner (maximum of 4 queries per search request to prevent N+1 query overhead).
- **Frontend Serving**: Statically hosts the search interface at the root (`/`) path.
- **CORS Enabled**: Cross-origin requests are allowed out-of-the-box.
- **Environment Configuration**: Robust environment variable setup using `.env`.

---

## Getting Started

### 1. Prerequisites
- **Node.js** (v14+)
- **npm** (comes with Node)
- **MySQL Database Server**

### 2. Database Setup
Ensure that your MySQL server is running and the database and tables are populated. You can import the SQL dump from the root directory:
```bash
mysql -u your_user -p your_db_name < ../ingredient_list.sql
```

### 3. Setup Configuration
Copy the sample environment file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your connection details:
```env
PORT=3000
DB_HOST=your-mysql-host.net
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database_name
```

### 4. Install Dependencies
Run the following command in this directory:
```bash
npm install
```

### 5. Run the Server
Start the development/production server:
```bash
npm start
```
The server will test the database connection on startup and print the status.

---

## API Documentation

### Search Ingredients
Searches the database for ingredients whose names contain the query term.

- **URL**: `/global/ingredients/search`
- **Method**: `GET`
- **Query Parameter**: `q` (string, required) - Search term.
- **Response Format**: `JSON`

#### Example Request
```http
GET http://localhost:3000/global/ingredients/search?q=Retinol
```

#### Example Response
```json
[
  {
    "id": 182,
    "name": "Retinol",
    "rating": "BEST",
    "description": "Retinol is a powerhouse skincare ingredient...",
    "detailsUrl": "https://www.paulaschoice.com/...",
    "has_details": 1,
    "details": [
      {
        "main_title": "Retinol",
        "Rating": "Best",
        "Benefits": "Anti-Aging, Wrinkle-Smoothing",
        "Categories": "Antioxidant, Skin-Restoring",
        "description_title": "Retinol Description",
        "Glance": [
          {
            "title": "Retinol at a Glance",
            "details": [
              "Pure form of vitamin A",
              "Helps visibly reduce signs of aging",
              "Supports cellular turnover"
            ]
          }
        ],
        "desp_details": [
          "Retinol is one of the most thoroughly researched skincare ingredients...",
          "Topical use can improve skin firming and restore radiance..."
        ]
      }
    ]
  }
]
```

---

## Project Structure

```
ingredient-backend/
├── db.js          # Database connection pool settings
├── server.js       # Main server file, hosting frontend & API endpoints
├── package.json   # npm scripts & project dependencies
├── .env           # Environment variables (git ignored)
└── .env.example   # Sample env template
```
