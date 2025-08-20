# Personalized AI Newsletter Generator

A full-stack application that allows users to subscribe to a personalized newsletter. The service fetches the latest news articles based on user-selected categories, uses an AI model to generate a concise summary, and delivers it to their inbox at a chosen frequency.

## Live Demo

[**https://ai-newsletter-generator-1vys.vercel.app/**](https://ai-newsletter-generator-1vys.vercel.app/)

## ✨ Features

* **User Authentication**: Secure sign-up and login functionality using Supabase Auth.
* **Preference Customization**: Users can select multiple news categories (e.g., Technology, Sports, Business) and set their desired delivery frequency (Daily, Weekly, Bi-weekly).
* **Automated AI Summaries**: Uses the `gpt-oss-20b:free` model (via OpenRouter) to read fetched articles and generate a unique, coherent newsletter summary.
* **Scheduled Delivery**: Leverages **Inngest** for robust, cron-like job scheduling to ensure newsletters are processed and sent at the correct time.
* **Subscription Management**: Users have a personal dashboard to view their current preferences, pause, or resume their newsletter service at any time.
* **Email Delivery**: Integrated with EmailJS to send the final generated newsletter directly to the user's inbox.

## 🛠️ Tech Stack

* **Framework**: [Next.js](https://nextjs.org/) (React)
* **Backend**: Next.js API Routes (Serverless Functions)
* **Database & Auth**: [Supabase](https://supabase.io/)
* **Job Orchestration & Scheduling**: [Inngest](https://www.inngest.com/)
* **AI / LLM Provider**: `gpt-oss-20b:free` via [OpenRouter](https://openrouter.ai/)
* **News Data**: [NewsAPI](https://newsapi.org/)
* **Email Service**: [EmailJS](https://www.emailjs.com/)
* **Deployment**: [Vercel](https://vercel.com/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## 🔌 API Endpoints

All API endpoints are located in `app/api/`.

#### `/api/user-preferences`

* **`GET`**: Fetches the preferences for the currently authenticated user.
    * **Response**: `200 OK` with the user's preference object or `404 Not Found`.
* **`POST`**: Creates or updates a user's newsletter preferences. This endpoint is idempotent (`upsert`).
    * **Method**: `POST`
    * **Body**:
        ```json
        {
          "categories": ["technology", "sports"],
          "frequency": "weekly",
          "email": "user@example.com"
        }
        ```
    * **Response**: `200 OK` on success.
* **`PATCH`**: Updates a specific field for a user's preferences, primarily used for pausing/resuming the service.
    * **Method**: `PATCH`
    * **Body**:
        ```json
        {
          "is_active": false
        }
        ```
    * **Response**: `200 OK` on success.

#### `/api/inngest`

* **`POST`**: The dedicated webhook endpoint for Inngest. It receives events from Inngest Cloud and triggers the appropriate serverless functions (`scheduled-newsletter`). This endpoint is not meant to be called directly.

## 🗂️ Database Schema

The project uses a single table to store user preferences, linked to Supabase's built-in `auth.users` table.

#### `public.user_preferences`

```sql
create table public.user_preferences (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  categories text[] not null,
  frequency text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_preferences_pkey primary key (id),
  constraint user_preferences_user_id_key unique (user_id),
  constraint user_preferences_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_preferences_frequency_check check (
    (
      frequency = any (
        array['daily'::text, 'weekly'::text, 'biweekly'::text]
      )
    )
  )
) TABLESPACE pg_default;
