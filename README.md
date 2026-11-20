# PeopleDesk — Employee Information Management System

A corporate-style employee directory with Supabase authentication and PostgreSQL database.

## Included
- Login only; no public sign-up
- Super Admin and Viewer roles
- Super Admin can create viewer accounts
- Super Admin can add, edit, and delete employee records
- Viewers can search and view employee records only
- Employee profile includes personal, emergency contact, employment, compensation, and government details
- Age and total monthly salary are calculated automatically
- Row Level Security (RLS) protects database operations

## 1. Create the Supabase project
1. Create a project at https://supabase.com.
2. Open **Project Settings → API** (or **Data API**) and copy the Project URL and anon/publishable key.
3. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it.

## 2. Create the first Super Admin
1. In Supabase, open **Authentication → Users → Add user → Create new user**.
2. Enter the Super Admin email and a strong password. Confirm the user if the dashboard offers that option.
3. Copy the new user's UUID.
4. In SQL Editor, run this query after replacing the values:

```sql
insert into public.profiles (id, full_name, role)
values ('PASTE-FIRST-AUTH-USER-UUID-HERE', 'Super Admin Name', 'super_admin');
```

Do not share the Super Admin password. Enable MFA for the account if available.

## 3. Configure the website
Edit `app.js` and replace:
- `YOUR_SUPABASE_PROJECT_URL`
- `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY`

The anon/publishable key is intended for browser use when RLS is correctly configured. **Never put the service-role key in `app.js`, HTML, GitHub, or any public file.**

## 4. Deploy the account-creation function
The Super Admin creates Viewer accounts through a secure Supabase Edge Function. Deploy it from this project folder using the Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-user
```

The function uses Supabase's server-side `SUPABASE_SERVICE_ROLE_KEY` secret supplied by the Edge Function environment. Do not expose that key to the browser. The function checks the caller's authenticated identity and Super Admin role before creating a user.

## 5. Run locally
You can open `index.html` through a local static server. For example, with Python installed:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## 6. Deploy the front end
You can publish the files using Netlify, Vercel static hosting, or GitHub Pages. Add your own domain and HTTPS before entering real employee information.

## Database fields
- `profiles`: auth user profile and role
- `employees`: personal, employment and compensation fields
- `emergency_contacts`: emergency contact
- `government_details`: government identifiers

## Privacy and security checklist before real use
This system handles highly sensitive personal data (including salary, home address, date of birth, SSS, PhilHealth, Pag-IBIG and TIN).
- Do not upload real employee data until access controls and hosting are tested.
- Restrict access to named, authorized users; review access regularly and disable accounts promptly when no longer needed.
- Use MFA for Super Admin, strong passwords, HTTPS, and secure device practices.
- Keep backups and an audit trail for access and changes; this starter version does not yet include a full audit-log screen.
- Consider limiting which viewers can see compensation and government identifiers. Current requested configuration lets authenticated viewers see all employee fields.
- Publish a privacy notice, define retention/deletion rules, and have your organization's privacy officer review compliance with the Philippine Data Privacy Act.
- Do not store or transmit the service-role key in front-end code.

## Notes / current scope
This is a working starter implementation, not a hosted production deployment. It needs your Supabase project URL/key and first Super Admin setup before login can work. Employee photos are currently stored as image URLs; a private Supabase Storage bucket and controlled upload flow can be added next.
