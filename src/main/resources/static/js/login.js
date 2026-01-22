console.log("Frontend loaded");

/* ---------------- SHOOTING STARS ---------------- */

const container = document.querySelector(".shooting-stars");

function createShootingStar() {
    if (!container) return;

    const star = document.createElement("span");

    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight * 0.9;
    const delay = Math.random() * 0.5;

    star.style.left = startX + "px";
    star.style.top = startY + "px";
    star.style.animationDelay = delay + "s";

    container.appendChild(star);

    setTimeout(() => {
        star.remove();
    }, 3000);
}

setInterval(createShootingStar, 1200);

/* ---------------- NAVIGATION ---------------- */

function goRegister() {
    window.location.href = "/register.html";
}

function goLogin() {
    window.location.href = "/login.html";
}

/* ---------------- REGISTER ---------------- */

function register() {

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;

    const message = document.getElementById("registerMessage");

    if (!name || !email || !password || !confirm) {
        message.innerText = "Please fill all fields";
        return;
    }

    if (password !== confirm) {
        message.innerText = "Passwords do not match";
        return;
    }

    fetch("/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            email: email,
            password: password
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("User exists");
            }
            return response.json();
        })
        .then(data => {
            // redirect with success message
            window.location.href = "/login.html?success=true";
        })
        .catch(() => {
            message.innerText = "Account already exists. Please login.";
        });
}

/* ---------------- LOGIN ---------------- */

function login() {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");

    if (!email || !password) {
        message.innerText = "Please enter email and password";
        return;
    }

    fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
        .then(res => res.text())
        .then(text => {
            if (text.includes("successful")) {
                window.location.href = "/dashboard.html";
            } else {
                message.innerText = "Invalid email or password";
            }
        });
}

/* ---------------- SHOW SUCCESS MESSAGE ---------------- */

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");

    if (success === "true") {
        const message = document.getElementById("loginMessage");
        if (message) {
            message.innerText = "Your account is successfully registered. Please login.";
        }
    }
};

window.openForgot = function () {
    document.getElementById("forgotBox").style.display = "block";
};


function resetPassword() {

    const email = document.getElementById("forgotEmail").value;
    const newPass = document.getElementById("newPassword").value;

    if (!email || !newPass) {
        alert("Please fill all fields");
        return;
    }

    // Check if email exists
    fetch(`/api/password/check?email=${email}`)
        .then(res => res.json())
        .then(exists => {

            if (!exists) {
                alert("Email not found!");
                return;
            }

            // Reset password
            fetch(`/api/password/reset?email=${email}&newPassword=${newPass}`, {
                method: "POST"
            })
            .then(() => {
                alert("Password reset successful!");
                document.getElementById("forgotBox").style.display = "none";
            });
        });
}

