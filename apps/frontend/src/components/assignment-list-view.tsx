"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAssignment, fetchAssignments } from "../lib/api";
import { useAppStore } from "../store/app-store";

export function AssignmentListView() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const assignments = useAppStore((state) => state.assignments);
  const search = useAppStore((state) => state.search);
  const setSearch = useAppStore((state) => state.setSearch);
  const setAssignments = useAppStore((state) => state.setAssignments);
  const logout = useAppStore((state) => state.logout);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchAssignments()
      .then((response) => {
        if (active) {
          setAssignments(
            response.assignments.map((assignment) => ({
              id: assignment._id,
              title: assignment.title,
              assignedOn: new Intl.DateTimeFormat("en-GB")
                .format(new Date(assignment.createdAt))
                .replace(/\//g, "-"),
              dueDate: assignment.dueDate,
            })),
          );
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) {
          const message =
            requestError instanceof Error
              ? requestError.message
              : "Unable to load assignments";

          if (message === "Unauthorized" || message === "Session expired") {
            logout();
            router.push("/login");
            return;
          }

          setError(message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [logout, router, setAssignments]);

  const filteredAssignments = useMemo(() => {
    if (!search.trim()) {
      return assignments;
    }

    return assignments.filter((assignment) =>
      assignment.title.toLowerCase().includes(search.toLowerCase()),
    );
  }, [assignments, search]);

  async function handleDelete(assignmentId: string) {
    const confirmed = window.confirm("Delete this assignment?");
    if (!confirmed) {
      return;
    }

    setDeletingId(assignmentId);
    try {
      await deleteAssignment(assignmentId);
      setAssignments(assignments.filter((assignment) => assignment.id !== assignmentId));
      setOpenMenuId(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete assignment",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div className="loading-panel">Loading assignments...</div>;
  }

  if (error) {
    return (
      <div className="error-stack">
        <p>{error}</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="assignment-empty-state">
        <div className="assignment-empty-illustration" aria-hidden="true">
          <div className="empty-orb" />
          <div className="empty-paper">
            <span className="empty-paper-line strong" />
            <span className="empty-paper-line" />
            <span className="empty-paper-line" />
            <span className="empty-paper-line" />
            <span className="empty-paper-line short" />
          </div>
          <div className="empty-magnifier">
            <div className="empty-magnifier-lens">
              <span />
              <span />
            </div>
            <div className="empty-magnifier-handle" />
          </div>
          <div className="empty-chip top">
            <span />
            <span />
          </div>
          <div className="empty-spark star" />
          <div className="empty-spark dot" />
          <div className="empty-swoosh" />
        </div>
        <h2>No assignments yet</h2>
        <p>
          Create your first assignment to start collecting and grading student
          submissions. You can set up rubrics, define marking criteria, and let AI
          assist with grading.
        </p>
        <Link href="/assignments/new" className="primary-button">
          + Create Your First Assignment
        </Link>
      </div>
    );
  }

  return (
    <div className="assignment-list-view">
      <div className="filters-row">
        <button
          className="filter-button"
          type="button"
          onClick={() => searchInputRef.current?.focus()}
        >
          Filter By
        </button>
        <input
          ref={searchInputRef}
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
              <div
                className="assignment-menu"
                ref={openMenuId === assignment.id ? menuRef : null}
              >
                <button
                  className="menu-dots"
                  type="button"
                  aria-label="Assignment options"
                  onClick={() =>
                    setOpenMenuId((current) =>
                      current === assignment.id ? null : assignment.id,
                    )
                  }
                >
                  ...
                </button>
                {openMenuId === assignment.id ? (
                  <div className="assignment-menu-popover">
                    <button
                      className="assignment-menu-action"
                      type="button"
                      onClick={() => router.push(`/assignments/${assignment.id}`)}
                    >
                      View assignment
                    </button>
                    <button
                      className="assignment-menu-action assignment-menu-delete"
                      type="button"
                      onClick={() => handleDelete(assignment.id)}
                      disabled={deletingId === assignment.id}
                    >
                      {deletingId === assignment.id ? "Deleting..." : "Delete assignment"}
                    </button>
                  </div>
                ) : null}
              </div>
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
