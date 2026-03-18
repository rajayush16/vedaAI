import { ReactNode } from "react";
import { DashboardShell } from "../../src/components/app-shell";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <DashboardShell
      title="Assignments"
      subtitle="Manage and create assignments for your classes."
    >
      {children}
    </DashboardShell>
  );
}
