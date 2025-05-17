
# Caffico Express - Firebase Studio

This is a Next.js starter project for Caffico Express, built with Firebase Studio.

## Getting Started

Follow these steps to get your local development environment set up and running.

### 1. Clone the Repository (if you haven't already)

```bash
# If you're working from a Git repository
git clone <your-repository-url>
cd <repository-name>
```

### 2. Install Dependencies

Install the project dependencies using npm (or your preferred package manager like yarn or pnpm):

```bash
npm install
```

### 3. Set Up Environment Variables

Environment variables are crucial for connecting to your database and securing sessions.

*   Create a `.env` file in the root of your project. You can do this by copying the example file:
    ```bash
    cp .env.example .env
    ```
*   Open the `.env` file and fill in the required values:

    *   **`DATABASE_URL`**: This is your PostgreSQL connection string.
        *   If you're using Supabase:
            1.  Go to your Supabase project dashboard > Project Settings (gear icon) > Database.
            2.  Find the **Connection string URI** (it looks like `postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres`).
            3.  **Replace `[YOUR-PASSWORD]`** with your actual Supabase database password.
            4.  Set `DATABASE_URL` in your `.env` file:
                ```env
                DATABASE_URL="postgresql://postgres:YOUR_SUPER_STRONG_PASSWORD@your_supabase_host:5432/postgres"
                ```
        *   If you are using a local PostgreSQL instance or another provider, use the appropriate connection string.

    *   **`JWT_SECRET_KEY`**: This is a secret key used to sign and verify JSON Web Tokens for admin sessions.
        1.  Generate a strong, random key by running the following command in your terminal:
            ```bash
            openssl rand -base64 32
            ```
        2.  Copy the output and set `JWT_SECRET_KEY` in your `.env` file:
            ```env
            JWT_SECRET_KEY="yourGeneratedRandomStringHere"
            ```

    Your `.env` file should look something like this:
    ```env
    DATABASE_URL="your_postgresql_connection_string"
    JWT_SECRET_KEY="your_generated_jwt_secret_key"
    ```

### 4. Set Up the Database Schema

Once your `DATABASE_URL` is configured in the `.env` file, you need to create the database tables using Prisma.

Run the following command:

```bash
npx prisma db push
```

This will inspect your `prisma/schema.prisma` file and apply the schema to your database. It will also automatically run `npx prisma generate` to update your Prisma Client.

### 5. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application should now be running, typically at `http://localhost:9002` (as per your `package.json` script).

### Admin Access

The application includes an admin section. You can log in with the following hardcoded credentials (defined in `src/app/admin/login/actions.ts`):

*   **Manual Order Taker:**
    *   Email: `manualorder@caffico.com`
    *   Password: `manualPass123`
*   **Order Processor:**
    *   Email: `processor@caffico.com`
    *   Password: `processorPass123`
*   **Business Manager:**
    *   Email: `manager@caffico.com`
    *   Password: `managerPass123`

Access the admin login page at `/admin/login`.

**Note on Security:** The hardcoded admin passwords are for demonstration purposes only. In a production environment, you must implement a secure authentication system with hashed passwords.

## Key Technologies

*   Next.js (App Router)
*   React
*   TypeScript
*   Tailwind CSS
*   ShadCN UI
*   Prisma (for database access)
*   Genkit (for AI features)

To get started with app specific changes, take a look at `src/app/page.tsx`.
```