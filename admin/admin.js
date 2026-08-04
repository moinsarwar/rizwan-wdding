const API = "/api/admin.php";

let linksTable = null;

const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const stats = document.getElementById("stats");
const createLinkForm = document.getElementById("create-link-form");
const linkFormNote = document.getElementById("link-form-note");

async function api(action, options = {}) {
  const url = action ? `${API}?action=${encodeURIComponent(action)}` : API;
  const { headers: extraHeaders, ...rest } = options;

  const res = await fetch(url, {
    ...rest,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(extraHeaders || {}),
    },
  });

  const data = await res.json().catch(() => ({
    ok: false,
    error: "Invalid response",
  }));

  if (!res.ok || data.ok === false) {
    const error = new Error(data.error || "Request failed");
    error.status = res.status;
    throw error;
  }

  return data;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(value);
  try {
    return d.toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return d.toLocaleString();
  }
}

function showLogin() {
  loginView?.removeAttribute("hidden");
  dashboardView?.setAttribute("hidden", "");
}

function showDashboard() {
  loginView?.setAttribute("hidden", "");
  dashboardView?.removeAttribute("hidden");
}

function whatsappUrl(guestName, inviteUrl) {
  const text =
    `Assalamu Alaikum ${guestName},\n\n` +
    `You are invited to the Reception of Rizwan weds Ayesha.\n` +
    `Please open your invitation:\n${inviteUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function initLinksTable() {
  if (linksTable || !window.DataTable) return;

  linksTable = new DataTable("#links-table", {
    data: [],
    columns: [
      {
        data: null,
        render: (_data, _type, _row, meta) => meta.row + 1,
        orderable: false,
        width: "40px",
      },
      { data: "guest_name" },
      {
        data: "invite_url",
        render: (url) =>
          `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a>`,
      },
      {
        data: "created_at",
        render: (value) => escapeHtml(formatDate(value)),
      },
      {
        data: null,
        orderable: false,
        render: (row) => `
          <div class="table-actions">
            <button type="button" class="btn btn--ghost btn--small" data-copy-link="${escapeHtml(row.invite_url)}">Copy</button>
            <a class="btn btn--primary btn--small" target="_blank" rel="noopener"
               href="${whatsappUrl(row.guest_name, row.invite_url)}">WhatsApp</a>
            <button type="button" class="btn btn--danger btn--small" data-delete-link="${row.id}">Delete</button>
          </div>`,
      },
    ],
    order: [[3, "desc"]],
    pageLength: 10,
    responsive: true,
    language: {
      search: "Search:",
      emptyTable: "No invite links yet. Create one above.",
    },
  });
}

async function loadLinks() {
  initLinksTable();
  const data = await api("links");
  const rows = data.data || [];
  if (stats) {
    stats.textContent = `${rows.length} invite link${rows.length === 1 ? "" : "s"}`;
  }
  if (!linksTable) return;
  linksTable.clear();
  linksTable.rows.add(rows);
  linksTable.draw();
}

function showLinkNote(message, isError = false) {
  if (!linkFormNote) return;
  linkFormNote.hidden = false;
  linkFormNote.textContent = message;
  linkFormNote.style.color = isError ? "#9b3b3b" : "";
}

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (loginError) loginError.hidden = true;

  const username = loginForm.username.value.trim();
  const password = loginForm.password.value;

  try {
    await api("login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    loginForm.reset();
    showDashboard();
    await loadLinks();
  } catch (err) {
    showLogin();
    if (loginError) {
      loginError.hidden = false;
      loginError.textContent = err.message || "Login failed";
    }
  }
});

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  try {
    await api("logout", { method: "POST", body: "{}" });
  } catch {
    // ignore
  }
  showLogin();
});

document.getElementById("refresh-btn")?.addEventListener("click", async () => {
  try {
    await loadLinks();
  } catch (err) {
    alert(err.message);
  }
});

createLinkForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const guestName = createLinkForm.guest_name.value.trim();
  if (!guestName) return;

  try {
    const data = await api("create-link", {
      method: "POST",
      body: JSON.stringify({ guest_name: guestName }),
    });
    createLinkForm.reset();
    await loadLinks();

    const link = data.data?.invite_url || "";
    if (data.existing) {
      showLinkNote(`Link already exists: ${link}`);
    } else {
      showLinkNote(`Link created: ${link}`);
    }
  } catch (err) {
    showLinkNote(err.message || "Could not create link", true);
  }
});

document.getElementById("tab-links")?.addEventListener("click", async (e) => {
  const copyBtn = e.target.closest("[data-copy-link]");
  if (copyBtn) {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.copyLink || "");
      copyBtn.textContent = "Copied";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 1200);
    } catch {
      alert("Copy failed");
    }
    return;
  }

  const deleteBtn = e.target.closest("[data-delete-link]");
  if (!deleteBtn) return;

  const id = Number(deleteBtn.dataset.deleteLink);
  if (!confirm("Delete this invite link?")) return;

  try {
    await api("delete-link", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    await loadLinks();
  } catch (err) {
    alert(err.message);
  }
});

(async function init() {
  try {
    const me = await api("me");
    if (me.authenticated) {
      showDashboard();
      await loadLinks();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
})();
