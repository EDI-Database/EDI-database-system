
// Configure these two values from your Supabase project settings.
const SUPABASE_URL = "https://ahogiwvyjrekpzlgxljl.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_YdFsi7wGUMt5a4eAovuScA_Dm-bYzGc";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let sessionUser = null, sessionRole = "viewer", employees = [];
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => value == null || value === "" ? "—" : "₱" + Number(value).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
const isAdmin = () => sessionRole === "super_admin";
const show = id => $(id).classList.remove("hidden");
const hide = id => $(id).classList.add("hidden");
function message(id, text, success=false){$(id).textContent=text;$(id).className=success?"success":"error";}
function ageFrom(date){if(!date)return "—";const d=new Date(date+"T00:00:00"),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))a--;return a+" years";}
function photo(url){return url || "https://ui-avatars.com/api/?name=Employee&background=e8eef8&color=315078&size=128";}

async function loadProfile(user){
  const {data,error}=await supabaseClient.from("profiles").select("full_name,role").eq("id",user.id).single();
  if(error) throw error;
  sessionRole=data.role;
  $("currentUser").textContent=data.full_name||user.email;
  $("currentRole").textContent=isAdmin()?"Super Admin":"Viewer";
  $("rolePill").textContent=isAdmin()?"SUPER ADMIN":"VIEWER";
  if(isAdmin()){show("addEmployeeBtn");show("usersNav");}
  else {hide("addEmployeeBtn");hide("usersNav");}
}

async function enterApp(user){
  sessionUser=user;
  try{
    await loadProfile(user);
    hide("loginView");
    show("appView");
    await loadEmployees();
  }
  catch(e){
    $("loginError").textContent="Your account profile is not configured. Ask the Super Admin to check your access.";
    await supabaseClient.auth.signOut();
    console.error(e);
  }
}

async function loadEmployees(){
  const {data,error}=await supabaseClient.from("employees").select("*").order("full_name");
  if(error){$("employeeList").innerHTML=`<div class="empty">${escapeHtml(error.message)}</div>`;return;}
  employees=data||[];
  renderEmployees();
}

function renderEmployees(){
  const q=$("searchInput").value.trim().toLowerCase();
  const list=employees.filter(e=>[e.full_name,e.employee_code,e.job_title].some(v=>(v||"").toLowerCase().includes(q)));
  $("totalCount").textContent=employees.length;
  $("activeCount").textContent=employees.filter(e=>(e.employee_status||"").toLowerCase()==="regular"||(e.employee_status||"").toLowerCase()==="active").length;
  $("inactiveCount").textContent=employees.length-Number($("activeCount").textContent);
  $("resultCount").textContent=`${list.length} result${list.length===1?"":"s"}`;
  $("employeeList").innerHTML=list.length?list.map(e=>`<div class="employee-row" data-id="${e.id}">
    <img class="employee-photo" src="${escapeHtml(photo(e.photo_url))}" onerror="this.src='https://ui-avatars.com/api/?name=Employee&background=e8eef8&color=315078'">
    <div><div class="employee-name">${escapeHtml(e.full_name)}</div><div class="employee-meta">${escapeHtml(e.employee_code)} · ${escapeHtml(e.job_title||"No job title")} · ${escapeHtml(e.email||"")}</div></div>
    <span class="status ${["resigned","separated","inactive"].includes((e.employee_status||"").toLowerCase())?"inactive":""}">${escapeHtml(e.employee_status||"Unspecified")}</span></div>`).join(""):`<div class="empty">${q?"No matching employees found.":"No employee records yet. Super Admin can add the first employee."}</div>`;
  document.querySelectorAll(".employee-row").forEach(row=>row.addEventListener("click",()=>openProfile(row.dataset.id)));
}

function detail(label,value){return `<div class="detail"><span>${label}</span><span>${escapeHtml(value||"—")}</span></div>`;}
function section(title,rows){return `<section class="detail-section"><h3>${title}</h3>${rows.join("")}</section>`;}

async function openProfile(id){
  const e=employees.find(x=>x.id===id);
  if(!e)return;
  const [{data:c},{data:g}] = await Promise.all([
    supabaseClient.from("emergency_contacts").select("*").eq("employee_id",id).maybeSingle(),
    supabaseClient.from("government_details").select("*").eq("employee_id",id).maybeSingle()
  ]);
  const actions=isAdmin()?`<div class="profile-actions"><button class="secondary" id="editEmployee">Edit</button><button class="secondary" id="deleteEmployee">Delete</button></div>`:"";
  $("profileContent").innerHTML=`<div class="profile-hero"><img src="${escapeHtml(photo(e.photo_url))}" onerror="this.src='https://ui-avatars.com/api/?name=Employee'"><div><p class="eyebrow">EMPLOYEE PROFILE</p><h2>${escapeHtml(e.full_name)}</h2><p>${escapeHtml(e.employee_code)} · ${escapeHtml(e.job_title||"")}</p></div>${actions}</div>
  <div class="profile-grid">
    ${section("Personal information",[detail("Employee ID",e.employee_code),detail("Gender",e.gender),detail("Date of birth",e.date_of_birth),detail("Age",ageFrom(e.date_of_birth)),detail("Address",e.address),detail("Email address",e.email)])}
    ${section("Emergency contact",[detail("Contact name",c?.contact_name),detail("Contact number",c?.contact_number),detail("Address",c?.address),detail("Relationship",c?.relationship)])}
    ${section("Employment details",[detail("Job title",e.job_title),detail("Employee status",e.employee_status),detail("Date hired",e.date_hired),detail("Job level / rank",e.job_level)])}
    ${section("Compensation & payroll",[detail("Basic salary",money(e.basic_salary)),detail("De minimis benefits",money(e.de_minimis)),detail("Total monthly salary",money(Number(e.basic_salary||0)+Number(e.de_minimis||0)))])}
    ${section("Government benefits",[detail("SSS number",g?.sss_number),detail("PhilHealth number",g?.philhealth_number),detail("Pag-IBIG number",g?.pagibig_number),detail("TIN number",g?.tin_number)])}
  </div>`;
  show("profileModal");
  if(isAdmin()){
    $("editEmployee").onclick=()=>{hide("profileModal");fillEmployeeForm(e,c,g);};
    $("deleteEmployee").onclick=async()=>{
      if(!confirm(`Delete ${e.full_name}'s record? This cannot be undone.`))return;
      const {error}=await supabaseClient.from("employees").delete().eq("id",id);
      if(error){alert(error.message);return;}
      hide("profileModal");
      await loadEmployees();
    };
  }
}

const fieldMap={employeeCode:"employee_code",fullName:"full_name",gender:"gender",dob:"date_of_birth",address:"address",email:"email",photoUrl:"photo_url",jobTitle:"job_title",employeeStatus:"employee_status",dateHired:"date_hired",jobLevel:"job_level",basicSalary:"basic_salary",deMinimis:"de_minimis"};

function fillEmployeeForm(e={},c={},g={}){
  $("employeeForm").reset();
  $("employeeId").value=e.id||"";
  for(const [id,key] of Object.entries(fieldMap))$(id).value=e[key]??"";
  $("emergencyName").value=c?.contact_name||"";
  $("emergencyPhone").value=c?.contact_number||"";
  $("emergencyAddress").value=c?.address||"";
  $("emergencyRelationship").value=c?.relationship||"";
  $("sssNumber").value=g?.sss_number||"";
  $("philhealthNumber").value=g?.philhealth_number||"";
  $("pagibigNumber").value=g?.pagibig_number||"";
  $("tinNumber").value=g?.tin_number||"";
  $("employeeFormTitle").textContent=e.id?"Edit employee":"Add employee";
  message("employeeError","");
  updateTotal();
  show("employeeModal");
}

function updateTotal(){
  $("totalSalary").value=(Number($("basicSalary").value||0)+Number($("deMinimis").value||0)).toFixed(2);
}

$("basicSalary").addEventListener("input",updateTotal);
$("deMinimis").addEventListener("input",updateTotal);

// LOGIN FUNCTION - UPDATED
$("loginForm").addEventListener("submit", async ev => {
  ev.preventDefault();
  message("loginError", "Signing in...");

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("Login error:", error);
      message("loginError", error.message);
      return;
    }

    console.log("Login successful:", data.user.email);
    await enterApp(data.user);

  } catch (error) {
    console.error("Unexpected login error:", error);
    message("loginError", error.message || "An unexpected error occurred.");
  }
});

$("logoutBtn").onclick=async()=>{await supabaseClient.auth.signOut();location.reload();};
$("searchInput").addEventListener("input",renderEmployees);
$("addEmployeeBtn").onclick=()=>fillEmployeeForm();
$("usersNav").onclick=ev=>{
  ev.preventDefault();
  $("userForm").reset();
  message("userError","");
  message("userSuccess","",true);
  show("usersModal");
};

$("employeeForm").addEventListener("submit",async ev=>{
  ev.preventDefault();
  message("employeeError","");
  const id=$("employeeId").value;
  const payload={};
  for(const [dom,key] of Object.entries(fieldMap)){
    let v=$(dom).value;
    payload[key]=v===""?null:v;
  }
  payload.basic_salary=payload.basic_salary==null?null:Number(payload.basic_salary);
  payload.de_minimis=payload.de_minimis==null?null:Number(payload.de_minimis);
  let result=id
    ?await supabaseClient.from("employees").update(payload).eq("id",id).select().single()
    :await supabaseClient.from("employees").insert(payload).select().single();
  if(result.error){message("employeeError",result.error.message);return;}
  const employeeId=result.data.id;
  const contact={employee_id:employeeId,contact_name:$("emergencyName").value||null,contact_number:$("emergencyPhone").value||null,address:$("emergencyAddress").value||null,relationship:$("emergencyRelationship").value||null};
  const gov={employee_id:employeeId,sss_number:$("sssNumber").value||null,philhealth_number:$("philhealthNumber").value||null,pagibig_number:$("pagibigNumber").value||null,tin_number:$("tinNumber").value||null};
  const c=await supabaseClient.from("emergency_contacts").upsert(contact,{onConflict:"employee_id"});
  const g=await supabaseClient.from("government_details").upsert(gov,{onConflict:"employee_id"});
  if(c.error||g.error){message("employeeError",c.error?.message||g.error?.message);return;}
  hide("employeeModal");
  await loadEmployees();
});

$("userForm").addEventListener("submit",async ev=>{
  ev.preventDefault();
  message("userError","");
  message("userSuccess","",true);
  const {data:{session}}=await supabaseClient.auth.getSession();
  const {data,error}=await supabaseClient.functions.invoke("create-user",{
    body:{
      email:$("newUserEmail").value,
      password:$("newUserPassword").value,
      full_name:$("newUserName").value
    },
    headers:{Authorization:`Bearer ${session.access_token}`}
  });
  if(error||data?.error){
    message("userError",data?.error||error.message);
    return;
  }
  message("userSuccess","Account created. Share the login details with the new user securely.",true);
  $("userForm").reset();
});

document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>hide(b.dataset.close)));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)hide(m.id);}));

// INITIALIZATION - UPDATED
(async () => {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      $("loginError").textContent =
        "Please configure your Supabase Project URL and Publishable/anon key in app.js.";
      return;
    }

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;

    if (data.session) {
      await enterApp(data.session.user);
    }
  } catch (error) {
    console.error("Initialization error:", error);
    $("loginError").textContent =
      "Unable to initialize the application. Check the browser Console for details.";
  }
})();
