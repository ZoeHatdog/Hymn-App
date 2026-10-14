const status = document.querySelector("#status");
const list = document.querySelector("#hymn-list");
const form = document.querySelector("#hymn-form");
const formNote = document.querySelector("#form-note");
const refresh = document.querySelector("#refresh");
const save = document.querySelector("#save");
const saveLabel = "Save hymn";

refresh.addEventListener("click", () => {
  loadHymns();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fields = [...form.querySelectorAll("input, textarea")];
  let valid = true;
  for (const field of fields) {
    field.dataset.touched = "true";
    if (!validateField(field)) {
      valid = false;
    }
  }
  if (!valid) {
    form.querySelector("[aria-invalid='true']")?.focus();
    setNote("");
    setSaveState("");
    return;
  }

  setSaveState("loading");
  setNote("");
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch("/api/hymns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      setSaveState("error");
      setNote(body.error ?? "The hymn was not saved. Try again in a moment.", "error");
      return;
    }
    form.reset();
    clearFields();
    setSaveState("success");
    setNote("Saved.", "success");
    await loadHymns();
  } catch {
    setSaveState("error");
    setNote("The hymn was not saved. The desk could not reach its server. Refresh and try again.", "error");
  }
});

for (const field of form.querySelectorAll("input, textarea")) {
  field.addEventListener("blur", () => {
    field.dataset.touched = "true";
    validateField(field);
  });
  field.addEventListener("input", () => {
    if (field.dataset.touched === "true") {
      validateField(field);
    }
    if (save.dataset.state === "error" || save.dataset.state === "success") {
      setSaveState("");
      setNote("");
    }
  });
}

async function loadHymns() {
  list.ariaBusy = "true";
  list.replaceChildren(skeleton(), skeleton(), skeleton());
  try {
    const response = await fetch("/api/hymns");
    const body = await response.json();
    if (!response.ok || !body.success) {
      status.textContent = body.error ?? "The hymn list did not load. Refresh to try again.";
      list.replaceChildren(emptyState("The list is waiting on the API.", false));
      return;
    }

    const hymns = body.data ?? [];
    status.textContent =
      hymns.length === 1 ? "1 hymn in the library." : `${hymns.length} hymns in the library.`;
    if (hymns.length === 0) {
      list.replaceChildren(emptyState("No hymns yet.", true));
      return;
    }

    list.replaceChildren(...hymns.map(renderHymn));
  } catch {
    status.textContent = "The hymn list did not load. The desk could not reach its server.";
    list.replaceChildren(emptyState("The list is waiting on the desk.", false));
  } finally {
    list.ariaBusy = "false";
  }
}

function renderHymn(hymn) {
  const row = document.createElement("li");
  const copy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = hymn.title;
  const meta = document.createElement("p");
  meta.textContent = [hymn.author, hymn.library, hymn.page ? `p. ${hymn.page}` : ""]
    .filter(Boolean)
    .join(" · ");
  copy.append(title, meta);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "btn";
  remove.textContent = "Delete";
  remove.addEventListener("click", () => deleteHymn(hymn, remove));
  row.append(copy, remove);
  return row;
}

async function deleteHymn(hymn, button) {
  button.dataset.state = "loading";
  button.disabled = true;
  button.textContent = "Deleting…";
  try {
    const response = await fetch(`/api/hymns/${encodeURIComponent(hymn.id)}`, {
      method: "DELETE",
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      button.dataset.state = "error";
      button.disabled = false;
      button.textContent = "Delete";
      status.textContent = body.error ?? "That hymn was not deleted. Refresh and try again.";
      return;
    }
    await loadHymns();
  } catch {
    button.dataset.state = "error";
    button.disabled = false;
    button.textContent = "Delete";
    status.textContent = "That hymn was not deleted. The desk could not reach its server.";
  }
}

function skeleton() {
  const row = document.createElement("li");
  row.className = "skeleton";
  row.setAttribute("aria-hidden", "true");
  row.append(document.createElement("span"), document.createElement("span"));
  return row;
}

function emptyState(lead, offerAdd) {
  const row = document.createElement("li");
  row.className = "empty";
  row.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 7.5h8.2c1.1 0 2 .5 2.3 1.4.3-.9 1.2-1.4 2.3-1.4H26v15.5h-7.2c-.9 0-1.7.4-2.3 1-.6-.6-1.4-1-2.3-1H6V7.5z" fill="none" stroke="currentColor" stroke-width="1.25"/></svg>`;
  const copy = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = lead;
  copy.append(strong, document.createTextNode(" Saved hymns are listed here once the library answers."));
  row.append(copy);
  if (offerAdd) {
    const add = document.createElement("button");
    add.type = "button";
    add.className = "btn";
    add.textContent = "Add a hymn";
    add.addEventListener("click", () => {
      document.querySelector("#title")?.focus();
    });
    row.append(add);
  }
  return row;
}

function validateField(field) {
  const helper = document.getElementById(`${field.id}-help`);
  const wrap = field.closest(".field");
  const missing = field.required && field.value.trim().length === 0;
  if (!helper || !wrap) {
    return !missing;
  }
  if (missing) {
    helper.textContent = field.dataset.error ?? "";
    field.setAttribute("aria-invalid", "true");
    wrap.dataset.state = "error";
    return false;
  }
  helper.textContent = "";
  field.removeAttribute("aria-invalid");
  if (field.dataset.touched === "true" && field.required) {
    wrap.dataset.state = "success";
  } else {
    delete wrap.dataset.state;
  }
  return true;
}

function clearFields() {
  for (const field of form.querySelectorAll("input, textarea")) {
    delete field.dataset.touched;
    field.removeAttribute("aria-invalid");
    const wrap = field.closest(".field");
    if (wrap) {
      delete wrap.dataset.state;
    }
    const helper = document.getElementById(`${field.id}-help`);
    if (helper) {
      helper.textContent = "";
    }
  }
}

function setNote(message, kind) {
  formNote.textContent = message;
  if (kind) {
    formNote.dataset.kind = kind;
  } else {
    delete formNote.dataset.kind;
  }
}

function setSaveState(state) {
  if (state) {
    save.dataset.state = state;
  } else {
    delete save.dataset.state;
  }
  save.disabled = state === "loading";
  save.textContent = state === "loading" ? "Saving…" : state === "success" ? "Saved" : saveLabel;
}

loadHymns();
