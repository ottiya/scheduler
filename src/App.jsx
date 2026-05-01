import { useState, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const KR_HOLIDAYS = {
  "2026-01-01": "신정", "2026-03-01": "삼일절", "2026-05-01": "근로자의 날",
  "2026-05-05": "어린이날", "2026-05-24": "부처님오신날", "2026-05-25": "부처님오신날 대체공휴일",
  "2026-06-06": "현충일", "2026-08-15": "광복절", "2026-09-24": "추석",
  "2026-09-25": "추석", "2026-09-26": "추석", "2026-10-03": "개천절",
  "2026-10-09": "한글날", "2026-12-25": "크리스마스",
};

const PALETTE = [
  { bg: "#E6F1FB", text: "#185FA5", name: "blue" },
  { bg: "#EAF3DE", text: "#3B6D11", name: "green" },
  { bg: "#FAEEDA", text: "#854F0B", name: "amber" },
  { bg: "#EEEDFE", text: "#534AB7", name: "purple" },
  { bg: "#FAECE7", text: "#993C1D", name: "coral" },
  { bg: "#FBEAF0", text: "#993556", name: "pink" },
  { bg: "#E1F5EE", text: "#0F6E56", name: "teal" },
  { bg: "#F1EFE8", text: "#5F5E5A", name: "gray" },
];

const DEFAULT_CATEGORIES = [
  { id: "work", label: "Work", colorIdx: 6 },
  { id: "dev", label: "Development", colorIdx: 1 },
  { id: "meeting", label: "Meeting", colorIdx: 2 },
  { id: "song", label: "Songwriting", colorIdx: 3 },
];

const STORAGE_KEY = "freelancer_scheduler_v2";

const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const fmt = (d) => d.toISOString().split("T")[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(p) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  if (p.progress >= 100) return "done";
  if (p.endDate && new Date(p.endDate) < now) return "overdue";
  return "inprogress";
}

function getCat(categories, id) {
  return categories.find((c) => c.id === id) || { id, label: id, colorIdx: 7 };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CatBadge({ categories, id }) {
  const cat = getCat(categories, id);
  const pal = PALETTE[cat.colorIdx] || PALETTE[7];
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 500,
      background: pal.bg, color: pal.text, whiteSpace: "nowrap",
    }}>
      {cat.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    done: { bg: "#EAF3DE", text: "#3B6D11", label: "완료 Done" },
    overdue: { bg: "#FCEBEB", text: "#A32D2D", label: "지연 Overdue" },
    inprogress: { bg: "#E6F1FB", text: "#185FA5", label: "진행중 In Progress" },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 500, background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function PayBadge({ payment }) {
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 500,
      background: payment === "paid" ? "#EAF3DE" : "#FAEEDA",
      color: payment === "paid" ? "#3B6D11" : "#854F0B",
    }}>
      {payment === "paid" ? "결제완료 Paid" : "미납 Unpaid"}
    </span>
  );
}

function CatSelect({ id, categories, value, onChange, style = {} }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} style={{ height: 36, padding: "0 10px", borderRadius: 8, border: "0.5px solid #ccc", fontSize: 14, background: "white", ...style }}>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>{c.label}</option>
      ))}
    </select>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

function CalendarTab({ projects, schedules, categories }) {
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);

  const changeMonth = (d) => {
    setViewMonth((m) => {
      let nm = m + d;
      if (nm > 11) { setViewYear((y) => y + 1); return 0; }
      if (nm < 0) { setViewYear((y) => y - 1); return 11; }
      return nm;
    });
  };

  const months_kr = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const first = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
  const totalCells = Math.ceil((first + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    let day, curY = viewYear, curM = viewMonth, other = false;
    if (i < first) { day = daysInPrev - first + i + 1; curM = viewMonth - 1; if (curM < 0) { curM = 11; curY = viewYear - 1; } other = true; }
    else if (i >= first + daysInMonth) { day = i - first - daysInMonth + 1; curM = viewMonth + 1; if (curM > 11) { curM = 0; curY = viewYear + 1; } other = true; }
    else { day = i - first + 1; }
    const dateStr = `${curY}-${String(curM + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isSun = i % 7 === 0;
    const isToday = dateStr === todayStr;
    const holiday = KR_HOLIDAYS[dateStr];
    const projs = projects.filter((p) => p.startDate <= dateStr && p.endDate >= dateStr);
    cells.push({ day, dateStr, isSun, isToday, holiday, projs, other });
  }

  const selProjects = selected ? projects.filter((p) => p.startDate <= selected && p.endDate >= selected) : [];
  const selSchedules = selected ? schedules.filter((s) => s.date === selected).sort((a, b) => a.time.localeCompare(b.time)) : [];

  return (
    <div>
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={() => changeMonth(-1)} style={S.navBtn}>◀</button>
          <span style={{ fontSize: 16, fontWeight: 500 }}>{viewYear}년 {months_kr[viewMonth]}</span>
          <button onClick={() => changeMonth(1)} style={S.navBtn}>▶</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 2 }}>
          {["일","월","화","수","목","금","토"].map((h) => (
            <div key={h} style={{ textAlign: "center", fontSize: 12, color: "#888", padding: 4 }}>{h}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {cells.map(({ day, dateStr, isSun, isToday, holiday, projs, other }) => (
            <div key={dateStr} onClick={() => setSelected(dateStr)}
              style={{ minHeight: 52, borderRadius: 6, padding: 4, cursor: "pointer", opacity: other ? 0.3 : 1, background: selected === dateStr ? "#f0f0f0" : "transparent" }}>
              {isToday
                ? <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1a1a1a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{day}</div>
                : <div style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: (isSun || holiday) ? "#E24B4A" : "inherit" }}>{day}</div>
              }
              {holiday && !other && <div style={{ fontSize: 9, color: "#E24B4A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{holiday}</div>}
              {projs.slice(0, 3).map((p) => {
                const st = getStatus(p);
                return <div key={p.id} style={{ width: 6, height: 6, borderRadius: "50%", margin: "1px auto", background: st === "done" ? "#639922" : st === "overdue" ? "#E24B4A" : "#378ADD" }} />;
              })}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          {[["#378ADD","In progress"],["#639922","Done"],["#E24B4A","Overdue"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#888" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />{l}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#888", marginBottom: 8 }}>
            {new Date(selected + "T00:00:00").toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
          </div>
          {selProjects.length === 0 && selSchedules.length === 0
            ? <div style={{ textAlign: "center", color: "#888", fontSize: 14, padding: "1rem" }}>이날 일정이 없어요</div>
            : <>
              {selProjects.map((p) => (
                <div key={p.id} style={{ fontSize: 13, padding: "4px 0", borderBottom: "0.5px solid #eee", display: "flex", gap: 8, alignItems: "center" }}>
                  <CatBadge categories={categories} id={p.category} />
                  <strong>{p.name}</strong>
                  <span style={{ color: "#888" }}>{p.client || ""}</span>
                  <span>— {p.progress}%</span>
                </div>
              ))}
              {selSchedules.map((s) => (
                <div key={s.id} style={{ fontSize: 13, padding: "4px 0", borderBottom: "0.5px solid #eee", display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#888" }}>{s.time}</span>
                  <CatBadge categories={categories} id={s.category} />
                  {s.title}
                </div>
              ))}
            </>
          }
        </div>
      )}
    </div>
  );
}

// ─── Projects Tab ─────────────────────────────────────────────────────────────

function ProjectsTab({ projects, setProjects, categories }) {
  const [form, setForm] = useState({ name: "", client: "", category: categories[0]?.id || "", startDate: fmt(today), endDate: fmt(today), progress: 0, payment: "unpaid" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const add = () => {
    if (!form.name.trim()) return;
    setProjects((prev) => [...prev, { ...form, id: Date.now(), progress: Math.min(100, Math.max(0, parseInt(form.progress) || 0)) }]);
    setForm((f) => ({ ...f, name: "", client: "", progress: 0 }));
  };

  const remove = (id) => setProjects((prev) => prev.filter((p) => p.id !== id));
  const togglePay = (id) => setProjects((prev) => prev.map((p) => p.id === id ? { ...p, payment: p.payment === "paid" ? "unpaid" : "paid" } : p));

  const startEdit = (p) => { setEditingId(p.id); setEditForm({ ...p }); };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = () => {
    setProjects((prev) => prev.map((p) => p.id === editingId ? { ...editForm, progress: Math.min(100, Math.max(0, parseInt(editForm.progress) || 0)) } : p));
    setEditingId(null);
  };

  return (
    <div>
      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>프로젝트 추가 / Add project</div>
        <div style={S.formRow}>
          <label style={S.fg}>
            <span style={S.label}>Project name</span>
            <input style={S.input} placeholder="Client website..." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label style={S.fg}>
            <span style={S.label}>Client</span>
            <input style={{ ...S.input, width: 130 }} placeholder="Client name" value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} />
          </label>
          <label style={S.fg}>
            <span style={S.label}>Category</span>
            <CatSelect categories={categories} value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
          </label>
        </div>
        <div style={S.formRow}>
          <label style={S.fg}>
            <span style={S.label}>Start date</span>
            <input type="date" style={{ ...S.input, width: 150 }} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </label>
          <label style={S.fg}>
            <span style={S.label}>End date</span>
            <input type="date" style={{ ...S.input, width: 150 }} value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </label>
          <label style={S.fg}>
            <span style={S.label}>Progress %</span>
            <input type="number" style={{ ...S.input, width: 70 }} min={0} max={100} value={form.progress} onChange={(e) => setForm((f) => ({ ...f, progress: e.target.value }))} />
          </label>
          <label style={S.fg}>
            <span style={S.label}>Payment</span>
            <select style={S.input} value={form.payment} onChange={(e) => setForm((f) => ({ ...f, payment: e.target.value }))}>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <button style={S.btnAdd} onClick={add}>+ 추가</button>
        </div>
      </div>

      {projects.length === 0
        ? <div style={{ textAlign: "center", color: "#888", fontSize: 14, padding: "2rem" }}>프로젝트가 없어요. 위에서 추가해보세요!</div>
        : projects.map((p) => {
          const st = getStatus(p);
          const isEd = editingId === p.id;
          return (
            <div key={p.id} style={{ border: "0.5px solid #e5e5e5", borderRadius: 12, padding: "1rem", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{p.client || "—"} · {p.startDate || "?"} ~ {p.endDate || "?"}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <CatBadge categories={categories} id={p.category} />
                  <StatusBadge status={st} />
                  <PayBadge payment={p.payment} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 5 }}>
                  <div style={{ width: `${p.progress}%`, height: 5, borderRadius: 4, background: st === "done" ? "#639922" : st === "overdue" ? "#E24B4A" : "#378ADD" }} />
                </div>
                <span style={{ fontSize: 12, color: "#888" }}>{p.progress}%</span>
              </div>

              {isEd && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, paddingTop: 12, borderTop: "0.5px solid #eee", alignItems: "flex-end" }}>
                  {[
                    ["Name", <input style={S.inputSm} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />],
                    ["Client", <input style={S.inputSm} value={editForm.client || ""} onChange={(e) => setEditForm((f) => ({ ...f, client: e.target.value }))} />],
                    ["Category", <CatSelect categories={categories} value={editForm.category} onChange={(v) => setEditForm((f) => ({ ...f, category: v }))} style={{ height: 30, fontSize: 13 }} />],
                    ["Start", <input type="date" style={{ ...S.inputSm, width: 150 }} value={editForm.startDate || ""} onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))} />],
                    ["End", <input type="date" style={{ ...S.inputSm, width: 150 }} value={editForm.endDate || ""} onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))} />],
                    ["Progress %", <input type="number" style={{ ...S.inputSm, width: 65 }} min={0} max={100} value={editForm.progress} onChange={(e) => setEditForm((f) => ({ ...f, progress: e.target.value }))} />],
                    ["Payment", <select style={{ ...S.inputSm }} value={editForm.payment} onChange={(e) => setEditForm((f) => ({ ...f, payment: e.target.value }))}><option value="unpaid">Unpaid</option><option value="paid">Paid</option></select>],
                  ].map(([lbl, el]) => (
                    <label key={lbl} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: 11, color: "#888" }}>{lbl}</span>
                      {el}
                    </label>
                  ))}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={S.btnSave} onClick={saveEdit}>Save</button>
                    <button style={S.btnSm} onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {!isEd && <button style={{ ...S.btnSm, color: "#185FA5", borderColor: "#B5D4F4" }} onClick={() => startEdit(p)}>Edit</button>}
                <button style={S.btnSm} onClick={() => togglePay(p.id)}>{p.payment === "paid" ? "Mark unpaid" : "Mark paid"}</button>
                <button style={{ ...S.btnSm, color: "#A32D2D", borderColor: "#F7C1C1" }} onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          );
        })}
    </div>
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────

function ScheduleTab({ schedules, setSchedules, categories }) {
  const [form, setForm] = useState({ date: fmt(today), time: "10:00", title: "", category: categories[0]?.id || "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const add = () => {
    if (!form.title.trim() || !form.date) return;
    setSchedules((prev) => [...prev, { ...form, id: Date.now() }]);
    setForm((f) => ({ ...f, title: "" }));
  };

  const remove = (id) => setSchedules((prev) => prev.filter((s) => s.id !== id));
  const startEdit = (s) => { setEditingId(s.id); setEditForm({ ...s }); };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = () => {
    setSchedules((prev) => prev.map((s) => s.id === editingId ? { ...editForm } : s));
    setEditingId(null);
  };

  const grouped = {};
  schedules.forEach((s) => { if (!grouped[s.date]) grouped[s.date] = []; grouped[s.date].push(s); });
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div>
      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>일정 추가 / Add task</div>
        <div style={S.formRow}>
          <label style={S.fg}><span style={S.label}>Date</span><input type="date" style={{ ...S.input, width: 150 }} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></label>
          <label style={S.fg}><span style={S.label}>Time</span><input type="time" style={{ ...S.input, width: 110 }} value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></label>
          <label style={{ ...S.fg, flex: 1, minWidth: 140 }}><span style={S.label}>Title</span><input style={S.input} placeholder="Task title..." value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></label>
          <label style={S.fg}><span style={S.label}>Category</span><CatSelect categories={categories} value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} /></label>
          <button style={S.btnAdd} onClick={add}>+ 추가</button>
        </div>
      </div>

      {schedules.length === 0
        ? <div style={{ textAlign: "center", color: "#888", fontSize: 14, padding: "2rem" }}>일정이 없어요. 위에서 추가해보세요!</div>
        : sortedDates.map((date) => {
          const d = new Date(date + "T00:00:00");
          const label = d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
          const items = grouped[date].sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={date} style={S.card}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#888", marginBottom: 8 }}>{label}</div>
              {items.map((s) => {
                const isEd = editingId === s.id;
                return (
                  <div key={s.id} style={{ borderBottom: "0.5px solid #eee", paddingBottom: 8, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "#888", minWidth: 60 }}>{s.time}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{s.title}</div>
                        <div style={{ marginTop: 2 }}><CatBadge categories={categories} id={s.category} /></div>
                      </div>
                      {!isEd && <button style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 13 }} onClick={() => startEdit(s)}>✎</button>}
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 13 }} onClick={() => remove(s.id)}>✕</button>
                    </div>
                    {isEd && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, paddingTop: 8, borderTop: "0.5px solid #eee", alignItems: "flex-end" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 11, color: "#888" }}>Title</span><input style={{ ...S.inputSm, width: 180 }} value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} /></label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 11, color: "#888" }}>Date</span><input type="date" style={{ ...S.inputSm, width: 150 }} value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} /></label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 11, color: "#888" }}>Time</span><input type="time" style={{ ...S.inputSm, width: 110 }} value={editForm.time} onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))} /></label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 11, color: "#888" }}>Category</span><CatSelect categories={categories} value={editForm.category} onChange={(v) => setEditForm((f) => ({ ...f, category: v }))} style={{ height: 30, fontSize: 13 }} /></label>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={S.btnSave} onClick={saveEdit}>Save</button>
                          <button style={S.btnSm} onClick={cancelEdit}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab({ categories, setCategories }) {
  const [newName, setNewName] = useState("");
  const [colorIdx, setColorIdx] = useState(0);

  const add = () => {
    if (!newName.trim()) return;
    setCategories((prev) => [...prev, { id: "cat_" + Date.now(), label: newName.trim(), colorIdx }]);
    setNewName("");
  };

  const remove = (id) => {
    if (categories.length <= 1) { alert("Need at least one category."); return; }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div style={S.card}>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>카테고리 관리 / Manage categories</div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Changes apply to both projects and tasks. Deleting a category keeps existing items tagged.</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {categories.map((c) => {
          const pal = PALETTE[c.colorIdx] || PALETTE[7];
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${pal.bg}`, borderRadius: 20, padding: "4px 10px", background: pal.bg }}>
              <span style={{ fontSize: 13, color: pal.text }}>{c.label}</span>
              <button onClick={() => remove(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: pal.text, fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, color: "#888", marginBottom: 8 }}>Add new category</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input style={{ ...S.input, width: 180 }} placeholder="Category name..." maxLength={24} value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button style={S.btnAdd} onClick={add}>+ Add</button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {PALETTE.map((p, i) => (
          <div key={i} onClick={() => setColorIdx(i)} style={{
            width: 22, height: 22, borderRadius: "50%", background: p.bg,
            cursor: "pointer", border: colorIdx === i ? `2px solid ${p.text}` : "2px solid transparent",
          }} title={p.name} />
        ))}
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const S = {
  card: { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1rem" },
  formRow: { display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginBottom: "1rem" },
  fg: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, color: "#888" },
  input: { height: 36, padding: "0 10px", borderRadius: 8, border: "0.5px solid #ccc", fontSize: 14, background: "white", color: "#1a1a1a" },
  inputSm: { height: 30, padding: "0 8px", borderRadius: 8, border: "0.5px solid #ccc", fontSize: 13, background: "white", color: "#1a1a1a" },
  btnAdd: { height: 36, padding: "0 16px", borderRadius: 8, background: "#b5f23d", border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", color: "#1a1a1a", whiteSpace: "nowrap" },
  btnSm: { fontSize: 12, padding: "4px 12px", borderRadius: 4, border: "0.5px solid #ccc", background: "none", cursor: "pointer", color: "#1a1a1a" },
  btnSave: { height: 30, padding: "0 14px", borderRadius: 8, background: "#b5f23d", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#1a1a1a" },
  navBtn: { background: "none", border: "0.5px solid #e5e5e5", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 14, color: "#1a1a1a" },
};

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [userName, setUserName] = useState("");
  const [projects, setProjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [activeTab, setActiveTab] = useState("calendar");
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.userName) setUserName(d.userName);
        if (d.projects) setProjects(d.projects);
        if (d.schedules) setSchedules(d.schedules);
        if (d.categories) setCategories(d.categories);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userName, projects, schedules, categories }));
    } catch (e) {}
  }, [userName, projects, schedules, categories, loaded]);

  const activeProjects = projects.filter((p) => getStatus(p) === "inprogress").length;
  const todayTasks = schedules.filter((s) => s.date === todayStr).length;
  const unpaidCount = projects.filter((p) => p.payment === "unpaid").length;

  const tabs = ["calendar", "projects", "schedule", "categories"];
  const tabLabels = { calendar: "Calendar", projects: "Projects", schedule: "Schedule", categories: "Categories" };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "system-ui, -apple-system, sans-serif", color: "#1a1a1a" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{userName || "My Schedule"}</h1>
          <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
            {today.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
          </div>
        </div>
        <input
          placeholder="Enter your name..."
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          style={{ fontSize: 13, height: 30, padding: "0 10px", borderRadius: 8, border: "0.5px solid #ccc", background: "#fff", color: "#1a1a1a" }}
        />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: "1.5rem" }}>
        {[["진행 프로젝트 / Active", activeProjects], ["오늘 일정 / Today", todayTasks], ["미납 / Unpaid", unpaidCount]].map(([lbl, val]) => (
          <div key={lbl} style={{ background: "#f5f5f5", borderRadius: 8, padding: "1rem" }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{lbl}</div>
            <div style={{ fontSize: 24, fontWeight: 500 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid #e5e5e5", marginBottom: "1.5rem" }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: "8px 16px", fontSize: 14, cursor: "pointer", border: "none", background: "none",
            color: activeTab === t ? "#1a1a1a" : "#888",
            borderBottom: activeTab === t ? "2px solid #1a1a1a" : "2px solid transparent",
            fontWeight: activeTab === t ? 500 : 400, marginBottom: -1,
          }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* Panels */}
      {activeTab === "calendar" && <CalendarTab projects={projects} schedules={schedules} categories={categories} />}
      {activeTab === "projects" && <ProjectsTab projects={projects} setProjects={setProjects} categories={categories} />}
      {activeTab === "schedule" && <ScheduleTab schedules={schedules} setSchedules={setSchedules} categories={categories} />}
      {activeTab === "categories" && <CategoriesTab categories={categories} setCategories={setCategories} />}
    </div>
  );
}
