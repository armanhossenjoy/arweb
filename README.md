# Arman Hossen Portfolio

Static portfolio site with a Supabase-backed admin dashboard for projects and contact-form messages.

## Supabase setup

1. Create a Supabase project.
2. In the Supabase SQL Editor, run the complete contents of `supabase-setup.sql`. This creates the project, contact-message, and admin-allowlist tables; row-level security rules; and the four existing portfolio projects.
3. In **Authentication > Users**, create the admin account with your email and a strong password. Disable public sign-ups in the Auth provider settings.
4. In the SQL Editor, add that account to the admin allowlist. Replace the email below with the email used to create the account:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
   on conflict (user_id) do nothing;
   ```

   Confirm that the query inserts one row. Only users explicitly added to this table can access the dashboard or its private data.
5. In **Project Settings > API**, copy the Project URL and the publishable/anon key into `supabase-config.js`:

   ```js
   window.APP_CONFIG = {
     supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
     supabaseAnonKey: 'YOUR_PUBLISHABLE_OR_ANON_KEY'
   };
   ```

   The publishable/anon key is intended for browser use. Never put a `service_role` or secret key in this site.
6. Serve the folder with a local web server (for example, VS Code Live Server) or deploy it to a static host. Open `admin.html` to sign in.

## Managing the portfolio

- The **Inbox** tab in the dashboard lists messages submitted through the public contact form. Mark messages read/unread, reply using the sender's email link, or delete messages.
- The **My work** tab lets the admin add, edit, publish/unpublish, feature, reorder, and delete projects. Use a site-relative path such as `img1.png` or a public image URL.
- Published projects appear on the portfolio. Featured projects are marked and appear first; visitors can filter to featured work.
- The public page includes temporary stock-photo placeholders in `index.html` for the hero, portfolio, and studio cards. Replace those image URLs with your own photos when they are ready.
- Existing projects are seeded by `supabase-setup.sql`. Seed records use fixed IDs, so the seed can be rerun without duplicating those records.

Contact-form submissions are stored in the Supabase inbox; they are not automatically forwarded to Gmail or another email provider. This site does not display a personal email inbox.

## Local preview

The public portfolio remains viewable without Supabase configuration and shows its existing sample projects. Contact submissions and the admin dashboard require the Supabase project and allowlisted account described above.
