const body = document.getElementById("links-body");
const message = document.getElementById("message");

async function loadLinks() {
  const res = await fetch("/api/links");
  const links = await res.json();
  body.innerHTML = "";
  for (const link of links) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-slug", link.slug);
    tr.innerHTML = `
      <td><a class="short" href="/${link.slug}" target="_blank">/${link.slug}</a></td>
      <td class="dest">${escapeHtml(link.url)}</td>
      <td class="desc">${escapeHtml(link.description || "")}</td>
      <td class="clicks">${link.clicks}</td>
      <td><button class="delete-btn" data-slug="${link.slug}">Delete</button></td>
    `;
    body.appendChild(tr);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

document.getElementById("create-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "";
  const payload = {
    url: document.getElementById("url").value,
    slug: document.getElementById("slug").value || undefined,
    ai: document.getElementById("ai").checked,
  };
  const res = await fetch("/api/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok) {
    message.textContent = `Created /${data.slug}`;
    message.className = "ok";
    e.target.reset();
    loadLinks();
  } else {
    message.textContent = data.error || "Error creating link";
    message.className = "error";
  }
});

body.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;
  const slug = e.target.getAttribute("data-slug");
  await fetch(`/api/links/${slug}`, { method: "DELETE" });
  loadLinks();
});

loadLinks();
