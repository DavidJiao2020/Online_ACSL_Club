

document.getElementById("resetForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById("newPassword").value;
    const token = window.location.pathname.split("/").pop();
  
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword })
    });
  
    const data = await res.json();
    document.getElementById("message").innerText = data.message;
  });
  