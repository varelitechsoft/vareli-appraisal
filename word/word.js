/* Word export: reads an exported Excel file in the browser and builds one short .docx per submission.
   Nothing is uploaded anywhere. */
(function () {
  "use strict";
  var D = window.docx;
  var BLUE = "22559E", NAVY = "1F3254", GREY = "555F6D", FONT = "Calibri";
  var HR_ONLY = { wlbRating: 1, wlbWhy: 1, wellbeingSupport: 1, supAction: 1, supRating: 1, supExamples: 1 };
  var KINDS = {
    self: { folder: "../self-appraisal/schema.js", title: "Self Appraisal", label: "Self" },
    supervisor: { folder: "../supervisor/schema.js", title: "Supervisor Assessment", label: "Supervisor" }
  };
  var $ = function (s) { return document.querySelector(s); };
  var state = { kind: "self", people: [], schema: null, logo: null };

  function norm(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim().toLowerCase(); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function low(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function safe(s) { return String(s || "").replace(/[\\/:*?"<>|]+/g, "").trim(); }

  // Script tags (not fetch) so this also works when the page is opened straight from a folder.
  var schemaCache = {};
  function loadSchema(kind) {
    if (schemaCache[kind]) return Promise.resolve(schemaCache[kind]);
    return new Promise(function (res, rej) {
      var prev = window.SCHEMA, s = document.createElement("script");
      s.src = KINDS[kind].folder;
      s.onload = function () { schemaCache[kind] = window.SCHEMA; window.SCHEMA = prev; s.remove(); res(schemaCache[kind]); };
      s.onerror = function () { rej(new Error("Could not load the form layout.")); };
      document.head.appendChild(s);
    });
  }

  function loadLogo() {
    if (state.logo || !window.LOGO_B64) return Promise.resolve(state.logo);
    var bin = atob(window.LOGO_B64), buf = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () { state.logo = { data: buf, ratio: img.width / img.height }; res(state.logo); };
      img.onerror = function () { res(null); };
      img.src = "data:image/png;base64," + window.LOGO_B64;
    });
  }

  /* ---------- read the Excel file ---------- */
  function readSheet(file) {
    return file.arrayBuffer().then(function (buf) {
      var wb = XLSX.read(buf, { type: "array", cellDates: true });
      var ws = wb.Sheets[wb.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
      if (rows.length < 2) throw new Error("The file has no rows.");
      var heads = rows[0].map(norm), people = [];
      rows.slice(1).forEach(function (r) {
        if (!r.some(function (c) { return c !== ""; })) return;
        var o = {};
        heads.forEach(function (h, i) { if (h) o[h] = r[i]; });
        people.push(o);
      });
      return people;
    });
  }

  function val(p, heading) {
    var v = p[norm(heading)];
    if (v instanceof Date) {
      var m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return v.getDate() + " " + m[v.getMonth()] + " " + v.getFullYear();
    }
    return v == null ? "" : String(v).trim();
  }

  /* ---------- docx building blocks ---------- */
  function run(t, o) {
    o = o || {};
    return new D.TextRun({ text: t, font: FONT, size: Math.round((o.size || 9.5) * 2), bold: !!o.bold, italics: !!o.italic, color: o.color });
  }
  // Keep line breaks typed by the employee (e.g. "1. ... 2. ... 3. ...").
  function textRuns(t, o) {
    var parts = String(t).replace(new RegExp(String.fromCharCode(13), "g"), "").split(String.fromCharCode(10)), out = [];
    parts.forEach(function (ln, i) {
      var r = run(ln, o);
      if (i) r = new D.TextRun({ text: ln, break: 1, font: FONT, size: Math.round(((o && o.size) || 9.5) * 2), bold: !!(o && o.bold), italics: !!(o && o.italic), color: o && o.color });
      out.push(r);
    });
    return out;
  }
  function para(runs, o) {
    o = o || {};
    return new D.Paragraph({
      children: runs, alignment: o.align, keepNext: !!o.keepNext,
      indent: o.indent ? { left: o.indent } : undefined,
      spacing: { before: o.before || 0, after: o.after == null ? 40 : o.after, line: 240 },
      border: o.border
    });
  }
  var NOB = { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" };
  var NOBORDERS = { top: NOB, bottom: NOB, left: NOB, right: NOB, insideHorizontal: NOB, insideVertical: NOB };
  function line(c) { return { style: D.BorderStyle.SINGLE, size: 4, color: c || "C9D3E3" }; }

  function bar(title, fill) {
    return [para([], { after: 60, keepNext: true }), new D.Table({
      width: { size: 100, type: D.WidthType.PERCENTAGE }, borders: NOBORDERS,
      rows: [new D.TableRow({ children: [new D.TableCell({
        shading: { type: D.ShadingType.CLEAR, color: "auto", fill: fill || BLUE },
        margins: { top: 30, bottom: 30, left: 100, right: 100 },
        children: [para([run(title.toUpperCase(), { size: 9.5, bold: true, color: "FFFFFF" })], { after: 0, keepNext: true })]
      })] })]
    }), para([], { after: 20, keepNext: true })];
  }

  function grid(pairs) {
    var rows = [], i, cells;
    for (i = 0; i < pairs.length; i += 2) {
      cells = [];
      [pairs[i], pairs[i + 1]].forEach(function (pr) {
        pr = pr || ["", ""];
        cells.push(new D.TableCell({
          width: { size: 18, type: D.WidthType.PERCENTAGE },
          shading: { type: D.ShadingType.CLEAR, color: "auto", fill: "EAF0F9" },
          margins: { top: 30, bottom: 30, left: 80, right: 80 },
          children: [para([run(pr[0], { size: 8.5, bold: true, color: NAVY })], { after: 0 })]
        }));
        cells.push(new D.TableCell({
          width: { size: 32, type: D.WidthType.PERCENTAGE },
          margins: { top: 30, bottom: 30, left: 80, right: 80 },
          children: [para([run(pr[1] || (pr[0] ? "-" : ""), { size: 9.5 })], { after: 0 })]
        }));
      });
      rows.push(new D.TableRow({ children: cells }));
    }
    var b = { top: line(), bottom: line(), left: line(), right: line(), insideHorizontal: line(), insideVertical: line() };
    return [new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, borders: b, rows: rows }), para([], { after: 60 })];
  }

  var SUMMARY_SELF = { roleRating: "Role experience", skillsRating: "Skills", teamRating: "Teamwork", overallRating: "Overall" };
  function summary(items) {
    items = items.filter(function (i) { return /^\d+(\.0+)?$/.test(i.v); });
    if (!items.length) return [];
    var w = Math.floor(100 / items.length);
    var cells = items.map(function (i) {
      return new D.TableCell({
        width: { size: w, type: D.WidthType.PERCENTAGE },
        shading: { type: D.ShadingType.CLEAR, color: "auto", fill: i.overall ? "DCE7F6" : "F4F7FC" },
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
        children: [
          para([run(parseInt(i.v, 10) + " / " + i.max, { size: 14, bold: true, color: i.overall ? NAVY : BLUE })], { align: D.AlignmentType.CENTER, after: 0 }),
          para([run(i.name, { size: 7.5, color: GREY })], { align: D.AlignmentType.CENTER, after: 0 })
        ]
      });
    });
    var b = { top: line(), bottom: line(), left: line(), right: line(), insideHorizontal: line(), insideVertical: line() };
    return [para([run("RATINGS AT A GLANCE", { size: 8, bold: true, color: GREY })], { after: 20, keepNext: true }),
      new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, borders: b, rows: [new D.TableRow({ children: cells })] }),
      para([], { after: 40 })];
  }

  function ratingRuns(v, max) {
    return /^\d+(\.0+)?$/.test(v) ? [run(parseInt(v, 10) + " / " + max, { size: 11, bold: true, color: BLUE })] : null;
  }

  function writeBlocks(blocks) {
    var out = [];
    blocks.forEach(function (b) {
      if (b.group) {
        out.push(para([run(b.q, { size: 9.5, bold: true, color: NAVY })], { before: 70, after: 10, keepNext: true }));
        b.parts.forEach(function (pt) {
          if (!pt.a && !pt.max) return;
          var rr = [run(pt.l + ": ", { size: 8.5, bold: true, color: GREY })];
          var rt = pt.max ? ratingRuns(pt.a, pt.max) : null;
          rr = rr.concat(rt || textRuns(pt.a || "-", { size: 9.5 }));
          out.push(para(rr, { indent: 170, after: 20 }));
        });
      } else {
        out.push(para([run(b.q, { size: 9, bold: true, color: NAVY })], { before: 60, after: 0, keepNext: true }));
        var rt = b.max ? ratingRuns(b.a, b.max) : null;
        out.push(para(rt || textRuns(b.a || "-", { size: 9.5, color: b.a ? undefined : GREY }), { indent: 170, after: 30 }));
      }
    });
    return out;
  }

  /* ---------- one person -> one document ---------- */
  function buildDoc(p, kind, schema) {
    var K = KINDS[kind], kids = [], hr = [];
    var ref = val(p, "Reference"), period = val(p, "Period") || "Half Yearly Review Apr-Sep 2026";

    var headerCells = [];
    var logo = state.logo;
    headerCells.push(new D.TableCell({
      width: { size: 30, type: D.WidthType.PERCENTAGE },
      children: [logo ? new D.Paragraph({ children: [new D.ImageRun({ type: "png", data: logo.data, transformation: { width: Math.round(32 * logo.ratio), height: 32 } })] }) : para([])]
    }));
    headerCells.push(new D.TableCell({
      width: { size: 70, type: D.WidthType.PERCENTAGE },
      children: [
        para([run(K.title, { size: 15, bold: true, color: NAVY })], { align: D.AlignmentType.RIGHT, after: 0 }),
        para([run(period + (ref ? "   |   Ref " + ref : ""), { size: 8.5, color: GREY })], { align: D.AlignmentType.RIGHT, after: 0 })
      ]
    }));
    kids.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, borders: NOBORDERS, rows: [new D.TableRow({ children: headerCells })] }));
    kids.push(para([], { after: 80, border: { bottom: { style: D.BorderStyle.SINGLE, size: 12, color: BLUE, space: 1 } } }));

    var signoff = null, sumItems = [], sumDone = false;
    schema.sections.forEach(function (sec) {
      (sec.fields || []).forEach(function (f) {
        if (kind === "self" && SUMMARY_SELF[f.key]) sumItems.push({ name: SUMMARY_SELF[f.key], v: val(p, f.header || f.label), max: f.max, overall: f.key === "overallRating" });
        if (kind === "supervisor" && f.key === "overallRating") sumItems.push({ name: "Overall", v: val(p, f.header || f.label), max: f.max, overall: true });
      });
      if (kind === "supervisor" && (sec.cols || {}).rating) (sec.rows || []).forEach(function (r) {
        sumItems.splice(sumItems.length, 0, { name: r.title, v: val(p, r.title + " - rating (1-5)"), max: 5 });
      });
    });
    if (kind === "supervisor") { // overall last
      sumItems.sort(function (a, b) { return (a.overall ? 1 : 0) - (b.overall ? 1 : 0); });
    } else {
      sumItems.sort(function (a, b) { return (a.overall ? 1 : 0) - (b.overall ? 1 : 0); });
    }
    schema.sections.forEach(function (sec) {
      if (sec.title === "Sign-off") { signoff = sec; return; }
      if (sec.grid) {
        kids = kids.concat(grid(sec.fields.map(function (f) { return [f.label, val(p, f.header || f.label)]; })));
        if (!sumDone) { sumDone = true; kids = kids.concat(summary(sumItems)); }
        return;
      }
      var blocks = [];
      (sec.fields || []).forEach(function (f) {
        var h = f.header || f.label;
        var item = { q: f.label, a: val(p, h), max: f.type === "scale" ? f.max : 0 };
        if (kind === "self" && HR_ONLY[f.key]) hr.push(item); else blocks.push(item);
        if (f.type === "yesno") {
          var det = val(p, h + " - details");
          if (det) blocks.push({ q: f.detailLabel || "Details", a: det });
        }
      });
      var cols = sec.cols || {};
      (sec.rows || []).forEach(function (r) {
        var t = r.title, parts = [];
        if (r.assessment) parts.push({ l: "Assessment", a: val(p, t + " - supervisor assessment") });
        if (cols.rating) parts.push({ l: "Rating", a: val(p, t + " - rating (1-5)"), max: 5 });
        if (cols.justification) parts.push({ l: "Justification", a: val(p, t + " - justification for rating") });
        var rem = cols.remarksLabel || "additional remarks";
        parts.push({ l: cap(rem), a: val(p, t + " - " + low(rem)) });
        blocks.push({ group: true, q: t, parts: parts });
      });
      if (kind === "self" && (sec.title === "Wellbeing and work experience" || sec.title === "Supervisory support")) {
        hr = hr.concat(blocks); return;
      }
      if (!blocks.length) return;
      kids = kids.concat(bar(sec.title), writeBlocks(blocks));
    });

    if (hr.length) {
      // keep first-seen order (wellbeing, then supervisor) and drop duplicates
      var seen = {}; hr = hr.filter(function (b) { var k = b.q; if (seen[k]) return false; seen[k] = 1; return true; });
      kids = kids.concat(bar("HR only - not shared with the supervisor", NAVY), writeBlocks(hr));
    }
    if (signoff) {
      kids = kids.concat(bar("Sign-off", NAVY), grid(signoff.fields.map(function (f) { return [f.label.split(" (")[0], val(p, f.header || f.label)]; })));
      if (signoff.declaration) kids.push(para([run(signoff.declaration, { size: 8, italic: true, color: GREY })]));
    }

    return new D.Document({
      creator: "Vareli Tecnac Pvt. Ltd.", title: K.title,
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 700, bottom: 700, left: 900, right: 900 } } },
        footers: { default: new D.Footer({ children: [para([run("Vareli Tecnac Pvt. Ltd.  |  Confidential - HR use only", { size: 7.5, color: GREY })], { align: D.AlignmentType.CENTER, after: 0 })] }) },
        children: kids
      }]
    });
  }

  function fileName(p, kind) {
    return safe(val(p, "Employee ID")) + " - " + safe(val(p, "Employee name")) + " - " + KINDS[kind].label + ".docx";
  }

  /* ---------- page ---------- */
  function setMsg(t, bad) { var m = $("#msg"); m.textContent = t || ""; m.className = "msg" + (bad ? " bad" : ""); }
  function saveBlob(blob, name) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  function supOf(p) {
    var id = val(p, "Supervisor Employee ID"), nm = val(p, "Supervisor name");
    return id || nm ? (nm || "Unknown") + (id ? " (" + id + ")" : "") : "";
  }

  function fillFilter() {
    var sel = $("#supFilter"), isSup = state.kind === "supervisor", names = {}, keep = sel.value;
    $("#filterRow").hidden = !isSup;
    sel.innerHTML = "";
    if (!isSup) return;
    state.people.forEach(function (p) { names[supOf(p) || "(no supervisor)"] = 1; });
    var o = document.createElement("option"); o.value = ""; o.textContent = "All supervisors"; sel.appendChild(o);
    Object.keys(names).sort().forEach(function (n) {
      o = document.createElement("option"); o.value = n; o.textContent = n; sel.appendChild(o);
    });
    sel.value = keep;
  }

  function renderList() {
    var box = $("#list"); box.innerHTML = "";
    fillFilter();
    var want = $("#supFilter").value;
    state.people.forEach(function (p, i) {
      if (state.kind === "supervisor" && want && (supOf(p) || "(no supervisor)") !== want) return;
      var l = document.createElement("label");
      l.className = "row";
      var cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = true; cb.dataset.i = i;
      var s = document.createElement("span");
      s.textContent = (val(p, "Employee ID") || "(no ID)") + "  -  " + (val(p, "Employee name") || "(no name)") +
        (state.kind === "supervisor" ? "   (assessed by " + (supOf(p) || "unknown") + ")" : "");
      l.appendChild(cb); l.appendChild(s); box.appendChild(l);
    });
    $("#step2").hidden = false;
    updateCount();
  }
  function selected() {
    return Array.prototype.map.call(document.querySelectorAll("#list input:checked"), function (c) { return state.people[+c.dataset.i]; });
  }
  function updateCount() { $("#count").textContent = selected().length + " of " + state.people.length + " selected"; $("#make").disabled = !selected().length; }

  function generate() {
    var chosen = selected(), kind = state.kind, btn = $("#make");
    if (!chosen.length) return;
    btn.disabled = true; setMsg("Creating documents…");
    Promise.all([loadSchema(kind), loadLogo()]).then(function (r) {
      var schema = r[0], zip = new JSZip(), done = 0;
      var chain = Promise.resolve();
      chosen.forEach(function (p) {
        chain = chain.then(function () {
          return D.Packer.toBlob(buildDoc(p, kind, schema)).then(function (b) {
            if (chosen.length === 1) { saveBlob(b, fileName(p, kind)); }
            else zip.file((kind === "supervisor" ? safe(supOf(p) || "No supervisor") + "/" : "") + fileName(p, kind), b);
            done++; setMsg("Created " + done + " of " + chosen.length + "…");
          });
        });
      });
      return chain.then(function () {
        if (chosen.length === 1) return;
        return zip.generateAsync({ type: "blob" }).then(function (z) { saveBlob(z, KINDS[kind].label + " Word files.zip"); });
      });
    }).then(function () { setMsg("Done. " + chosen.length + " document" + (chosen.length > 1 ? "s" : "") + " downloaded."); })
      .catch(function (e) { setMsg("Something went wrong: " + e.message, true); })
      .then(function () { btn.disabled = !selected().length; });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("input[name=kind]").forEach(function (r) {
      r.addEventListener("change", function () { state.kind = r.value; if (state.people.length) renderList(); });
    });
    $("#file").addEventListener("change", function (e) {
      var f = e.target.files[0];
      state.people = []; $("#step2").hidden = true; setMsg("");
      if (!f) return;
      readSheet(f).then(function (people) {
        state.people = people; renderList();
        var k = state.kind, sample = people[0];
        var isSup = Object.prototype.hasOwnProperty.call(sample, "supervisor employee id");
        if ((k === "supervisor") !== isSup) {
          setMsg("Warning: this file looks like a " + (isSup ? "Supervisor" : "Self") + " sheet, but you picked " + (k === "supervisor" ? "Supervisor" : "Self") + ". Check the form type above.", true);
        }
      }).catch(function (err) { setMsg("Could not read that file: " + err.message, true); });
    });
    $("#list").addEventListener("change", updateCount);
    $("#supFilter").addEventListener("change", renderList);
    $("#all").addEventListener("click", function () { document.querySelectorAll("#list input").forEach(function (c) { c.checked = true; }); updateCount(); });
    $("#none").addEventListener("click", function () { document.querySelectorAll("#list input").forEach(function (c) { c.checked = false; }); updateCount(); });
    $("#make").addEventListener("click", generate);
  });
})();
