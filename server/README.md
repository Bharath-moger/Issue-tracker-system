# Issue Tracker System — Backend

Phase 1 backend for the Exelon Circuits Private Limited technical assessment. It uses real MongoDB persistence. No frontend is included.

## Features and stack

Node.js, Express 5, MongoDB/Mongoose, JWT, bcryptjs, express-validator, dotenv, CORS, Helmet and Morgan. Includes registration/login/profile, admin user management, issue CRUD, assignment, status changes, scoped comments, filtered/paginated issue lists and dashboard statistics.

## Prerequisites and installation

Use Node.js 22 LTS or a newer supported LTS, npm, and MongoDB (local or Atlas).

```bash
cd server
npm ci
cp .env.example .env
```

Edit `.env` with a real MongoDB connection string and a random JWT secret of at least 32 characters. Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Do not commit `.env`.

For local MongoDB, start your MongoDB service and use `mongodb://127.0.0.1:27017/issue_tracker`. For Atlas, create a database user, allow the backend's network address, and use the supplied `mongodb+srv://...` URI. URL-encode credentials containing special characters. The database account needs read/write and index creation permissions.

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port, default `5000` |
| `NODE_ENV` | `development`, `test`, or `production` |
| `MONGODB_URI` | Required MongoDB connection string |
| `JWT_SECRET` | Required random secret, at least 32 characters |
| `JWT_EXPIRES_IN` | JWT lifetime, default `1d` |
| `CLIENT_URL` | Allowed browser origin, default `http://localhost:3000` |
| `ADMIN_NAME` | Admin seed name |
| `ADMIN_EMAIL` | Admin seed email |
| `ADMIN_PASSWORD` | Admin seed password, at least 8 characters, at most 72 UTF-8 bytes |

```bash
npm run seed:admin
npm run dev
# Production:
npm start
```

The seed creates an admin only when none exists and never promotes an existing user. Repeating it leaves an existing admin unchanged. Passwords are hashed by the model before saving. Run one seed process at a time. Remove seed credentials from the runtime environment after setup.

Startup connects to MongoDB before opening the HTTP port. SIGINT/SIGTERM close the HTTP server and database connection.

## Folder structure

```text
server/
├── src/
│   ├── config/database.js
│   ├── models/{User,Issue,Comment}.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── issue.controller.js
│   │   ├── comment.controller.js
│   │   └── dashboard.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── issue.routes.js
│   │   ├── comment.routes.js
│   │   └── dashboard.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── error.middleware.js
│   │   └── not-found.middleware.js
│   ├── utils/{generate-token,http,issue-access}.js
│   ├── validators/{auth,issue}.validator.js
│   ├── validators/common.js
│   ├── app.js
│   └── server.js
├── scripts/seed-admin.js
├── test/api.test.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Models

- **User:** trimmed name, unique lowercase email, hidden bcrypt password hash, role (`ADMIN` or `USER`), timestamps. The email index enforces uniqueness. Password hashes are removed from JSON, including login responses.
- **Issue:** title, description, priority (`LOW`, `MEDIUM`, `HIGH`), status (`OPEN`, `IN_PROGRESS`, `CLOSED`), optional `assignedTo`, required `createdBy`, timestamps. User fields are ObjectId references. API assignment validates that the target exists and has role `USER`.
- **Comment:** issue and user ObjectId references, trimmed content, timestamps. Responses populate the commenter's name.

## Authentication and permissions

Send `Authorization: Bearer <token>` on every protected request. Registration and login return `data.token` and `data.user`. Registration accepts only name, email and password, and always creates a USER. Tokens use HS256 and expire according to `JWT_EXPIRES_IN`; each protected request reloads the current account.

Admins see all issues and can edit, delete, assign and update status. Users see issues they created or are assigned, edit only issues they created, and change status only on assigned issues. Both roles can comment on accessible issues. Only admins manage users. Password and role updates are not exposed through user-management endpoints; permitted fields are name and email.

Unknown body fields are rejected. General issue updates accept only title, description and priority. Creation always sets status to OPEN and creator to the authenticated user. Only admins can specify an assignee at creation. Assignment targets must be existing USER accounts; `null` unassigns an issue. Admin accounts are excluded as assignees.

Deleting the current admin is rejected. Deleting any user referenced by an issue or comment returns 409; retain the account, or remove its references through permitted operations first. Issue deletion removes associated comments. Comments have no edit or delete endpoints.

## REST API

All bodies use `Content-Type: application/json`. `:id` must be a 24-character hexadecimal ObjectId.

| Method | Endpoint | Access / request body |
| --- | --- | --- |
| GET | `/api/health` | Public health response |
| POST | `/api/auth/register` | Public: `{ "name": "Sam", "email": "sam@example.com", "password": "your-password" }` |
| POST | `/api/auth/login` | Public: `{ "email": "sam@example.com", "password": "your-password" }` |
| GET | `/api/auth/me` | Authenticated profile |
| GET | `/api/users` | Admin: all users |
| GET | `/api/users/:id` | Admin: user details |
| PATCH | `/api/users/:id` | Admin: name and/or email |
| DELETE | `/api/users/:id` | Admin: unreferenced account only |
| POST | `/api/issues` | Authenticated: title, description, optional priority; optional assignedTo for admins |
| GET | `/api/issues` | Authenticated: scoped list with query options below |
| GET | `/api/issues/:id` | Accessible issue with creator and assignee details |
| PATCH | `/api/issues/:id` | Admin or creator: title, description, priority |
| DELETE | `/api/issues/:id` | Admin: delete issue and comments |
| PATCH | `/api/issues/:id/status` | Admin or assignee: `{ "status": "IN_PROGRESS" }` |
| PATCH | `/api/issues/:id/assign` | Admin: `{ "assignedTo": "user-object-id" }` or `{ "assignedTo": null }` |
| GET | `/api/issues/:id/comments` | Accessible issue: comments with author name and date |
| POST | `/api/issues/:id/comments` | Accessible issue: `{ "content": "Investigating" }` |
| GET | `/api/dashboard/stats` | Authenticated: scoped statistics |

Issue-list query parameters: `page` (default 1), `limit` (default 10, max 100), `search` (literal case-insensitive title search), `status`, `priority`, `assignedTo`. Example: `/api/issues?page=1&limit=10&status=OPEN&priority=HIGH`. The response data contains `issues`, `totalRecords`, `currentPage`, `totalPages`. An empty result has zero total pages. Issue details exclude comments; retrieve comments through the dedicated endpoint.

Dashboard data contains `totalIssues`, `openIssues`, `inProgressIssues`, `closedIssues`, `myAssignedIssues`. Admin counts span all issues; USER counts span created or assigned issues, counted once even if both apply.

Name: 1–100 characters; password: at least 8 characters and at most 72 UTF-8 bytes; title: 1–200; description: 1–10,000; comment: 1–5,000. Text fields are trimmed. Enum values are uppercase.

Success responses use `{ "success": true, "message": "...", "data": {} }`; health and deletions omit `data`. Creation returns 201; other successful requests return 200. Errors use `{ "success": false, "message": "..." }` with 400 for validation, 401 for authentication, 403 for permissions, 404 for missing resources/routes, 409 for conflicts, and 500 for unexpected errors. Oversized JSON requests return 413. Responses never include stack traces or internal database errors.

## Manual API checks

```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sam","email":"sam@example.com","password":"ExamplePass123!"}'
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"sam@example.com","password":"ExamplePass123!"}'
```

Copy `data.token` into a shell variable `TOKEN`, then:

```bash
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:5000/api/issues \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Power failure","description":"Investigate supply","priority":"HIGH"}'
curl 'http://localhost:5000/api/issues?page=1&limit=10&status=OPEN' \
  -H "Authorization: Bearer $TOKEN"
curl http://localhost:5000/api/dashboard/stats -H "Authorization: Bearer $TOKEN"
```

Log in with the seeded admin credentials to exercise user management, assignment and deletion.

## Automated verification

Use a separate MongoDB database **named exactly `issue_tracker_test`**. Tests drop this database before and after running. Never point this at application data. MongoDB must already be running.

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/issue_tracker_test npm test
```

The Node test suite uses actual HTTP requests and MongoDB operations. It covers database connectivity, health, registration, hashed storage, duplicate emails, login failures, bearer tokens, repeatable admin seed, role restrictions, user CRUD, reference protection, issue CRUD, filters/pagination/literal search, assignment, status changes, comments, dashboard calculations and access denial.

## Deployment preparation and limitations

For Render: set root directory to `server`, build command `npm ci`, start command `npm start`, health path `/api/health`, and provide production environment variables. Configure Atlas network access and set `CLIENT_URL` to the future frontend origin. Seed the admin once against the deployment database. No deployment is performed in this phase. Health reports HTTP availability; it is not an ongoing database readiness probe.

This is a small assessment backend. Lists of users and comments are not paginated. There is no refresh-token/logout revocation endpoint; tokens expire naturally, while deleted accounts lose access immediately. There are no password-reset or role-change endpoints. Deletion/reference checks and comment cleanup are sequential MongoDB operations, not multi-document transactions: simultaneous deletion and creation/assignment requests are not fully atomic. Deployments requiring those concurrency guarantees should use replica-set transactions. There is no frontend, deployment automation, real-time communication, notification system or file upload support.
