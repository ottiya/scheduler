import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const pad = (n) => String(n).padStart(2, "0");
const keyOf = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const holidays = {
  "2026-05-01": "근로자의 날",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "부처님오신날 대체공휴일",
};

export default function App() {
  const [profileName, setProfileName] = useState("My schedule");
  const [editingName, setEditingName] = useState(false);
  const [month, setMonth] = useState(new Date(2026, 4, 1));
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectDraft, setProjectDraft] = useState({ title: "", start: "", end: "", type: "work" });
  const [taskDraft, setTaskDraft] = useState({ time: "10:00 AM", title: "", type: "작업" });

  const today = new Date(2026, 3, 30);
  const todayLabel = `${today.getFullYear()}.${pad(today.getMonth() + 1)}.${pad(today.getDate())} 목`;

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);

  function prevMonth() {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }

  function nextMonth() {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  function addProject() {
    if (!projectDraft.title.trim()) return;
    setProjects([...projects, { id: crypto.randomUUID(), ...projectDraft }]);
    setProjectDraft({ title: "", start: "", end: "", type: "work" });
  }

  function addTask() {
    if (!taskDraft.title.trim()) return;
    setTasks([...tasks, { id: crypto.randomUUID(), ...taskDraft }]);
    setTaskDraft({ time: "10:00 AM", title: "", type: "작업" });
  }

  return (
    <main className="min-h-screen bg-[#e9e9e3] px-2 py-5 text-[#151515] sm:px-4">
      <div className="mx-auto max-w-[1180px] space-y-4">
        <header className="flex items-center gap-4 px-2">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#f2f3ee] text-xl shadow-sm">👤</div>
          <div>
            <div className="flex items-center gap-2">
              {editingName ? (
                <input
                  autoFocus
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                  className="rounded-md bg-white px-2 py-1 text-xl font-bold outline-none"
                />
              ) : (
                <h1 className="text-xl font-bold leading-none">{profileName}</h1>
              )}
              <button onClick={() => setEditingName(true)} className="text-xs text-neutral-500">✏️ 편집</button>
            </div>
            <p className="mt-1 text-sm text-neutral-500">이름을 설정해주세요</p>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <InfoCard label="진행 프로젝트 ›" value={projects.length} />
          <InfoCard label="오늘 일정" value={tasks.length} />
          <div className="flex min-h-[102px] items-center justify-end rounded-2xl bg-[#fbfbf8] px-9 text-sm text-neutral-500 shadow-sm">
            {todayLabel}
          </div>
        </section>

        <section className="rounded-3xl bg-[#fbfbf8] px-7 py-7 shadow-sm">
          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="grid h-8 w-8 place-items-center rounded-full bg-[#e9e9e3]"><ChevronLeft size={16} /></button>
              <h2 className="text-lg font-bold">{month.getFullYear()}년 {month.getMonth() + 1}월</h2>
              <button onClick={nextMonth} className="grid h-8 w-8 place-items-center rounded-full bg-[#e9e9e3]"><ChevronRight size={16} /></button>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <button className="rounded-lg bg-[#e9e9e3] px-3 py-1.5">전체 보기</button>
              <button>프로젝트 캘린더</button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-sm">
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div key={d} className={`pb-5 font-semibold ${i === 0 ? "text-red-500" : "text-neutral-400"}`}>{d}</div>
            ))}
            {days.map((day) => {
              const inMonth = day.getMonth() === month.getMonth();
              const sunday = day.getDay() === 0;
              const holiday = holidays[keyOf(day)];
              const taskCount = tasks.length && keyOf(day) === keyOf(today) ? tasks.length : 0;
              return (
                <div key={day.toISOString()} className="min-h-[43px]">
                  <div className={`${!inMonth ? "text-neutral-300" : sunday || holiday ? "text-red-500" : "text-black"}`}>{day.getDate()}</div>
                  {taskCount > 0 && <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-lime-400" />}
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-[#e6e6de] pt-6 text-xs text-neutral-500">
            공휴일 — 1일 노동절, 5일 어린이날, 24일 부처님오신날, 25일 부처님오신날 대체공휴일
          </div>

          <div className="mt-7 grid gap-2 md:grid-cols-[1fr_96px_96px_80px_74px]">
            <input
              value={projectDraft.title}
              onChange={(e) => setProjectDraft({ ...projectDraft, title: e.target.value })}
              placeholder="프로젝트명"
              className="h-10 rounded-xl bg-[#e4e4df] px-4 text-sm outline-none placeholder:text-neutral-400"
            />
            <input
              value={projectDraft.start}
              onChange={(e) => setProjectDraft({ ...projectDraft, start: e.target.value })}
              placeholder="시작일"
              className="h-10 rounded-xl bg-[#e4e4df] px-4 text-sm outline-none placeholder:text-neutral-400"
            />
            <input
              value={projectDraft.end}
              onChange={(e) => setProjectDraft({ ...projectDraft, end: e.target.value })}
              placeholder="종료일"
              className="h-10 rounded-xl bg-[#e4e4df] px-4 text-sm outline-none placeholder:text-neutral-400"
            />
            <select
              value={projectDraft.type}
              onChange={(e) => setProjectDraft({ ...projectDraft, type: e.target.value })}
              className="h-10 rounded-xl bg-[#e4e4df] px-2 text-sm outline-none"
            >
              <option>work</option>
              <option>client</option>
              <option>to do</option>
            </select>
            <button onClick={addProject} className="h-10 rounded-xl bg-lime-400 px-4 text-sm font-bold">+ 추가</button>
          </div>

          {projects.length > 0 && (
            <div className="mt-4 space-y-2">
              {projects.map((project) => (
                <div key={project.id} className="grid gap-2 rounded-xl bg-[#eeeeea] px-4 py-3 text-sm md:grid-cols-[1fr_96px_96px_80px]">
                  <span>{project.title}</span>
                  <span className="text-neutral-500">{project.start || "-"}</span>
                  <span className="text-neutral-500">{project.end || "-"}</span>
                  <span>{project.type}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-[#fbfbf8] px-7 py-7 shadow-sm">
          <p className="mb-7 text-xs font-semibold text-neutral-400">오늘 일정</p>
          {tasks.length === 0 ? (
            <p className="mb-6 text-sm text-neutral-500">오늘 일정이 없어요</p>
          ) : (
            <div className="mb-5 space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="grid gap-2 rounded-xl bg-[#eeeeea] px-4 py-3 text-sm md:grid-cols-[90px_1fr_80px]">
                  <span>{task.time}</span>
                  <span>{task.title}</span>
                  <span>{task.type}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-[110px_1fr_56px_72px]">
            <input
              value={taskDraft.time}
              onChange={(e) => setTaskDraft({ ...taskDraft, time: e.target.value })}
              className="h-10 rounded-xl bg-[#e4e4df] px-4 text-sm outline-none"
            />
            <input
              value={taskDraft.title}
              onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })}
              placeholder="일정 제목"
              className="h-10 rounded-xl bg-[#e4e4df] px-4 text-sm outline-none placeholder:text-neutral-400"
            />
            <select
              value={taskDraft.type}
              onChange={(e) => setTaskDraft({ ...taskDraft, type: e.target.value })}
              className="h-10 rounded-xl bg-[#e4e4df] px-2 text-sm outline-none"
            >
              <option>작업</option>
              <option>미팅</option>
              <option>마감</option>
              <option>약속</option>
            </select>
            <button onClick={addTask} className="h-10 rounded-xl bg-lime-400 px-4 text-sm font-bold">추가</button>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="min-h-[102px] rounded-2xl bg-[#fbfbf8] px-6 py-5 shadow-sm">
      <p className="text-xs font-semibold text-neutral-400">{label}</p>
      <p className="mt-2 text-4xl font-light">{value}</p>
    </div>
  );
}
