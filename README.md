
# Internship Board REST API

A RESTful API built using Node.js, Express.js, and SQLite to manage internship records. It supports creating, retrieving, updating, deleting, searching, and paginating internship listings.

## Features

- Complete CRUD operations
- SQLite persistent database
- Automatic database and table creation
- Sample internship seed data
- Request validation and consistent JSON errors
- Search by title, company, or location
- Pagination with page and limit parameters
- HTTP status codes for success and failure
- Health-check endpoint

## Technology Stack

- Node.js
- Express.js
- SQLite
- better-sqlite3
- Nodemon for development

## Prerequisites

Install Node.js (LTS) and npm before starting.

## Installation

Clone this repository:

```bash
git clone https://github.com/YOUR-USERNAME/internship-board-api.git
cd internship-board-api
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

For normal startup:

```bash
npm start
```

The API runs at http://localhost:3000.

## Database

The application automatically creates the `data` directory and the SQLite database file `internships.db`.

The database schema is defined in `db.js`. Sample records are stored in `seed.json` and inserted when the table is empty.

The local database directory is excluded from Git.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/health | Check server status |
| GET | /api/internships | List internships |
| GET | /api/internships/:id | Get one internship |
| POST | /api/internships | Create internship |
| PUT | /api/internships/:id | Update internship |
| DELETE | /api/internships/:id | Delete internship |

## Query Parameters

- `page`: Page number, defaults to 1.
- `limit`: Records per page, defaults to 10; maximum 100.
- `search`: Searches internship title, company, and location.

Example:

`GET /api/internships?page=1&limit=5&search=developer`

## Internship Data Model

- `id`: Auto-generated integer
- `title`: Internship title
- `company`: Company name
- `location`: Internship location
- `type`: Remote, Hybrid, or On-site
- `stipend`: Non-negative integer
- `description`: Internship description
- `applyUrl`: HTTP or HTTPS application URL
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

## Example Create Request

Send a POST request to `/api/internships` with `Content-Type: application/json`.

```json
{
  "title": "Backend Developer Intern",
  "company": "Example Technologies",
  "location": "Pune, India",
  "type": "Hybrid",
  "stipend": 12000,
  "description": "Learn backend API development.",
  "applyUrl": "https://example.com/apply"
}
```

## Response Format

Successful responses use `"success": true`. Errors use `"success": false` and contain an error code and message. List responses also contain pagination metadata.

## Error Handling

The API handles invalid input, malformed JSON, invalid IDs, missing records, missing routes, and unexpected server errors.

## Limitations

This project is an educational internship management API. Sample internship records and application links are fictional. Authentication, authorization, production deployment, and automated test suites are not included.

## Author

Created as part of the REST API and Persistent Data internship task.
