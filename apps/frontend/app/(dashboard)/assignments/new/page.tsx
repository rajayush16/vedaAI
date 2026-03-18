import Link from "next/link";

export default function NewAssignmentPage() {
  return (
    <div className="placeholder-screen">
      <p className="placeholder-kicker">Create Assignment</p>
      <h2>Assignment form is the next implementation slice.</h2>
      <p>
        The shell, routing, and teacher navigation are ready. The next commit will add
        the full Figma-inspired multi-field form with validation and derived totals.
      </p>
      <Link href="/assignments" className="secondary-button">
        Back to assignments
      </Link>
    </div>
  );
}
