# 🐄 CattleCare

### 🌱 Smarter livestock record-keeping for small-scale farmers

**CattleCare** is a web-based livestock management application developed
by a four-member team for **CraftSolve Hackathon 2026**.

Managing livestock involves keeping track of animals, milk production,
breeding, health, vaccinations and farm finances. CattleCare brings
these records together in one application, helping farmers organize
important information about their animals and farm activities.

Our goal is simple: make everyday livestock record-keeping more
organized and accessible.

------------------------------------------------------------------------

## 👩‍💻 Our Team

Built with teamwork by:

1.  **Syeda Taqiya Noman**
2.  **Fiza Zahid Ali**
3.  **Mehwish Nawaz**
4.  **Jawerya Shafi**

🎯 **Event:** CraftSolve Hackathon 2026

------------------------------------------------------------------------

## ✨ What CattleCare Offers

### 🐮 Animal Management

-   Register and maintain animal profiles.
-   View individual animal information.
-   Archive animals when they are no longer part of the active livestock
    list.

### 🥛 Milk Production Records

-   Add daily milk production records.
-   Review recorded milk information.
-   Delete an incorrect milk record after confirming the action.

### 🧬 Breeding Records

-   Maintain breeding-related records for animals.
-   Review saved breeding information.
-   Delete an incorrect record after confirmation.

### 🩺 Health & Vaccination

-   Record animal health events and observed symptoms.
-   Maintain vaccination information.
-   View vaccine schedules and due or overdue reminders.
-   Delete supported health records after confirmation.

### 💰 Farm Financial Records

-   Record income and expenses.
-   Review financial activity and profit/loss information.
-   Delete an incorrect financial record after confirmation.

### 📊 Dashboard

-   View an overview of livestock and farm activity.
-   Access key information from the application's main dashboard.

### 🆘 Health Help

-   Select symptoms observed in an animal.
-   View informational guidance and suggested next steps.
-   Prepare a summary of the animal's information and reported symptoms
    for sharing with a veterinarian.

**Important:** Health guidance is informational only. It is not a
veterinary diagnosis and does not replace advice or examination by a
qualified veterinarian.

### 🌐 English & Urdu Interface

-   Switch the application language between English and Urdu.
-   Display Urdu interface content in a right-to-left (RTL) layout.
-   Keep internal API and database values separate from translated
    display labels.

### 🗑️ Safer Record Deletion

-   Supported record types include delete actions.
-   A confirmation step is shown before a record is permanently deleted.
-   Animal profiles use archiving rather than the same permanent-delete
    flow, helping preserve their associated history.

------------------------------------------------------------------------

## 🧰 Technology Stack

### Frontend

-   **React** -- user interface
-   **Vite** -- development server and build tooling
-   **React Router** -- client-side navigation
-   **Tailwind CSS** -- styling
-   **TanStack React Query** -- server-state management
-   **Axios** -- API requests
-   **React Hook Form & Zod** -- form handling and validation
-   **Recharts** -- charts and data visualization
-   **i18next / react-i18next** -- language translations
-   **Lucide React** -- icons

### Backend

-   **Node.js** -- JavaScript runtime
-   **Express** -- API server
-   **MongoDB & Mongoose** -- database and data modelling
-   **JWT** -- authentication tokens
-   **bcryptjs** -- password hashing
-   **Zod** -- request validation
-   **Helmet** -- HTTP security headers
-   **CORS** -- cross-origin request configuration
-   **express-rate-limit** -- request rate limiting

------------------------------------------------------------------------

## 📁 Project Structure

``` text
CattleCare/
├── client/                 # React + Vite frontend
│   ├── src/
│   └── package.json
│
├── server/                 # Node.js + Express backend
│   ├── src/
│   ├── test/
│   └── package.json
│
└── README.md
```

------------------------------------------------------------------------

## ⚙️ Getting Started

### Prerequisites

Make sure you have installed:

-   [Node.js](https://nodejs.org/) (LTS recommended)
-   npm (included with Node.js)
-   A MongoDB database, either local or hosted with MongoDB Atlas

### 1. Clone the repository

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd CattleCare
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with your repository URL.

### 2. Set up the backend

Open a terminal in the `server` directory:

``` bash
cd server
npm ci
```

Create a `.env` file inside the `server` directory:

``` env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
PORT=5000
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
APP_TIME_ZONE=Asia/Karachi
```

Replace the example values with your own configuration. Keep this file
private and **never commit it to GitHub**.

Start the backend:

``` bash
npm run dev
```

The backend uses port `5000` by default and needs a successful MongoDB
connection.

### 3. Set up the frontend

Open a second terminal in the `client` directory:

``` bash
cd client
npm ci
npm run dev
```

Vite normally makes the application available at:

``` text
http://localhost:5173
```

By default, the frontend sends API requests to:

``` text
http://localhost:5000/api/v1
```

If your backend is hosted at a different address, create `client/.env`
and set:

``` env
VITE_API_URL=https://your-backend-domain/api/v1
```

Restart the frontend after changing environment variables.

------------------------------------------------------------------------

## 🧪 Tests & Production Build

Run the backend test suite:

``` bash
cd server
npm test
```

Create a production build of the frontend:

``` bash
cd client
npm run build
```

The generated frontend build is placed in `client/dist/`.

------------------------------------------------------------------------

## 🔌 API Overview

The backend API is mounted under:

``` text
/api/v1
```

The application includes route groups for areas such as:

-   Authentication
-   Users
-   Animals
-   Transactions
-   Reports
-   Dashboard
-   Health
-   Vaccines
-   Symptoms
-   Milk
-   Breeding

Authenticated endpoints require the appropriate authentication token.

------------------------------------------------------------------------

## 🔐 Configuration & Safety Notes

-   Keep `.env` files, database connection strings, JWT secrets and
    tokens private.
-   Do not commit `node_modules/` or generated build folders such as
    `client/dist/`.
-   Configure the production API URL and allowed CORS origins for your
    deployment environment.
-   Use a separate test database when testing changes that create,
    update or delete records.
-   Back up important data before performing database maintenance.

------------------------------------------------------------------------

## 🏁 About the Hackathon

**CattleCare was created for CraftSolve Hackathon 2026.**

-   📅 **Hackathon start:** 20 October 2026
-   ⏳ **Submission deadline:** 4 November 2026
-   🏆 **Announced results date:** 8 November 2026

We built CattleCare around a practical idea: bringing important
livestock records into one accessible digital platform.

------------------------------------------------------------------------

## 💙 Built for CraftSolve Hackathon 2026

**Your livestock. Your records. Better organized.**

*CraftSolve --- We Don't Just Create, We Solve.*
