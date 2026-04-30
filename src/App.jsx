import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";

// Helper for date formatting
const pad = (n) => String(n).padStart(2, "0");
const keyOf = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Expanded 2026 Korean Holidays
const holidays = {
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "대체공휴일",
  "2026-05-01": "근로자의 날",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "대체공휴일",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
};

export default function App() {
  const [profileName, setProfileName] = useState("My schedule");
  const [editingName, setEditingName] = useState(false);
  const [month, setMonth] = useState(new Date(2026, 4, 1)); // May 2026
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 30)); // Default April 30
  
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState({}); // Organized by date key: { "YYYY-MM-DD": [...] }
  
  const [projectDraft, setProjectDraft] = useState({ title: "", start: "", end: "", type: "work" });
  const [taskDraft, setTaskDraft] = useState({ time: "10:00 AM", title: "", type: "작업" });

  const selectedDateKey = keyOf(selectedDate);
  const currentTasks = tasks[selectedDateKey] || [];

  // Generate Calendar Grid
  const days = useMemo(() => {
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(firstDayOfMonth);
    start.setDate(1 - firstDayOfMonth.getDay());
    
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);

  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  const addProject = () => {
    if (!projectDraft.title.trim()) return;
    setProjects([...projects, { id: crypto.randomUUID(), ...projectDraft }]);
    setProjectDraft({ title: "", start: "", end: "", type: "work" });
  };

  const addTask = () => {
    if (!taskDraft.title.trim()) return;
    const newTasks = { ...tasks };
    if (!newTasks[selectedDateKey]) newTasks[selectedDateKey] = [];
    
    newTasks[selectedDateKey].push({ id: crypto.randomUUID(), ...taskDraft });
    setTasks(newTasks);
    setTaskDraft({ ...taskDraft, title: "" });
  };

  return (
    <main className="min-h-screen bg-[#e9e9e3] px-2 py-5 text-[#151515] sm:px-4">
      <div className="mx-auto max-w-[1180px] space-y-4">
        
        {/* Header Section */}
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
              <button onClick={() => setEditingName(true)} className="flex items-center gap-1 text-xs text-neutral-500">
                <Pencil size={12} /> 편집
              </button>
            </div>
            <p className="mt-1 text-sm text-neutral-500">이름을 설정해주세요</p>
          </div>
        </header>

        {/* Dashboard Cards */}
        <section className="grid gap-3 md:grid-cols-3">
          <InfoCard label="진행 프로젝트 ›" value={projects.length} />
          <InfoCard label="선택한 날 일정" value={currentTasks.length} />
          <div className="flex min-h-[102px] items-center justify-end rounded-2xl bg-[#fbfbf8] px-9 text-sm text-neutral-500 shadow-sm font-medium">
            {selectedDateKey.replace(/-/g, ".")} {["일", "월", "화", "수", "목", "금", "토"][selectedDate.getDay()]}
          </div>
        </section>

        {/* Calendar Section */}
        <section className="rounded-3xl bg-[#fbfbf8] px-7 py-7 shadow-sm">
          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="grid h-8 w-8 place-items-center rounded-full bg-[#e9e9e3] hover:bg-neutral-300 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-lg font-bold">{month.getFullYear()}년 {month.getMonth() + 1}월</h2>
              <button onClick={nextMonth} className="grid h-8 w-8 place-items-center rounded-full bg-[#e9e9e3] hover:bg-neutral-300 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <button className="rounded-lg bg-[#e9e9e3] px-3 py-1.5 font-semibold text-black">전체 보기</button>
              <button className="hover:underline">프로젝트 캘린더</button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-sm">
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div key={d} className={`pb-5 font-semibold ${i === 0 ? "text-red-500" : "text-neutral-400"}`}>{d}</div>
            ))}
            {days.map((day) => {
              const dateKey = keyOf(day);
              const isSelected = dateKey === selectedDateKey;
              const inMonth = day.getMonth() === month.getMonth();
              const isSunday = day.getDay() === 0;
              const holidayName = holidays[dateKey];
              const hasTasks = tasks[dateKey]?.length > 0;

              return (
                <button 
                  key={day.toISOString()} 
                  onClick={() => setSelectedDate(new Date(day))}
                  className={`relative min-h-[50px] transition-all rounded-xl hover:bg-neutral-50 ${isSelected ? "bg-white ring-1 ring-neutral-200 shadow-sm" : ""}`}
                >
                  <div className={`
                    ${!inMonth ? "text-neutral-300" : (isSunday || holidayName) ? "text-red-500 font-bold" : "text-black"}
                    ${isSelected ? "underline decoration-2" : ""}
                  `}>
                    {day.getDate()}
                  </div>
                  {hasTasks && <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-lime-400" />}
                </button>
              );
            })}
          </div>

          {/* Holiday Footer */}
          <div className="mt-6 border-t border-[#e6e6de] pt-6 text-xs text-neutral-500">
            공휴일 — {Object.entries(holidays)
              .filter(([key]) => key.startsWith(keyOf(month).substring(0, 7)))
              .map(([key, name]) => `${parseInt(key.split('-')[2])}일 ${name}`).join(", ")}
          </div>

          {/* Project Input Section */}
          <div className="mt-7 grid gap-2 md:grid-cols-[1fr_96px_96px_80px_74px]">
            <input
              value={projectDraft.title}
              onChange={(e) => setProjectDraft({ ...projectDraft, title: e.target.value })}
              placeholder="프로젝트명"
              className="h-10 rounded-xl bg-[#e4e4df] px-4 text-sm outline-none"
            />
            <input
              value={projectDraft.start}
              onChange={(e) => setProjectDraft({ ...projectDraft, start: e.target.value })}
              placeholder="시작일"
              className="h-10 rounded-xl bg-[#e4e4df] px-4 text-sm outline-none"
            />
            <input
              value={projectDraft.end}
              onChange={(e) => setProjectDraft({ ...projectDraft, end: e.target.value })}
              placeholder="종료일"
              className="h-10 rounded-xl bg-[#e4e4df] px-4 text-sm outline-none"
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
            <button onClick={addProject} className="h-10 rounded-xl bg-lime-400 px-4 text-sm font-bold hover:bg-lime-500 transition-colors">+ 추가</button>
          </div>
        </section>

        {/* Task List Section */}
        <section className="rounded-3xl bg-[#fbfbf8] px-7 py-7 shadow-sm">
          <p className="mb-7 text-xs font-semibold text-neutral-400 uppercase tracking-wider">오늘 일정 ({selectedDateKey})</p>
          
          {currentTasks.length === 0 ? (
            <p className="mb-6 text-sm text-neutral-500 italic">등록된 일정이 없습니다.</p>
          ) : (
            <div className="mb-5 space-y-2">
              {currentTasks.map((task) => (
                <div key={task.id} className="grid gap-2 rounded-xl bg-[#eeeeea] px-4 py-3 text-sm md:grid-cols-[90px_1fr_80px] items-center">
                  <span className="font-medium">{task.time}</span>
                  <span className="text-neutral-700">{task.title}</span>
                  <span className="text-xs bg-white/50 w-fit px-2 py-1 rounded-md text-center">{task.type}</span>
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
              className="h-10 rounded-xl bg-[#e4e4df] px-4 text-sm outline-none"
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
            <button onClick={addTask} className="h-10 rounded-xl bg-lime-400 px-4 text-sm font-bold hover:bg-lime-500 transition-colors">추가</button>
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
