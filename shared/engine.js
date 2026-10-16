/* Renders a form from a schema, validates it, autosaves a draft, and submits to the Apps Script URL. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  function fieldHtml(f) {
    const id = "f_" + f.key;
    const req = f.optional ? "" : '<span class="req" aria-hidden="true">*</span>';
    const sub = f.sub ? `<span class="sub">${esc(f.sub)}</span>` : "";
    const err = `<div class="err-msg" id="${id}_err" role="alert"></div>`;
    const wrap = (inner, cls = "") => `<div class="field ${cls}" data-key="${f.key}" data-type="${f.type}"${f.optional ? " data-optional" : ""}>${inner}${err}</div>`;

    if (f.type === "text" || f.type === "date") {
      const ro = f.readonly ? " readonly" : "";
      return wrap(`<label for="${id}">${esc(f.label)}${req}</label>
        <input type="${f.type}" id="${id}" name="${f.key}" autocomplete="off"${ro}>`);
    }
    if (f.type === "textarea") {
      return wrap(`<label for="${id}">${esc(f.label)}${req}${sub}</label>
        <textarea id="${id}" name="${f.key}" rows="${f.rows || 4}"${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ""}></textarea>`, "wide");
    }
    if (f.type === "scale") {
      return wrap(`<span class="q" id="${id}_l">${esc(f.label)}${req}${sub}</span>${scaleHtml(f.key, f.max, f.captions)}`);
    }
    if (f.type === "yesno") {
      const radios = ["Yes", "No"].map((v) =>
        `<input type="radio" name="${f.key}" id="${id}_${v}" value="${v}"><label for="${id}_${v}">${v}</label>`).join("");
      return wrap(`<span class="q">${esc(f.label)}${req}</span>
        <div class="scale yn" role="radiogroup" aria-label="${esc(f.label)}">${radios}</div>
        <label for="${id}_why" class="sub" style="margin-top:14px">${esc(f.detailLabel || "If no, specify instances")}</label>
        <textarea id="${id}_why" name="${f.key}_detail" rows="3"></textarea>`, "wide");
    }
    return "";
  }

  function scaleHtml(key, max, captions) {
    let h = `<div class="scale" role="radiogroup" aria-labelledby="f_${key}_l">`;
    for (let i = 1; i <= max; i++) {
      h += `<input type="radio" name="${key}" id="f_${key}_${i}" value="${i}"><label for="f_${key}_${i}">${i}</label>`;
    }
    h += "</div>";
    if (captions) h += `<div class="scale-cap" id="f_${key}_cap" aria-live="polite"></div>`;
    return h;
  }

  function rowHtml(r, cols) {
    // supervisor matrix row: optional rating / justification / remarks
    let h = `<div class="row"><h3>${esc(r.title)}</h3><div class="prompt">${esc(r.prompt)}</div>`;
    h += '<div class="pair">';
    if (r.assessment) {
      h += fieldHtml({ key: r.id + "_assessment", type: "textarea", label: "Supervisor assessment", rows: 3 });
    }
    if (cols.rating) {
      h += fieldHtml({ key: r.id + "_rating", type: "scale", label: "Rating (1–5)", max: 5, captions: window.RATING5 });
    }
    if (cols.justification) h += fieldHtml({ key: r.id + "_just", type: "textarea", label: "Justification for rating", rows: 3 });
    h += fieldHtml({ key: r.id + "_remarks", type: "textarea", label: cols.remarksLabel || "Additional remarks (if any)", rows: 3, optional: true });
    h += "</div></div>";
    return h;
  }

  function build(schema) {
    const sections = schema.sections.map((s, i) => {
      let body = "";
      if (s.guide) body += guideHtml(s.guide);
      if (s.fields) {
        const infoGrid = s.grid ? ' class="grid2"' : "";
        body += `<div${infoGrid}>${s.fields.map(fieldHtml).join("")}</div>`;
      }
      if (s.rows) body += s.rows.map((r) => rowHtml(r, s.cols)).join("");
      if (s.declaration) {
        body += `<label class="declare"><input type="checkbox" name="declaration" id="f_declaration"><span>${esc(s.declaration)}</span></label>
          <div class="field" data-key="declaration" data-type="check"><div class="err-msg" id="f_declaration_err" role="alert"></div></div>`;
      }
      return `<section class="sec" id="sec${i}" data-index="${i}" aria-labelledby="sec${i}h">
        <h2 id="sec${i}h">${esc(s.title)}</h2>${s.hint ? `<p class="hint">${esc(s.hint)}</p>` : ""}${body}</section>`;
    });
    return sections.join("");
  }

  function guideHtml(g) {
    return `<details class="guide"><summary>${esc(g.title)}</summary><dl>${g.items.map((x) => `<dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd>`).join("")}</dl></details>`;
  }

  // Personal link: ?id=<EmployeeID>&key=<secret>. The page checks it with the script before showing the form.
  function gate(schema) {
    const q = new URLSearchParams(location.search);
    const who = { id: (q.get("id") || "").trim(), key: (q.get("key") || "").trim() };
    const url = window.HR_CONFIG.SCRIPT_URL;
    if (!url) return Promise.resolve({ who, name: who.id ? "Demo User" : "" , demo: true });
    const bad = (m, soft) => { const e = new Error(m); e.blocked = true; e.soft = !!soft; return e; };
    if (!who.id || !who.key) return Promise.reject(bad("This form opens only from your personal link. Please use the link HR sent you."));
    const check = () => fetch(url + "?action=verify&id=" + encodeURIComponent(who.id) + "&key=" + encodeURIComponent(who.key)).then((r) => r.json());
    const wait = () => new Promise((res) => setTimeout(res, 1200));
    return check().catch(() => wait().then(check)).catch(() => wait().then(check))
      .then((j) => { if (!j.ok) throw bad(j.error || "This link is not valid. Please contact HR.");
        if (schema.id === "supervisor" && !j.isSupervisor) throw bad("The supervisor form is not enabled for your ID. Please contact HR.");
        return { who, name: j.name }; })
      .catch((e) => { throw e.blocked ? e : bad("Could not check your link. Check your connection and reload the page.", true); });
  }

  function backUrl(who) {
    return "../index.html" + (who && who.id ? "?id=" + encodeURIComponent(who.id) + "&key=" + encodeURIComponent(who.key) : "");
  }

  function blockPage(msg, soft) {
    const main = $("main");
    main.innerHTML = `<header class="formhead"><h1>${soft ? "Could not check your link" : "Link not valid"}</h1><p>${esc(msg)}</p></header>`;
    const nav = $(".progress"); if (nav) nav.hidden = true;
  }

  function init(schema) {
    const main = $("main");
    const holder = main.innerHTML;
    main.innerHTML = '<div class="loader" role="status"><div class="spin"></div>Checking your link…</div>';
    gate(schema).then((g) => { main.innerHTML = holder; start(schema, g); })
      .catch((e) => blockPage(e.message, e.soft));
  }

  function start(schema, g) {
    const draftKey = "hr_draft_" + schema.id + "_" + (g.who.id || "demo");
    const form = $("#form");
    // keep the personal link when going back to the "All forms" page
    document.querySelectorAll('a[href="../index.html"]').forEach((a) => { a.href = backUrl(g.who); });
    form.innerHTML = build(schema);
    $("#sectionNav").innerHTML = schema.sections.map((s, i) =>
      `<li><a href="#sec${i}" data-nav="${i}"><span class="tick"></span>${esc(s.short)}</a></li>`).join("");
    if (!window.HR_CONFIG.SCRIPT_URL) $("#demo").hidden = false;

    // defaults
    const today = new Date().toISOString().slice(0, 10);
    ["date", "submissionDate", "signDate"].forEach((k) => { const el = form.elements[k]; if (el && !el.value) el.value = today; });

    // restore draft
    try {
      const saved = JSON.parse(store.get(draftKey) || "null");
      if (saved) Object.entries(saved).forEach(([k, v]) => setValue(form, k, v));
    } catch (e) {}
    // lock the identity fields to the person the link belongs to
    if (!g.demo || g.who.id) {
      [[schema.idField, g.who.id], [schema.nameField, g.name]].forEach(([k, v]) => {
        const el = form.elements[k];
        if (el && v) { el.value = v; el.readOnly = true; }
      });
    }
    updateCaptions(form);
    refresh();

    form.addEventListener("input", onChange);
    form.addEventListener("change", onChange);
    function onChange(e) {
      const f = e.target.closest(".field");
      if (f) { f.classList.remove("invalid"); }
      $("#errBanner").classList.remove("show");
      store.set(draftKey, JSON.stringify(collect(form)));
      $("#draftNote").textContent = "Draft saved on this device";
      updateCaptions(form);
      refresh();
    }

    function refresh() {
      schema.sections.forEach((s, i) => {
        const sec = $("#sec" + i);
        const fields = [...sec.querySelectorAll(".field[data-key]")].filter((f) => !f.hasAttribute("data-optional") && f.dataset.type !== "check");
        const done = fields.length > 0 && fields.every((f) => isFilled(form, f));
        const a = $(`[data-nav="${i}"]`);
        a.classList.toggle("complete", done);
      });
    }

    // current section highlight
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) {
        document.querySelectorAll("[data-nav]").forEach((a) => a.classList.remove("current"));
        $(`[data-nav="${en.target.dataset.index}"]`).classList.add("current");
      } });
    }, { rootMargin: "-20% 0px -70% 0px" });
    document.querySelectorAll(".sec").forEach((s) => io.observe(s));

    $("#submitBtn").addEventListener("click", () => submit(schema, form, draftKey, g.who));
    $("#clearBtn").addEventListener("click", () => {
      if (confirm("Clear everything you have entered on this form?")) { store.del(draftKey); location.reload(); }
    });
  }

  function updateCaptions(form) {
    document.querySelectorAll(".scale-cap").forEach((cap) => {
      const key = cap.id.replace(/^f_/, "").replace(/_cap$/, "");
      const v = form.elements[key] && form.elements[key].value;
      const caps = key === "supRating" ? window.RATING10 : window.RATING5;
      cap.textContent = v ? caps(v) : "";
    });
  }

  function setValue(form, k, v) {
    const el = form.elements[k];
    if (!el) return;
    if (el instanceof RadioNodeList) el.value = v;
    else if (el.type === "checkbox") el.checked = !!v;
    else el.value = v;
  }

  function collect(form) {
    const out = {};
    [...form.elements].forEach((el) => {
      if (!el.name) return;
      if (el.type === "radio") { if (el.checked) out[el.name] = el.value; }
      else if (el.type === "checkbox") out[el.name] = el.checked;
      else out[el.name] = el.value.trim();
    });
    return out;
  }

  function isFilled(form, f) {
    const key = f.dataset.key, t = f.dataset.type;
    const v = form.elements[key] && form.elements[key].value;
    if (t === "yesno") {
      if (!v) return false;
      return v === "Yes" || (form.elements[key + "_detail"].value.trim() !== "");
    }
    return !!(v && String(v).trim());
  }


  // key -> column heading for the Sheet (so headings read like the form)
  function headingsFor(schema) {
    const h = {};
    schema.sections.forEach((s) => {
      (s.fields || []).forEach((f) => {
        const t = f.header || f.label;
        h[f.key] = t;
        if (f.type === "yesno") h[f.key + "_detail"] = t + " - details";
      });
      (s.rows || []).forEach((r) => {
        if (r.assessment) h[r.id + "_assessment"] = r.title + " - supervisor assessment";
        if ((s.cols || {}).rating) h[r.id + "_rating"] = r.title + " - rating (1-5)";
        if ((s.cols || {}).justification) h[r.id + "_just"] = r.title + " - justification for rating";
        h[r.id + "_remarks"] = r.title + " - " + (((s.cols || {}).remarksLabel) || "additional remarks").replace(/^./, (c) => c.toLowerCase());
      });
    });
    return h;
  }

  function submit(schema, form, draftKey, who) {
    const banner = $("#errBanner");
    banner.classList.remove("show");
    let first = null;
    form.querySelectorAll(".field.invalid").forEach((f) => f.classList.remove("invalid"));

    form.querySelectorAll(".field[data-key]").forEach((f) => {
      if (f.hasAttribute("data-optional")) return;
      if (f.dataset.type === "check") {
        if (!form.elements.declaration.checked) fail(f, "Tick the box to confirm.");
        return;
      }
      if (!isFilled(form, f)) {
        const t = f.dataset.type;
        let m = "This is required.";
        if (t === "scale") m = "Choose a rating.";
        if (t === "yesno") m = form.elements[f.dataset.key].value === "No" ? "Describe the instances." : "Choose Yes or No.";
        fail(f, m);
      }
    });
    function fail(f, msg) {
      f.classList.add("invalid");
      f.querySelector(".err-msg").textContent = msg;
      if (!first) first = f;
    }
    if (first) {
      banner.textContent = "Some answers are missing. Fix the fields marked in red, then submit again.";
      banner.classList.add("show");
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const btn = $("#submitBtn");
    btn.disabled = true; btn.classList.add("busy"); btn.textContent = "Submitting…";
    const payload = { form: schema.id, period: window.HR_CONFIG.PERIOD, submittedAt: new Date().toISOString(), id: who.id, key: who.key, data: collect(form), labels: headingsFor(schema) };
    delete payload.data.declaration;

    send(payload).then((res) => {
      store.del(draftKey);
      showDone(res.ref, res.demo, who);
    }).catch((e) => {
      btn.disabled = false; btn.classList.remove("busy"); btn.textContent = "Submit";
      banner.textContent = e.message || "Could not submit. Check your connection and try again. Your answers are saved on this device.";
      banner.classList.add("show");
      banner.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function send(payload) {
    const url = window.HR_CONFIG.SCRIPT_URL;
    if (!url) {
      const all = JSON.parse(store.get("hr_demo_submissions") || "[]");
      all.push(payload); store.set("hr_demo_submissions", JSON.stringify(all));
      return Promise.resolve({ ref: "DEMO-" + Date.now().toString(36).toUpperCase(), demo: true });
    }
    return fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
      .then((r) => r.json())
      .then((j) => { if (!j.ok) throw new Error(j.error || "The server rejected this submission."); return { ref: j.ref }; });
  }

  function showDone(ref, demo, who) {
    document.body.innerHTML = `<main class="done" id="main">
      <h1>Submission received</h1>
      <p>Thank you. Your ${demo ? "demo " : ""}response has been recorded.</p>
      <div class="ref">Reference: ${esc(ref)}</div>
      ${demo ? "<p>Demo mode: nothing was sent to HR. The live link is not connected yet.</p>" : "<p>You can close this page. Please keep the reference number.</p>"}
      <p><a href="${backUrl(who)}">Back to start</a></p></main>`;
    window.scrollTo(0, 0);
  }

  window.RATING5 = (v) => ({ 1: "Needs significant improvement", 2: "Partially meets expectations", 3: "Meets expectations", 4: "Exceeds expectations", 5: "Exceptional / outstanding" }[v] || "");
  window.RATING10 = (v) => { v = +v; return v <= 3 ? "Needs significant improvement" : v <= 5 ? "Needs improvement / partially satisfactory" : v <= 7 ? "Meets expectations" : v <= 9 ? "Exceeds expectations" : "Outstanding"; };
  window.HRForm = { init };
})();
