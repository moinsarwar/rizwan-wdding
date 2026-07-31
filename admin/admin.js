const API = "/api/admin.php";

let wishes = [];
let filter = "all";

const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const board = document.getElementById("wishes-board");
const stats = document.getElementById("stats");

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

function filteredWishes() {
  if (filter === "pending") {
    return wishes.filter((w) => !w.reply);
  }
  if (filter === "replied") {
    return wishes.filter((w) => !!w.reply);
  }
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
    await loadWishes();
  } catch (err) {
    alert(err.message);
  }
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
