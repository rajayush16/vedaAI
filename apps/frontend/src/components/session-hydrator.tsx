"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTeacherSession } from "../lib/api";
import { useAppStore } from "../store/app-store";

export function SessionHydrator() {
  const router = useRouter();
  const setTeacher = useAppStore((state) => state.setTeacher);
  const setAuthStatus = useAppStore((state) => state.setAuthStatus);

  useEffect(() => {
    let active = true;

    setAuthStatus("unknown");

    getTeacherSession()
      .then((response) => {
        if (active) {
          setTeacher(response.teacher);
        }
      })
      .catch(() => {
        if (active) {
          setTeacher(null);
          router.push("/login");
        }
      });

    return () => {
      active = false;
    };
  }, [router, setAuthStatus, setTeacher]);

  return null;
}
