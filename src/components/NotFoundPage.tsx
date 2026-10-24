import ErrorSplitPage from "./ErrorSplitPage";

/** True on the planner root for this build (`/` or `/beta/`). */
export function isPlannerPath(pathname = window.location.pathname) {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  const path = pathname.replace(/\/+$/, "");
  return path === base;
}

export default function NotFoundPage() {
  return (
    <ErrorSplitPage
      code="404"
      detail="That page is not part of the plan. The split below never got written."
      result="Did Not Find (DNF)"
      title="This mile isn't on the course"
    />
  );
}
