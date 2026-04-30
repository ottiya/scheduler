import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Edit3, Plus, Save, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const taskTypes = ["작업", "미팅", "마감", "약속", "할일"];
const projectTypes = ["work", "client", "to do"];

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function todayKey() {
  return dateKey(new Date());
}

export default function ScheduleClone() {
  const [profile, setProfile] = useState({ name: "이름을 설정해주세요", bio: "", photo: "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [activeTab, setActiveTab] = useState("전체 보기");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [saved, setSaved] = useState(true);

  const todayTasks = tasks.filter((task) => task.date === todayKey());
  const activeProjects = projects.filter((project) => project.status !== "done");

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 35 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [currentDate]);

  function addProject() {
    setProjects((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        title: "새 프로젝트",
        type: "work",
        start: todayKey(),
        end: todayKey(),
        status: "active",
      },
    ]);
    setSaved(false);
  }

  function addTask(type = "작업") {
    setTasks((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        title: `${type} 추가`,
        type,
        date: todayKey(),
      },
    ]);
    setSaved(false);
  }

  function updateProject(id, field, value) {
    setProjects((items) => items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    setSaved(false);
  }

  function updateTask(id, field, value) {
    setTasks((items) => items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    setSaved(false);
  }

  function saveAll() {
    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-4 text-neutral-900">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-neutral-200">
                {profile.photo ? <img src={profile.photo} alt="profile" className="h-full w-full object-cover" /> : <User />}
              </div>
              <div>
                <p className="text-sm text-neutral-500">My schedule</p>
                <h1 className="text-2xl font-bold">{profile.name || "이름을 설정해주세요"}</h1>
                {profile.bio && <p className="mt-1 text-sm text-neutral-500">{profile.bio}</p>}
              </div>
            </div>
            <button onClick={() => setEditingProfile(true)} className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white">
              <Edit3 size={16} /> 편집
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <button onClick={() => setShowProjects(true)} className="rounded-[2rem] bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-neutral-500">
              <span>진행 프로젝트</span>
              <span>›</span>
            </div>
            <p className="mt-4 text-5xl font-bold">{activeProjects.length}</p>
          </button>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-neutral-500">오늘 일정</p>
            <p className="mt-4 text-5xl font-bold">{todayTasks.length}</p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="rounded-full bg-neutral-100 p-2">
                <ChevronLeft size={18} />
              </button>
              <div className="font-semibold">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</div>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="rounded-full bg-neutral-100 p-2">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}
              {calendarDays.map((day) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const count = tasks.filter((task) => task.date === dateKey(day)).length;
                return (
                  <div key={day.toISOString()} className={`rounded-xl p-2 ${isCurrentMonth ? "bg-neutral-50" : "text-neutral-300"}`}>
                    <div>{day.getDate()}</div>
                    {count > 0 && <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-neutral-900" />}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-full bg-neutral-100 p-1 text-sm">
              {["전체 보기", "프로젝트", "캘린더"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 ${activeTab === tab ? "bg-white shadow-sm" : "text-neutral-500"}`}>
                  {tab}
                </button>
              ))}
            </div>
            <button onClick={saveAll} className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm text-green-700">
              <Save size={16} /> {saved ? "저장됨 ✓" : "저장"}
            </button>
          </div>

          {activeTab !== "캘린더" && (
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_130px_130px_110px_80px] gap-2 px-3 text-xs text-neutral-500 max-md:hidden">
                <span>프로젝트</span><span>시작일</span><span>종료일</span><span>분류</span><span></span>
              </div>
              {projects.map((project) => (
                <div key={project.id} className="grid gap-2 rounded-2xl bg-neutral-50 p-3 md:grid-cols-[1fr_130px_130px_110px_80px]">
                  <input value={project.title} onChange={(e) => updateProject(project.id, "title", e.target.value)} className="rounded-xl border bg-white px-3 py-2" />
                  <input type="date" value={project.start} onChange={(e) => updateProject(project.id, "start", e.target.value)} className="rounded-xl border bg-white px-3 py-2" />
                  <input type="date" value={project.end} onChange={(e) => updateProject(project.id, "end", e.target.value)} className="rounded-xl border bg-white px-3 py-2" />
                  <select value={project.type} onChange={(e) => updateProject(project.id, "type", e.target.value)} className="rounded-xl border bg-white px-3 py-2">
                    {projectTypes.map((type) => <option key={type}>{type}</option>)}
                  </select>
                  <button onClick={() => setProjects((items) => items.filter((item) => item.id !== project.id))} className="rounded-xl bg-white px-3 py-2 text-sm">삭제</button>
                </div>
              ))}
              <button onClick={addProject} className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white">
                <Plus size={16} /> 추가
              </button>
            </div>
          )}

          {activeTab !== "프로젝트" && (
            <div className="mt-6 space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-bold"><CalendarDays size={20} /> 오늘 일정</h2>
              <div className="flex flex-wrap gap-2">
                {taskTypes.map((type) => (
                  <button key={type} onClick={() => addTask(type)} className="rounded-full bg-neutral-100 px-4 py-2 text-sm">{type} 추가</button>
                ))}
              </div>
              {tasks.map((task) => (
                <div key={task.id} className="grid gap-2 rounded-2xl bg-neutral-50 p-3 md:grid-cols-[120px_1fr_150px_80px]">
                  <select value={task.type} onChange={(e) => updateTask(task.id, "type", e.target.value)} className="rounded-xl border bg-white px-3 py-2">
                    {taskTypes.map((type) => <option key={type}>{type}</option>)}
                  </select>
                  <input value={task.title} onChange={(e) => updateTask(task.id, "title", e.target.value)} className="rounded-xl border bg-white px-3 py-2" />
                  <input type="date" value={task.date} onChange={(e) => updateTask(task.id, "date", e.target.value)} className="rounded-xl border bg-white px-3 py-2" />
                  <button onClick={() => setTasks((items) => items.filter((item) => item.id !== task.id))} className="rounded-xl bg-white px-3 py-2 text-sm">삭제</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {editingProfile && (
          <Modal title="프로필 편집" onClose={() => setEditingProfile(false)}>
            <label className="space-y-1 text-sm"><span>이름</span><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full rounded-xl border px-3 py-2" /></label>
            <label className="space-y-1 text-sm"><span>소개</span><textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="h-24 w-full rounded-xl border px-3 py-2" /></label>
            <label className="space-y-1 text-sm"><span>프로필 사진</span><input placeholder="이미지 URL 붙여넣기" value={profile.photo} onChange={(e) => setProfile({ ...profile, photo: e.target.value })} className="w-full rounded-xl border px-3 py-2" /></label>
            <div className="flex justify-end gap-2"><button onClick={() => setEditingProfile(false)} className="rounded-full bg-neutral-100 px-4 py-2">취소</button><button onClick={() => setEditingProfile(false)} className="rounded-full bg-neutral-900 px-4 py-2 text-white">저장</button></div>
          </Modal>
        )}

        {showProjects && (
          <Modal title="진행 중 프로젝트" onClose={() => setShowProjects(false)}>
            {activeProjects.length === 0 ? <p className="text-neutral-500">진행 중인 프로젝트가 없습니다.</p> : activeProjects.map((project) => <div key={project.id} className="rounded-2xl bg-neutral-50 p-3"><b>{project.title}</b><p className="text-sm text-neutral-500">{project.start} - {project.end} · {project.type}</p></div>)}
          </Modal>
        )}
      </AnimatePresence>
    </main>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-xl" initial={{ y: 20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.98 }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full bg-neutral-100 p-2"><X size={18} /></button>
        </div>
        <div className="space-y-3">{children}</div>
      </motion.div>
    </motion.div>
  );
}
