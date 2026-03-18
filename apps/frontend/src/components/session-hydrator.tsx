"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTeacherSession } from "../lib/api";
import { useAppStore } from "../store/app-store";

export function SessionHydrator() {
  const router = useRouter();
  const setTeacher = useAppStore((state) => state.setTeacher);

  useEffect(() => {
    let active = true;

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
  }, [router, setTeacher]);

  return null;
}
