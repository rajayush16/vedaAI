"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  createJobSocket,
  fetchAssignmentDetail,
  regenerateAssignment,
  type AssignmentDetailPayload,
} from "../lib/api";
import { useAppStore } from "../store/app-store";

const difficultyLabel = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};

export function AssignmentOutput() {
  const params = useParams<{ id: string }>();
  const assignmentId = params.id;
  const [detail, setDetail] = useState<AssignmentDetailPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const activeJob = useAppStore((state) => state.activeJobs[assignmentId]);
  const setActiveJob = useAppStore((state) => state.setActiveJob);

  useEffect(() => {
    let active = true;

    fetchAssignmentDetail(assignmentId)
      .then((response) => {
        if (!active) {
          return;
        }

        setDetail(response);
        if (response.latestJob) {
          setActiveJob(assignmentId, {
            jobId: response.latestJob._id,
            status: response.latestJob.status,
            message: response.latestJob.errorMessage,
          });
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load assignment output",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    const socket = createJobSocket();
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as {
        type: "job-update";
        payload: {
          jobId: string;
          assignmentId: string;
          status: "queued" | "processing" | "completed" | "failed";
          message?: string;
        };
      };

      if (message.type === "job-update" && message.payload.assignmentId === assignmentId) {
        setActiveJob(assignmentId, {
          jobId: message.payload.jobId,
          status: message.payload.status,
          message: message.payload.message,
        });

        if (message.payload.status === "completed") {
          fetchAssignmentDetail(assignmentId)
            .then((response) => {
              setDetail(response);
              setError("");
            })
            .catch(() => undefined);
        }
      }
    };

    return () => {
      active = false;
      socket.close();
    };
  }, [assignmentId, setActiveJob]);

  if (loading) {
    return <div className="loading-panel">Loading generated output...</div>;
  }

  if (error || !detail) {
    return (
      <div className="error-stack">
        <p>{error || "Assignment output not found"}</p>
      </div>
    );
  }

  const { assignment, latestPaper } = detail;
  const status = activeJob?.status ?? detail.latestJob?.status ?? "queued";

  return (
    <div className="output-screen">
      <section className="output-toolbar">
        <div>
          <h2>
            Certainly, Lakshya! Here are customized Question Paper for your{" "}
            {assignment.className} {assignment.subject} classes.
          </h2>
          <p>Status: {status}</p>
        </div>
        <div className="stack-inline">
          <button className="secondary-button" type="button">
            Download as PDF
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={async () => {
              setRegenerating(true);
              try {
                const response = await regenerateAssignment(assignmentId);
                setActiveJob(assignmentId, {
                  jobId: response.jobId,
                  status: "queued",
                  message: "Regeneration queued",
                });
              } finally {
                setRegenerating(false);
              }
            }}
          >
            {regenerating ? "Regenerating..." : "Regenerate"}
          </button>
        </div>
      </section>

      {!latestPaper ? (
        <div className="loading-paper">
          <h3>{status === "failed" ? "Generation failed" : "Question paper is being generated"}</h3>
          <p>
            {activeJob?.message ||
              detail.latestJob?.errorMessage ||
              "The worker is preparing your structured question paper."}
          </p>
        </div>
      ) : (
        <article className="paper-card">
          <header className="paper-header">
            <h2>{latestPaper.schoolName}</h2>
            <p>Subject: {latestPaper.subject}</p>
            <p>Class: {latestPaper.className}</p>
          </header>

          <div className="paper-meta-grid">
            <span>Time Allowed: {latestPaper.duration}</span>
            <span>Maximum Marks: {latestPaper.maximumMarks}</span>
          </div>

          <p className="paper-note">
            All questions are compulsory unless stated otherwise.
          </p>

          <div className="student-info">
            <span>Name: __________________</span>
            <span>Roll Number: __________________</span>
            <span>Class: {latestPaper.className} Section: __________________</span>
          </div>

          {latestPaper.sections.map((section) => (
            <section key={section.title} className="paper-section">
              <h3>{section.title}</h3>
              <p className="section-instruction">{section.instruction}</p>

              <ol className="question-list">
                {section.questions.map((question, index) => (
                  <li key={`${section.title}-${index}`}>
                    <span>{question.text}</span>
                    <span className={`difficulty-badge ${question.difficulty}`}>
                      {difficultyLabel[question.difficulty]}
                    </span>
                    <strong>[{question.marks} Marks]</strong>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          <section className="paper-section answer-key">
            <h3>Answer Key</h3>
            <ol className="answer-list">
              {latestPaper.answerKey.map((item) => (
                <li key={item.questionNumber}>
                  <strong>{item.questionNumber}.</strong> {item.answer}
                </li>
              ))}
            </ol>
          </section>
        </article>
      )}
    </div>
  );
}
