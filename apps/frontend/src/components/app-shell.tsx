"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { demoTeacher, mobileNav, primaryNav } from "../data/demo";
import { useAppStore } from "../store/app-store";
import { AppIcon } from "./icons";
import { logoutTeacher } from "../lib/api";
import { SessionHydrator } from "./session-hydrator";

function isActive(pathname: string, href: string, label: string) {
  if (label === "Assignments") {
    return pathname.startsWith("/assignments");
  }

  return pathname === href;
}

export function DashboardShell({
  actions,
  children,
}: {
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const teacher = useAppStore((state) => state.teacher) ?? demoTeacher;
  const logout = useAppStore((state) => state.logout);
  const pageContent =
    pathname === "/assignments/new"
      ? {
          title: "Create Assignment",
          subtitle: "Set up a new assignment for your students",
        }
      : {
          title: "Assignments",
          subtitle: "Manage and create assignments for your classes.",
        };

  return (
    <div className="dashboard-shell">
      <SessionHydrator />
      <aside className="sidebar desktop-only">
        <Link href="/assignments" className="logo">
          <div className="brand-badge">V</div>
          <span>VedaAI</span>
        </Link>

        <Link href="/assignments/new" className="create-button">
          <AppIcon name="sparkles" className="nav-icon" />
          Create Assignment
        </Link>

        <nav className="sidebar-nav">
          {primaryNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
            className={`nav-item ${isActive(pathname, item.href, item.label) ? "active" : ""}`}
          >
              <AppIcon name={item.icon} className="nav-icon" />
              <span>{item.label}</span>
              {item.label === "Assignments" ? (
                <span className="count-badge">AI</span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="settings-link" type="button" onClick={() => router.push("/settings")}>
            <AppIcon name="square" className="nav-icon" />
            Settings
          </button>

          <button
            className="school-card"
            type="button"
            onClick={() => router.push("/settings")}
            aria-label="Open school settings"
          >
            <div className="avatar-circle">{teacher.avatarInitials}</div>
            <div>
              <p className="school-name">{teacher.schoolName}</p>
              <p className="school-city">{teacher.city}</p>
            </div>
          </button>
          <button
            className="ghost-inline-button"
            type="button"
            onClick={async () => {
              await logoutTeacher().catch(() => undefined);
              logout();
              router.push("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <button className="icon-button" type="button" onClick={() => router.back()}>
              <AppIcon name="left" className="nav-icon" />
            </button>
            <div>
              <p className="crumb-label">Assignment</p>
              <h1>{pageContent.title}</h1>
            </div>
          </div>

          <div className="topbar-actions">
            {actions}
            <button className="icon-button" type="button">
              <AppIcon name="bell" className="nav-icon" />
            </button>
            <button
              className="teacher-pill"
              type="button"
              onClick={() => router.push("/settings")}
              aria-label="Open teacher profile"
            >
              <div className="avatar-circle small">{teacher.avatarInitials}</div>
              <span>{teacher.name}</span>
            </button>
          </div>
        </header>

        <div className="page-heading mobile-only">
          <p className="page-title">{pageContent.title}</p>
          <p className="page-subtitle">{pageContent.subtitle}</p>
        </div>

        <section className="page-panel">
          <div className="page-heading desktop-only heading-in-panel">
            <p className="status-dot" />
            <div>
              <p className="page-title">{pageContent.title}</p>
              <p className="page-subtitle">{pageContent.subtitle}</p>
            </div>
          </div>

          {children}
        </section>
      </div>

      <nav className="mobile-nav mobile-only">
        {mobileNav.map((item) => (
          <Link key={item.label} href={item.href} className="mobile-nav-item">
            <AppIcon name={item.icon} className="nav-icon" />
            <span>{item.label}</span>
          </Link>
        ))}
        <Link href="/assignments/new" className="fab-button" aria-label="Create assignment">
          <AppIcon name="plus" className="nav-icon" />
        </Link>
      </nav>
    </div>
  );
}
