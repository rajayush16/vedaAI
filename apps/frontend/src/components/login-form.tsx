"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppIcon } from "./icons";
import { useAppStore } from "../store/app-store";
import { loginTeacher } from "../lib/api";

export function LoginForm() {
  const router = useRouter();
  const setTeacher = useAppStore((state) => state.setTeacher);
  const [email, setEmail] = useState("teacher@vedaai.dev");
  const [password, setPassword] = useState("Teacher123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !password) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await loginTeacher(email, password);
      setTeacher(response.teacher);
      router.push("/assignments");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to sign in",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-lockup">
          <div className="brand-badge">V</div>
          <div>
            <p className="brand-name">VedaAI</p>
            <p className="auth-subtitle">AI Assessment Creator</p>
          </div>
        </div>

        <div className="auth-copy">
          <p className="status-dot" />
          <div>
            <h1>Teacher sign in</h1>
            <p>Access assignments, generate question papers, and manage outputs.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="input-group">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teacher@vedaai.dev"
            />
          </label>

          <label className="input-group">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Teacher123!"
            />
          </label>

          <button className="primary-button auth-button" type="submit">
            {isSubmitting ? "Signing in..." : "Continue to dashboard"}
            <AppIcon name="right" className="button-icon" />
          </button>
        </form>

        {error ? <p className="form-error">{error}</p> : null}
      </section>
    </main>
  );
}
