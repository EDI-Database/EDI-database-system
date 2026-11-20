import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const callerClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
  if (authError || !caller) return Response.json({ error: "Not authenticated" }, { status: 401, headers: cors });

  const admin = createClient(url, serviceKey);
  const { data: profile } = await admin.from("profiles").select("role").eq("id", caller.id).single();
  if (profile?.role !== "super_admin") return Response.json({ error: "Only the Super Admin can create accounts." }, { status: 403, headers: cors });

  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const full_name = String(body.full_name || "").trim();
  if (!email || !full_name || password.length < 10) return Response.json({ error: "Provide a name, valid email, and password of at least 10 characters." }, { status: 400, headers: cors });

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
  if (error) return Response.json({ error: error.message }, { status: 400, headers: cors });
  const { error: profileError } = await admin.from("profiles").insert({ id: data.user.id, full_name, role: "viewer" });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return Response.json({ error: "User could not be provisioned: " + profileError.message }, { status: 500, headers: cors });
  }
  return Response.json({ success: true, user_id: data.user.id }, { headers: cors });
});
