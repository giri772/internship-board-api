Internship Board REST API

A RESTful API built using Node.js, Express.js, and SQLite to manage internship records. It supports creating, retrieving, updating, deleting, searching, and paginating internship listings.

Features

- Complete CRUD operations
- SQLite persistent database
- Automatic database and table creation
- Sample internship seed data
- Request validation and consistent JSON error responses
- Search and pagination support
- RESTful API endpoints
- Easy testing using Postman

Technologies Used

- Node.js
- Express.js
- SQLite
- JavaScript
- Postman

Installation

1. Install dependencies

npm install

2. Start the server

npm run dev

The API will run at:

"http://localhost:3000"

API Endpoints

Method| Endpoint| Description
GET| "/api/health"| Check API status
GET| "/api/internships"| Get all internships
GET| "/api/internships/:id"| Get an internship by ID
POST| "/api/internships"| Create an internship
PUT| "/api/internships/:id"| Update an internship
DELETE| "/api/internships/:id"| Delete an internship

Testing with Postman

Use "http://localhost:3000" as the base URL. For POST and PUT requests, select Body → raw → JSON and enter the internship details.

Database

SQLite stores internship records persistently. The application automatically creates the database and table and inserts sample records when the database is empty.

Author

GitHub: https://github.com/giri772

Purpose

This project was developed as an internship assignment to demonstrate REST API development, database integration, and CRUD operations.