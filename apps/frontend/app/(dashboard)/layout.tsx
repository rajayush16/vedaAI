import { ReactNode } from "react";
import { DashboardShell } from "../../src/components/app-shell";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
