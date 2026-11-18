let currentUser = localStorage.getItem("currentUser") || "";
let currentUserId = null;
const SUPABASE_URL = "https://oaapudrrswzmbfiymqdm.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQrr_SsEA1ECE_RjruvwOg_9xfLxpJv";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let users = JSON.parse(localStorage.getItem("users")) || [];
let blogs = JSON.parse(localStorage.getItem("blogs")) || [];

    
async function showPage(page) {

    if (page === "dashboard") {
        const { data, error } = await supabaseClient.auth.getUser();

        if (error || !data.user) {
            currentUser = "";
            currentUserId = null;
            alert("Please login to access the dashboard.");
            page = "login";
        } else {
            currentUser = data.user.email;
            currentUserId = data.user.id;
        }
    }

    document.querySelectorAll(".page").forEach(section => {
        section.classList.add("hidden");
    });

    const selectedPage = document.getElementById(page);

    if (!selectedPage) return;

    selectedPage.classList.remove("hidden");

    if (page === "home") displayBlogs();
    if (page === "dashboard") displayDashboard();
}



async function register() {
    let name = document.getElementById("regName").value;
    let email = document.getElementById("regEmail").value;
    let password = document.getElementById("regPassword").value;

    if (!name || !email || !password) {
        alert("Please fill all fields");
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { name: name }
        }
    });

    if (error) {
        alert(error.message);
        return;
    }

    if (data.session) {
        currentUser = data.user.email;
        currentUserId = data.user.id;

        users.push({ name, email });
        localStorage.setItem("users", JSON.stringify(users));
        localStorage.setItem("currentUser", currentUser);

        alert("Registration Successful!");
        showPage("dashboard");
    } else {
        alert("Registration successful! Please check your email to confirm your account.");
        showPage("login");
    }
}

async function login() {
    let email = document.getElementById("loginEmail").value;
    let password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert(error.message);
        return;
    }

    currentUser = data.user.email;
    currentUserId = data.user.id;

    localStorage.setItem("currentUser", currentUser);

    alert("Login Successful!");
    showPage("dashboard");
}


async function createBlog() {
    if (!currentUserId) {
        alert("Please login first");
        showPage("login");
        return;
    }

    const title = document.getElementById("blogTitle").value.trim();
    const content = document.getElementById("blogContent").value.trim();

    if (!title || !content) {
        alert("Please fill all fields");
        return;
    }

    const { error } = await supabaseClient
        .from("blogs")
        .insert({
            user_id: currentUserId,
            title: title,
            content: content
        });

    if (error) {
        alert("Blog creation failed: " + error.message);
        return;
    }

    document.getElementById("blogTitle").value = "";
    document.getElementById("blogContent").value = "";

    alert("Blog Published Successfully!");
    showPage("dashboard");
}


async function displayBlogs() {
    const list = document.getElementById("blogList");

    if (!list) return;

    list.innerHTML = "<p>Loading blogs...</p>";

    const searchInput = document.getElementById("searchInput");
    const searchText = searchInput ? searchInput.value.trim() : "";

    let query = supabaseClient
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

    if (searchText) {
        query = query.ilike("title", `%${searchText}%`);
    }

    const { data, error } = await query;

    if (error) {
        list.innerHTML = "<p>Unable to load blogs.</p>";
        console.log("Read Error:", error.message);
        return;
    }

    list.innerHTML = "<h2>Latest Blogs</h2>";

    if (!data || data.length === 0) {
        list.innerHTML += "<p>No blogs found.</p>";
        return;
    }

    data.forEach(blog => {
        list.innerHTML += `
            <div class="blog-card">
                <h2>${blog.title}</h2>
                <p>${blog.content}</p>
                <small>Published: ${new Date(blog.created_at).toLocaleDateString()}</small>
            </div>
        `;
    });
}


async function displayDashboard() {
    if (!currentUserId) {
        showPage("login");
        return;
    }

    const userName = document.getElementById("userName");
    const list = document.getElementById("dashboardBlogs");

    const { data, error } = await supabaseClient
        .from("blogs")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });

    if (error) {
        console.log("Dashboard Error:", error.message);
        list.innerHTML = "<p>Unable to load your blogs.</p>";
        return;
    }
const { data: profileData } = await supabaseClient.auth.getUser();

if (profileData.user) {
    const profile = profileData.user;

    userName.textContent =
        (profile.user_metadata.name || "User") + " | " + profile.email;
}
    list.innerHTML = "<h2>My Blogs</h2>";

    if (!data || data.length === 0) {
        list.innerHTML += "<p>You haven't created any blogs yet.</p>";
        return;
    }

    data.forEach(blog => {
        list.innerHTML += `
            <div class="blog-card">
                <h2>${blog.title}</h2>
                <p>${blog.content}</p>
                <button onclick="editBlog('${blog.id}')">Edit</button>
                <button onclick="deleteBlog('${blog.id}')">Delete</button>
            </div>
        `;
    });
}


function editBlog(index) {
    let newTitle = prompt("Enter new blog title:", blogs[index].title);

    if (newTitle === null || newTitle.trim() === "") return;

    let newContent = prompt("Enter new blog content:", blogs[index].content);

    if (newContent === null || newContent.trim() === "") return;

    blogs[index].title = newTitle;
    blogs[index].content = newContent;

    localStorage.setItem("blogs", JSON.stringify(blogs));

    alert("Blog Updated Successfully!");
    displayDashboard();
}

function deleteBlog(index) {
    if (confirm("Are you sure you want to delete this blog?")) {
        blogs.splice(index, 1);

        localStorage.setItem("blogs", JSON.stringify(blogs));

        alert("Blog Deleted Successfully!");
        displayDashboard();
    }
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Logout failed: " + error.message);
        return;
    }

    currentUser = "";
    currentUserId = null;
    localStorage.removeItem("currentUser");

    alert("Logged Out Successfully!");
    showPage("home");
}

async function testSupabaseConnection() {
    const { data, error } = await supabaseClient
        .from("blogs")
        .select("*");

    if (error) {
        console.log("Connection Error:", error.message);
    } else {
        console.log("Supabase Connected Successfully!");
        console.log(data);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");

    document.addEventListener("DOMContentLoaded", async () => {
    const searchInput = document.getElementById("searchInput");

    if (searchInput) {
        searchInput.addEventListener("input", displayBlogs);
    }

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.log(error.message);
    }

    if (data && data.session) {
        currentUser = data.session.user.email;
        currentUserId = data.session.user.id;
    }

    showPage("home");
});
    testSupabaseConnection();
});

async function editBlog(blogId) {
    const { data: blog, error: fetchError } = await supabaseClient
        .from("blogs")
        .select("*")
        .eq("id", blogId)
        .eq("user_id", currentUserId)
        .single();

    if (fetchError) {
        alert(fetchError.message);
        return;
    }

    const newTitle = prompt("Enter new title:", blog.title);
    if (newTitle === null || !newTitle.trim()) return;

    const newContent = prompt("Enter new content:", blog.content);
    if (newContent === null || !newContent.trim()) return;

    const { error } = await supabaseClient
        .from("blogs")
        .update({
            title: newTitle.trim(),
            content: newContent.trim()
        })
        .eq("id", blogId)
        .eq("user_id", currentUserId);

    if (error) {
        alert("Update failed: " + error.message);
        return;
    }

    alert("Blog Updated Successfully!");
    displayDashboard();
}

async function deleteBlog(blogId) {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    const { error } = await supabaseClient
        .from("blogs")
        .delete()
        .eq("id", blogId)
        .eq("user_id", currentUserId);

    if (error) {
        alert("Delete failed: " + error.message);
        return;
    }

    alert("Blog Deleted Successfully!");
    displayDashboard();
}
