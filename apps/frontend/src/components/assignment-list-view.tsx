"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../store/app-store";

export function AssignmentListView() {
  const [showSeedHint, setShowSeedHint] = useState(false);
  const assignments = useAppStore((state) => state.assignments);
  const search = useAppStore((state) => state.search);
  const seedAssignments = useAppStore((state) => state.seedAssignments);
  const setSearch = useAppStore((state) => state.setSearch);

  useEffect(() => {
    setShowSeedHint(assignments.length === 0);
  }, [assignments.length]);

  const filteredAssignments = useMemo(() => {
    if (!search.trim()) {
      return assignments;
    }

    return assignments.filter((assignment) =>
      assignment.title.toLowerCase().includes(search.toLowerCase()),
    );
  }, [assignments, search]);

  if (assignments.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-illustration">
          <span>✕</span>
        </div>
        <h2>No assignments yet</h2>
        <p>
          Create your first assignment to start collecting and grading student
          submissions. You can set up rubrics, define marking criteria, and let AI
          assist with grading.
        </p>
        <div className="stack-inline">
          <Link href="/assignments/new" className="primary-button">
            + Create Your First Assignment
          </Link>
          {showSeedHint ? (
            <button className="secondary-button" type="button" onClick={seedAssignments}>
              Load sample cards
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-list-view">
      <div className="filters-row">
        <button className="filter-button" type="button">
          Filter By
        </button>
        <input
          className="search-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search Assignment"
        />
      </div>

      <div className="assignment-grid">
        {filteredAssignments.map((assignment) => (
          <article key={assignment.id} className="assignment-card">
            <div className="assignment-card-row">
              <Link href={`/assignments/${assignment.id}`} className="assignment-card-title">
                {assignment.title}
              </Link>
              <button className="menu-dots" type="button" aria-label="Assignment options">
                •••
              </button>
            </div>
            <div className="assignment-meta">
              <span>
                <strong>Assigned on :</strong> {assignment.assignedOn}
              </span>
              <span>
                <strong>Due :</strong> {assignment.dueDate}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="floating-cta desktop-only">
        <Link href="/assignments/new" className="primary-button">
          + Create Assignment
        </Link>
      </div>
    </div>
  );
}
