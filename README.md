npm
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

Environment variables are crucial for connecting to your database, securing sessions, and other services.

*   Create a `.env` file in the root of your project. You can do this by copying the example file (if one exists) or creating it manually.
*   Open the `.env` file and fill in the required values:

    *   **`DATABASE_URL`**: Your PostgreSQL connection string (e.g., from Neon).
        *   Example for Neon: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`
    *   **`DATABASE_URL_SECONDARY`** (Optional): If you want to seed a second database, provide its connection string here. The seed script will attempt to populate it. If blank, it will be ignored.
    *   **`JWT_SECRET_KEY`**: A secret key for signing admin session JSON Web Tokens.
        1.  Generate a strong key: `openssl rand -base64 32`
        2.  Set `JWT_SECRET_KEY="yourGeneratedRandomStringHere"`
    *   **`GOOGLE_API_KEY`**: Your API key for Google AI services used by Genkit.
        1.  Obtain this from your Google Cloud Console for the "Generative Language API".
        2.  Set `GOOGLE_API_KEY="yourGoogleAiApiKeyHere"`
    *   **Razorpay Configuration:**
        *   `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your Razorpay Key ID (Test or Live).
        *   `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret (Test or Live).
        *   `RAZORPAY_WEBHOOK_SECRET`: A secret string you define. This **must match** the secret you configure in the Razorpay Dashboard when setting up webhooks.
    *   **`REDIS_URL` (For WebSocket Scaling with Pub/Sub):**
        *   The connection string for your Redis instance.
        *   Format: `redis://<user>:<password>@<host>:<port>` or `redis://localhost:6379` for a local instance without auth.
        *   Example: `REDIS_URL="redis://default:yourRedisPassword@your-redis-host.com:6379"`
    *   **`PRISMA_OPENSSL_VERSION`**: Set to `openssl-1.1.x` or as appropriate for your environment to help Prisma CLI.

    Your `.env` file might look like:
    ```env
    DATABASE_URL="your_neon_postgresql_connection_string_for_primary_db"
    DATABASE_URL_SECONDARY="your_neon_postgresql_connection_string_for_secondary_db_or_leave_blank"
    JWT_SECRET_KEY="your_generated_jwt_secret_key"
    GOOGLE_API_KEY="yourGoogleAiApiKeyHere"

    NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_yourkeyid"
    RAZORPAY_KEY_SECRET="yourkeysecret"
    RAZORPAY_WEBHOOK_SECRET="yourWebhookSecretString"
    
    REDIS_URL="redis://localhost:6379"
    PRISMA_OPENSSL_VERSION="openssl-1.1.x"
    ```

### 4. Set Up the Database Schema

With `DATABASE_URL` configured, create the database tables using Prisma:

```bash
npx prisma db push
```
This also runs `npx prisma generate` to update your Prisma Client.
If you are using a secondary database (`DATABASE_URL_SECONDARY`), you'll need to temporarily set `DATABASE_URL` to the secondary URL and run `npx prisma db push` again, then revert `DATABASE_URL` to your primary.

### 5. Seed the Database using SQL

The primary method for seeding the database is now by running an SQL script directly against your database(s).

*   **Generate Admin Password Hashes:**
    Before running the SQL script, you need bcrypt-hashed passwords for your admin users.
    1.  Modify the `adminUsers` array in `hashPassword.js` if you want different emails, roles, or passwords.
    2.  Run the script: `node hashPassword.js`
    3.  Copy the generated hashed passwords. You will need to insert these into the SQL script provided by the AI assistant.

*   **Run the SQL Script:**
    The AI assistant will provide you with SQL `INSERT` statements. Copy this SQL.
    Connect to your PostgreSQL database (e.g., using the Supabase SQL Editor, Neon SQL console, DBeaver, pgAdmin, or `psql`) and execute the copied SQL statements.
    If you are seeding a secondary database, repeat this process for the secondary database.

    *Note: The `prisma/seed.ts` file and the `npm run prisma:seed` command are currently not the recommended way to seed due to execution issues. If these are resolved later, that method can be revisited.*

### 6. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```
The application should now be running at `http://localhost:9002`.

### Admin Access

Default admin credentials (plaintext passwords for `hashPassword.js`):
*   Email: `manager@caffico.com`, Password: `managerPass123`
*   Email: `manualorder@caffico.com`, Password: `manualPass123`
*   Email: `processor@caffico.com`, Password: `processorPass123`
Access the admin login at `/admin/login`.

**Security Note:** The default passwords are for demonstration. Change them immediately in a production setup or manage users securely.

## Key Technologies

*   Next.js (App Router)
*   React, TypeScript
*   Tailwind CSS, ShadCN UI
*   Prisma (PostgreSQL)
*   Genkit (AI features)
*   Razorpay (Payments)
*   `ws` & `ioredis` (WebSockets with Redis Pub/Sub for real-time updates)

To get started with app specific changes, take a look at `src/app/page.tsx`.

