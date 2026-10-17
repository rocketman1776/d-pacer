import type { PlanState } from "./planState";

/** Loads the FIT encoder on demand and saves the workout through the browser. Returns the file name. */
export async function downloadWorkoutFit(name: string, state: PlanState) {
  const { workoutFitFile } = await import("./fitWorkout");
  const { bytes, fileName } = workoutFitFile(name, state);
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/octet-stream" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}
