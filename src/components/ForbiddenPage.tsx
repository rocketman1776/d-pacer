import ErrorSplitPage from "./ErrorSplitPage";

export function isForbiddenPath(pathname = window.location.pathname) {
  return pathname.replace(/\/+$/, "").endsWith("/403");
}

export default function ForbiddenPage() {
  return (
    <ErrorSplitPage
      code="403"
      detail="Please return back to the starting line."
      result="Did Not Start (DNS)"
      title="You're not allowed to enter this race"
    />
  );
}
