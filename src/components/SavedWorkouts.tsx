import { useEffect, useState } from "react";
import { GearIcon } from "./icons";
import { deleteWorkout, renameWorkout, savedRunPreview, type SavedWorkout } from "../lib/workouts";

export default function SavedWorkouts({
  workouts,
  activeId,
  onOpen,
  onEdit,
  onUpdate,
}: {
  workouts: SavedWorkout[];
  activeId: string;
  onOpen: (workout: SavedWorkout) => void;
  onEdit: (workout: SavedWorkout) => void;
  onUpdate: (workouts: SavedWorkout[]) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState("");
  const [menuId, setMenuId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!menuId) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      const open = document.querySelector(`[data-saved-run="${menuId}"]`);
      if (target instanceof Node && open?.contains(target)) return;
      setMenuId("");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuId("");
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuId]);

  const update = async (next: SavedWorkout[]) => {
    setBusy(true);
    setNotice("");
    try {
      await onUpdate(next);
      setEditingId("");
      setConfirmDeleteId("");
    } catch {
      setNotice("Could not update your saved runs. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="saved-workouts" aria-labelledby="saved-runs-heading">
      <h3 id="saved-runs-heading">Saved Runs</h3>
      {workouts.length === 0 ? (
        <p>Save a run and it will show up here.</p>
      ) : (
        <div className="saved-workout-list">
          {workouts.map((workout) => {
            const editing = editingId === workout.id;
            const confirming = confirmDeleteId === workout.id;
            const menuOpen = menuId === workout.id;
            const preview = savedRunPreview(workout.state);
            return (
              <article
                className={[workout.id === activeId ? "active" : "", menuOpen ? "menu-open" : ""].filter(Boolean).join(" ")}
                data-saved-run={workout.id}
                key={workout.id}
              >
                {editing ? (
                  <form
                    className="saved-run-edit"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const next = renameWorkout(workouts, workout.id, draft);
                      if (next === workouts) {
                        setNotice("Add a name for this run.");
                        return;
                      }
                      void update(next);
                    }}
                  >
                    <input
                      aria-label={`New name for ${workout.name}`}
                      maxLength={80}
                      onChange={(event) => setDraft(event.target.value)}
                      value={draft}
                    />
                    <button disabled={busy} type="submit">
                      Save
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => {
                        setEditingId("");
                        setNotice("");
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </form>
                ) : confirming ? (
                  <div className="saved-run-edit">
                    <span className="saved-run-confirm">Delete this run?</span>
                    <button disabled={busy} onClick={() => void update(deleteWorkout(workouts, workout.id))} type="button">
                      Delete
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => {
                        setConfirmDeleteId("");
                        setNotice("");
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="saved-run-main">
                      <button
                        className="saved-run-open"
                        onClick={() => {
                          setMenuId("");
                          onOpen(workout);
                        }}
                        type="button"
                      >
                        <span className="saved-run-title">
                          <strong>{workout.name}</strong>
                          <span className="saved-run-strategy">· {preview.strategy}</span>
                        </span>
                        <span className="saved-run-meta">
                          {preview.distance} · {preview.averagePace} · {preview.totalTime}
                        </span>
                      </button>
                      <button
                        aria-expanded={menuOpen}
                        aria-label={`Options for ${workout.name}`}
                        className="saved-run-gear"
                        onClick={() => {
                          setMenuId(menuOpen ? "" : workout.id);
                          setNotice("");
                        }}
                        type="button"
                      >
                        <GearIcon />
                      </button>
                    </div>
                    {menuOpen && (
                      <div className="saved-run-actions">
                        <button
                          onClick={() => {
                            setMenuId("");
                            setNotice("");
                            onEdit(workout);
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDraft(workout.name);
                            setEditingId(workout.id);
                            setMenuId("");
                            setConfirmDeleteId("");
                            setNotice("");
                          }}
                          type="button"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDeleteId(workout.id);
                            setEditingId("");
                            setMenuId("");
                            setNotice("");
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
      {notice && <p className="field-error">{notice}</p>}
    </section>
  );
}
