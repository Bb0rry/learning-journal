import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Plus, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/button";
import { Input, Select, Textarea } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import type { LearningTask, TaskInput } from "../types";

function tagList(value: string) {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function PlanPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => api.tasks() });
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const tags = useQuery({ queryKey: ["tags"], queryFn: api.tags });

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [taskTags, setTaskTags] = useState("");
  const [completing, setCompleting] = useState<LearningTask | null>(null);

  const activeTasks = useMemo(() => (tasks.data ?? []).filter((task) => task.status !== "completed"), [tasks.data]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["entries"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["tags"] });
  };

  const create = useMutation({
    mutationFn: (input: TaskInput) => api.createTask(input),
    onSuccess: () => {
      toast.success(t("taskCreated"));
      setTitle("");
      setTaskTags("");
      refresh();
    },
    onError: (error) => toast.error(error.message)
  });

  const remove = useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => {
      toast.success(t("taskDeleted"));
      refresh();
    },
    onError: (error) => toast.error(error.message)
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      toast.error(t("taskRequired"));
      return;
    }
    create.mutate({
      title: title.trim(),
      description: "",
      category,
      tags: tagList(taskTags),
      source_url: ""
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-500">{t("plan")}</p>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">{t("taskBoardTitle")}</h1>
        <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-400">{t("taskBoardSubtitle")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <form onSubmit={submit} className="glass h-fit rounded-xl p-5">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("taskToLearn")}</label>
              <Input className="mt-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("taskPlaceholder")} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("category")}</label>
              <Select className="mt-2" value={category} onChange={(event) => setCategory(event.target.value)}>
                {(categories.data ?? [{ category: "Other", color: "#94a3b8", count: 0 }]).map((item) => (
                  <option key={item.category}>{item.category}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("tags")}</label>
              <Input className="mt-2" value={taskTags} onChange={(event) => setTaskTags(event.target.value)} placeholder="react, typescript" list="task-tags" />
              <datalist id="task-tags">{tags.data?.map((tag) => <option key={tag.tag} value={tag.tag} />)}</datalist>
            </div>
            <Button type="submit" className="w-full" disabled={create.isPending}>
              <Plus size={18} /> {t("addTask")}
            </Button>
          </div>
        </form>

        <section className="glass rounded-xl p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">{t("taskTodo")}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("taskTodoHint")}</p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-200">
              {activeTasks.length}
            </span>
          </div>

          {tasks.isLoading ? (
            <Skeleton className="h-72" />
          ) : activeTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-white/10 dark:text-slate-400">
              {t("taskEmptyTodo")}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} onComplete={setCompleting} onDelete={(item) => remove.mutate(item.id)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {completing && <CompleteDialog task={completing} onClose={() => setCompleting(null)} onDone={() => { setCompleting(null); refresh(); }} />}
    </div>
  );
}

function TaskCard({ task, onComplete, onDelete }: { task: LearningTask; onComplete: (task: LearningTask) => void; onDelete: (task: LearningTask) => void }) {
  const { t } = useLanguage();
  return (
    <article className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300/60 dark:border-white/10 dark:bg-slate-950/45">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-bold text-slate-950 dark:text-white">{task.title}</h3>
          <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">{task.category}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={() => onDelete(task)} aria-label={t("delete")}>
          <Trash2 size={16} />
        </Button>
      </div>
      {task.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-violet-400/10 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-200">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <Button className="mt-4 w-full" onClick={() => onComplete(task)}>
        <CheckCircle2 size={16} /> {t("complete")}
      </Button>
    </article>
  );
}

function CompleteDialog({ task, onClose, onDone }: { task: LearningTask; onClose: () => void; onDone: () => void }) {
  const { t } = useLanguage();
  const [learnedAt, setLearnedAt] = useState(new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState("");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("45");
  const [sourceUrl, setSourceUrl] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      api.completeTask(task.id, {
        content,
        duration_minutes: Number(hours || 0) * 60 + Number(minutes || 0),
        category: task.category,
        tags: task.tags,
        source_url: sourceUrl.trim(),
        learned_at: learnedAt
      }),
    onSuccess: () => {
      toast.success(t("taskCompletedToast"));
      queryClient.invalidateQueries();
      onDone();
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        className="glass w-full max-w-2xl rounded-xl p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!content.trim()) {
            toast.error(t("notesRequired"));
            return;
          }
          mutation.mutate();
        }}
      >
        <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">{t("completeTask")}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{task.title}</p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("learnedDate")}</label>
            <Input className="mt-2" type="date" value={learnedAt} onChange={(event) => setLearnedAt(event.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("whatLearned")}</label>
            <Textarea className="mt-2 min-h-40" value={content} onChange={(event) => setContent(event.target.value)} placeholder={t("completionNotesPlaceholder")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("hours")}</label>
              <Input className="mt-2" type="number" min="0" value={hours} onChange={(event) => setHours(event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("minutes")}</label>
              <Input className="mt-2" type="number" min="0" max="59" value={minutes} onChange={(event) => setMinutes(event.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("sourceUrl")}</label>
            <Input className="mt-2" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("clear")}
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            <Clock size={18} /> {t("recordLearning")}
          </Button>
        </div>
      </form>
    </div>
  );
}
