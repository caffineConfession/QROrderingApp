
.env 
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

    *   **`DATABASE_URL`**: Your PostgreSQL connection string.
        *   **If using Supabase (Recommended):**
            1.  Go to your Supabase project dashboard.
            2.  Navigate to **Project Settings** (gear icon) > **Database**.
            3.  Under **Connection pooling**, copy the **connection string**. It typically uses port `6543`.
            4.  **Replace `[YOUR-PASSWORD]`** with your actual Supabase database password.
            5.  Append `?pgbouncer=true` for Prisma:
                `postgresql://postgres.YOUR_PROJECT_REF:YOUR_DATABASE_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:6543/postgres?pgbouncer=true`
        *   For local PostgreSQL or other providers, use the appropriate direct connection string.

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

    Your `.env` file might look like:
    ```env
    DATABASE_URL="your_postgresql_pooler_connection_string_with_pgbouncer_true"
    JWT_SECRET_KEY="your_generated_jwt_secret_key"
    GOOGLE_API_KEY="yourGoogleAiApiKeyHere"

    NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_yourkeyid"
    RAZORPAY_KEY_SECRET="yourkeysecret"
    RAZORPAY_WEBHOOK_SECRET="yourWebhookSecretString"
    
    REDIS_URL="redis://localhost:6379"
    ```

### 4. Set Up the Database Schema

With `DATABASE_URL` configured, create the database tables using Prisma:

```bash
npx prisma db push
```
This also runs `npx prisma generate` to update your Prisma Client.

### 5. Seed the Database (Optional but Recommended)

Populate your database with initial admin users and products:

```bash
npx prisma db seed
```
Review `prisma/seed.ts` to see what data is added. You can customize it as needed.

### 6. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```
The application should now be running at `http://localhost:9002`.

### Admin Access

Default admin credentials (from `prisma/seed.ts`):
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
