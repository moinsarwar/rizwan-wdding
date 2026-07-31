const API = "/api/admin.php";

let wishes = [];
let filter = "all";
let linksTable = null;

const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const board = document.getElementById("wishes-board");
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

function rsvpLabel(value) {
  if (value === "attending") return "Attending";
  if (value === "maybe") return "Hopefully";
  return "Unable to attend";
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
    `You are invited to the Walima of Rizwan & Ayesha.\n` +
    `Please open your invitation:\n${inviteUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function filteredWishes() {
  if (filter === "pending") return wishes.filter((w) => !w.reply);
  if (filter === "replied") return wishes.filter((w) => !!w.reply);
  return wishes;
}

function renderBoard() {
  const list = filteredWishes();
  const pending = wishes.filter((w) => !w.reply).length;
  if (stats) {
    stats.textContent = `${wishes.length} wishes · ${pending} pending`;
  }
  if (!board) return;

  if (!list.length) {
    board.innerHTML = `<p class="empty">No wishes in this filter.</p>`;
    return;
  }

  board.innerHTML = list
    .map((w) => {
      const replied = !!w.reply;
      return `
      <article class="card" data-id="${w.id}">
        <div class="card__head">
          <h2 class="card__name">${escapeHtml(w.name)}</h2>
          <span class="badge ${replied ? "badge--replied" : "badge--pending"}">
            ${replied ? "Replied" : "Pending"}
          </span>
        </div>
        <div class="card__meta">
          ${rsvpLabel(w.rsvp)} · ${w.guests} guest${Number(w.guests) > 1 ? "s" : ""}
          · ${escapeHtml(formatDate(w.created_at))}
        </div>
        <p class="card__message">${escapeHtml(w.message)}</p>
        ${
          replied
            ? `<p class="card__reply"><strong>Your reply:</strong> ${escapeHtml(w.reply)}</p>`
            : ""
        }
        <form class="reply-box" data-reply-form="${w.id}">
          <textarea rows="3" placeholder="Write a reply…" required>${escapeHtml(w.reply || "")}</textarea>
          <div class="reply-box__actions">
            <button type="submit" class="btn btn--primary">
              ${replied ? "Update Reply" : "Send Reply"}
            </button>
            <button type="button" class="btn btn--danger" data-delete="${w.id}">
              Delete
            </button>
          </div>
        </form>
      </article>`;
    })
    .join("");
}

async function loadWishes() {
  const data = await api("list");
  wishes = data.data || [];
  renderBoard();
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
  if (!linksTable) return;
  linksTable.clear();
  linksTable.rows.add(rows);
  linksTable.draw();
}

function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === tabName);
  });
  document.getElementById("tab-wishes").hidden = tabName !== "wishes";
  document.getElementById("tab-links").hidden = tabName !== "links";

  if (tabName === "links") {
    loadLinks().catch((err) => alert(err.message));
  }
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
    try {
      await loadWishes();
    } catch (listErr) {
      if (board) {
        board.innerHTML = `<p class="empty">${escapeHtml(listErr.message || "Could not load wishes")}</p>`;
      }
    }
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
    const active = document.querySelector(".tab.is-active")?.dataset.tab || "wishes";
    if (active === "links") await loadLinks();
    else await loadWishes();
  } catch (err) {
    alert(err.message);
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab || "wishes"));
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    filter = chip.dataset.filter || "all";
    renderBoard();
  });
});

board?.addEventListener("submit", async (e) => {
  const form = e.target.closest("[data-reply-form]");
  if (!form) return;
  e.preventDefault();

  const id = Number(form.dataset.replyForm);
  const reply = form.querySelector("textarea")?.value.trim() || "";

  try {
    const data = await api("reply", {
      method: "POST",
      body: JSON.stringify({ id, reply }),
    });
    const idx = wishes.findIndex((w) => Number(w.id) === id);
    if (idx >= 0) wishes[idx] = data.data;
    renderBoard();
  } catch (err) {
    alert(err.message);
  }
});

board?.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-delete]");
  if (!btn) return;

  const id = Number(btn.dataset.delete);
  if (!confirm("Delete this wish?")) return;

  try {
    await api("delete", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    wishes = wishes.filter((w) => Number(w.id) !== id);
    renderBoard();
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
      await loadWishes();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
})();
