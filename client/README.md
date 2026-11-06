# Issue Tracker System — Frontend

Phase 2 frontend for the Issue Tracker System assessment. A responsive internal workspace for administrators and team members, connected to the existing Express/MongoDB backend. No deployment is included.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, Axios and Lucide React. Server components provide the root/auth layouts and dynamic route parameters; interactive pages and forms use client components. Styling uses Tailwind utilities and shared component classes. System fonts keep builds independent of external font services.

## Prerequisites and setup

- Node.js 22 LTS or newer supported LTS and npm.
- The existing `server/` dependencies installed and backend configured with MongoDB, JWT settings and a seeded admin.
- A running backend, normally at `http://localhost:5000`.

```bash
cd client
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. In another terminal, start the backend following `../server/README.md`:

```bash
cd server
npm run seed:admin   # First-time setup only
npm run dev
```

Set the backend `CLIENT_URL=http://localhost:3000`. The frontend calls the backend directly from the browser; CORS must allow the exact frontend origin. The backend must be reachable from the browser, and both services must use compatible HTTP/HTTPS schemes.

| Variable              | Default                     | Purpose                                |
| --------------------- | --------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend API base URL, including `/api` |

This is a public URL, not a secret. Never place passwords or JWT signing secrets in frontend environment variables. Restart development after changing it. Next.js embeds `NEXT_PUBLIC_` values at build time, so rebuild when changing the production API URL.

## Commands

```bash
npm run dev        # Development at localhost:3000
npm run typecheck  # TypeScript checks
npm run build      # Production build
npm start          # Serve the completed production build
npm run test:e2e   # Browser tests; see configuration below
```

Development and builds explicitly use Next.js's supported Webpack mode. This avoids Turbopack worker socket failures encountered in the development environment. Project conventions follow the [Next.js installation documentation](https://nextjs.org/docs/app/getting-started/installation) and [Tailwind CSS Next.js setup](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

## Pages and behavior

| Route          | Function                                                                      |
| -------------- | ----------------------------------------------------------------------------- |
| `/`            | Restore session and open the dashboard or login                               |
| `/login`       | Shared admin/user login, validation, errors and session-expiry messages       |
| `/register`    | USER registration, password confirmation, then redirect to login              |
| `/dashboard`   | Four live statistic cards, assigned count and five recent accessible issues   |
| `/issues`      | Search by title, status/priority filters, 10-row pagination and details links |
| `/issues/new`  | Create an issue, with optional assignment for admins                          |
| `/issues/[id]` | Details, authorized editing/status/assignment/deletion and discussion         |
| `/users`       | Admin-only user list, details, name/email editing and permitted deletion      |
| `/profile`     | Current user's profile                                                        |

Admins and users land on the same `/dashboard` route with different descriptions, navigation, permitted controls and backend-scoped data. Admins can access all issues; regular users see created or assigned issues. Users can edit only their own issues and change status only on assigned issues. Admins can assign only to USER accounts. User-management forms never expose role or password changes. Destructive actions require a confirmation dialog. The current admin's delete action is disabled; backend reference conflicts are shown in the dialog.

The desktop sidebar becomes a mobile navigation drawer. Tables scroll within their panel on narrow screens. Forms, dialogs and statistics adapt to mobile layouts. Inputs have labels, notifications use live regions, and native dialogs provide keyboard focus handling and Escape dismissal.

## Authentication

The centralized Axios instance reads the JWT from local storage under `issue-tracker-token` and attaches `Authorization: Bearer <token>`. The initial session is verified through `/auth/me` before protected content is displayed. Logout removes the token. Invalid/expired tokens clear the session and redirect to login; credential failures stay on the login form. Session changes in another browser tab trigger revalidation. If the backend cannot be reached while restoring a session, a retry/return-to-login screen is shown.

Local storage is used to match the assessment's Bearer-token backend. It persists until logout or rejection by the backend and is accessible to scripts on the same origin. There is no refresh-token or server-side logout endpoint. Frontend guards control presentation; the backend continues to enforce every permission. Protected UI is rendered after client-side session verification, rather than through a server cookie session.

## API integration

All service requests use `src/services/api.ts`. Services unwrap the backend's `success/message/data` envelope and preserve server error messages. The frontend uses MongoDB `_id` identifiers and populated creator/assignee objects, not invented identifiers or sample records.

| Service        | Integrated endpoints                                                                        |
| -------------- | ------------------------------------------------------------------------------------------- |
| Authentication | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`                                   |
| Dashboard      | `GET /dashboard/stats`                                                                      |
| Issues         | `GET /issues`, `POST /issues`, `GET /issues/:id`, `PATCH /issues/:id`, `DELETE /issues/:id` |
| Workflow       | `PATCH /issues/:id/status`, `PATCH /issues/:id/assign`                                      |
| Comments       | `GET /issues/:id/comments`, `POST /issues/:id/comments`                                     |
| Users          | `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`                     |

All paths above are relative to `NEXT_PUBLIC_API_URL`. Search is debounced by 300 ms. Empty query filters are omitted. Comments are displayed in backend chronological order; there are no comment-edit endpoints. Every data view provides loading, error/retry and empty states where applicable. Mutations display errors and success notifications.

## Folder structure

```text
client/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/{login,register}/page.tsx
│   │   ├── (auth)/layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── issues/page.tsx
│   │   │   ├── issues/new/page.tsx
│   │   │   ├── issues/[id]/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx, page.tsx, globals.css, error.tsx, not-found.tsx
│   ├── components/
│   │   ├── auth/AuthForm.tsx
│   │   ├── layout/{Sidebar,Header,DashboardLayout}.tsx
│   │   ├── dashboard/{StatsCard,RecentIssues}.tsx
│   │   ├── issues/
│   │   │   ├── IssueTable.tsx, IssueForm.tsx, IssueFilters.tsx
│   │   │   ├── IssueDetails.tsx, IssueStatusBadge.tsx, PriorityBadge.tsx
│   │   │   └── AssigneeSelect.tsx, CommentSection.tsx
│   │   ├── users/{UsersManager,UserDialog}.tsx
│   │   └── ui/
│   │       ├── Button.tsx, Input.tsx, Select.tsx, Modal.tsx
│   │       └── Loading.tsx, EmptyState.tsx, ErrorState.tsx, PageHeading.tsx
│   ├── context/{AuthContext,NoticeContext}.tsx
│   ├── services/
│   │   ├── api.ts, auth.service.ts, issue.service.ts
│   │   └── user.service.ts, comment.service.ts, dashboard.service.ts
│   ├── hooks/{useAuth,useIssues,useResource}.ts
│   ├── types/{user,issue,comment}.ts
│   └── lib/utils.ts
├── tests/{setup.ts,workflows.spec.ts}
├── playwright.config.ts
├── next.config.ts, next-env.d.ts, postcss.config.mjs, tsconfig.json
├── .env.example, .gitignore
├── package.json, package-lock.json
└── README.md
```

## Browser verification

The Playwright suite uses the real backend and MongoDB, with no mock API. It starts separate test servers on frontend port **3011** and backend port **5011**; keep those ports free. The backend dependencies must already be installed.

Provide a MongoDB database named exactly **`issue_tracker_frontend_test`**. Test setup deletes all users, issues and comments in that database, then seeds test-only accounts. Never point tests at application data. Fixtures remain in this isolated database after the run for inspection and are reset on the next run.

```bash
# First-time browser installation:
npx playwright install chromium

TEST_MONGODB_URI=mongodb://127.0.0.1:27017/issue_tracker_frontend_test npm run test:e2e
```

To use an existing Chrome installation instead of Playwright's downloaded browser:

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/issue_tracker_frontend_test \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome npm run test:e2e
```

Coverage includes registration and password matching, credential errors, shared login, token persistence, invalid/expired tokens, logout, protected routes, both role dashboards, issue creation/editing/deletion, assignment/unassignment, assignee status changes, comments, user details/editing/deletion conflicts, search, status/priority filters, pagination and mobile/tablet/desktop overflow/navigation checks. Screenshots and failure traces go into ignored `test-results/`.

## Boundaries and limitations

- Backend files are unchanged; its authorization, deletion/reference restrictions and concurrency limits still apply.
- There is no deployment, frontend server session, password reset, role editor, file upload or real-time update stream.
- User and comment lists follow the backend's unpaginated endpoints.
- Existing data refreshes on page navigation/reload or after local changes; changes from other users are not pushed live.
- The frontend requires a reachable, correctly configured backend and database. No database credentials belong in `client/`.
