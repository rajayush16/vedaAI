"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "../store/app-store";
import { createAssignment, fetchAssignmentDetail, updateAssignment } from "../lib/api";

const questionTypeOptions = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Answer Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "True or False",
];

export function AssignmentForm() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const assignmentId = typeof params.id === "string" ? params.id : undefined;
  const isEditMode = Boolean(assignmentId);
  const draft = useAppStore((state) => state.draft);
  const updateDraft = useAppStore((state) => state.updateDraft);
  const addQuestionType = useAppStore((state) => state.addQuestionType);
  const updateQuestionType = useAppStore((state) => state.updateQuestionType);
  const removeQuestionType = useAppStore((state) => state.removeQuestionType);
  const resetDraft = useAppStore((state) => state.resetDraft);
  const setActiveJob = useAppStore((state) => state.setActiveJob);
  const [errors, setErrors] = useState<string[]>([]);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(isEditMode);

  const totalQuestions = useMemo(
    () => draft.questionTypes.reduce((sum, item) => sum + item.count, 0),
    [draft.questionTypes],
  );
  const totalMarks = useMemo(
    () => draft.questionTypes.reduce((sum, item) => sum + item.count * item.marks, 0),
    [draft.questionTypes],
  );

  useEffect(() => {
    if (!assignmentId) {
      return;
    }

    let active = true;

    fetchAssignmentDetail(assignmentId)
      .then((response) => {
        if (!active) {
          return;
        }

        updateDraft({
          title: response.assignment.title,
          subject: response.assignment.subject,
          className: response.assignment.className,
          schoolName: response.assignment.schoolName,
          durationMinutes: response.assignment.durationMinutes,
          dueDate: response.assignment.dueDate,
          instructions: response.assignment.instructions ?? "",
          materialText: response.assignment.materialText ?? "",
          materialFileName: response.assignment.materialFileName ?? "",
          questionTypes:
            response.assignment.questionTypes?.length
              ? response.assignment.questionTypes
              : draft.questionTypes,
        });
      })
      .catch((loadError) => {
        if (active) {
          setErrors([
            loadError instanceof Error ? loadError.message : "Failed to load assignment",
          ]);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingDraft(false);
        }
      });

    return () => {
      active = false;
    };
  }, [assignmentId, draft.questionTypes, updateDraft]);

  function validate() {
    const nextErrors: string[] = [];

    if (!draft.title.trim()) nextErrors.push("Assignment title is required.");
    if (!draft.subject.trim()) nextErrors.push("Subject is required.");
    if (!draft.className.trim()) nextErrors.push("Class is required.");
    if (!draft.schoolName.trim()) nextErrors.push("School name is required.");
    if (!draft.dueDate.trim()) nextErrors.push("Due date is required.");
    if (draft.durationMinutes <= 0) nextErrors.push("Duration must be positive.");

    draft.questionTypes.forEach((item, index) => {
      if (!item.type.trim()) nextErrors.push(`Question type ${index + 1} is required.`);
      if (item.count <= 0) nextErrors.push(`Question count ${index + 1} must be positive.`);
      if (item.marks <= 0) nextErrors.push(`Marks ${index + 1} must be positive.`);
    });

    setErrors(nextErrors);
    return nextErrors.length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.set("title", draft.title);
      payload.set("subject", draft.subject);
      payload.set("className", draft.className);
      payload.set("schoolName", draft.schoolName);
      payload.set("durationMinutes", String(draft.durationMinutes));
      payload.set("dueDate", draft.dueDate);
      payload.set("instructions", draft.instructions);
      payload.set("questionTypes", JSON.stringify(draft.questionTypes));
      payload.set("materialText", draft.materialText ?? "");
      payload.set("materialFileName", draft.materialFileName ?? "");

      if (materialFile) {
        payload.set("material", materialFile);
      }

      const response = assignmentId
        ? await updateAssignment(assignmentId, payload)
        : await createAssignment(payload);
      setActiveJob(response.assignmentId, {
        jobId: response.jobId,
        status: "queued",
        message: isEditMode
          ? "Assignment update queued for regeneration"
          : "Assignment queued for generation",
      });
      resetDraft();
      router.push(`/assignments/${response.assignmentId}`);
    } catch (submissionError) {
      setErrors([
        submissionError instanceof Error
          ? submissionError.message
          : isEditMode
            ? "Failed to update assignment"
            : "Failed to create assignment",
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingDraft) {
    return <div className="loading-panel">Loading assignment...</div>;
  }

  return (
    <form className="assignment-form-screen" onSubmit={handleSubmit}>
      <div className="progress-track">
        <div className="progress-bar" />
      </div>

      <section className="form-card">
        <div className="form-card-header">
          <div>
            <h2>{isEditMode ? "Edit Assignment" : "Assignment Details"}</h2>
            <p>
              {isEditMode
                ? "Update the assignment and regenerate the latest output"
                : "Basic information about your assignment"}
            </p>
          </div>
        </div>

        <div className="upload-dropzone">
          <input
            id="material-upload"
            type="file"
            accept=".pdf,.txt,.png,.jpg,.jpeg"
            className="hidden-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setMaterialFile(file ?? null);
              updateDraft({ materialFileName: file?.name ?? "" });
            }}
          />
          <div className="upload-icon">↥</div>
          <p>Choose a file or drag &amp; drop it here</p>
          <span>PDF, TXT, PNG, JPG up to 10MB</span>
          <label htmlFor="material-upload" className="secondary-button">
            Browse Files
          </label>
          <small>
            {draft.materialFileName || "Upload images or text material to guide the generator"}
          </small>
        </div>

        <div className="form-grid two-columns">
          <label className="input-group">
            <span>Assignment Title</span>
            <input
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              placeholder="Quiz on Electricity"
            />
          </label>
          <label className="input-group">
            <span>Due Date</span>
            <input
              type="date"
              value={draft.dueDate}
              onChange={(event) => updateDraft({ dueDate: event.target.value })}
            />
          </label>
          <label className="input-group">
            <span>Subject</span>
            <input
              value={draft.subject}
              onChange={(event) => updateDraft({ subject: event.target.value })}
              placeholder="Science"
            />
          </label>
          <label className="input-group">
            <span>Class</span>
            <input
              value={draft.className}
              onChange={(event) => updateDraft({ className: event.target.value })}
              placeholder="8th"
            />
          </label>
          <label className="input-group">
            <span>School Name</span>
            <input
              value={draft.schoolName}
              onChange={(event) => updateDraft({ schoolName: event.target.value })}
              placeholder="Delhi Public School"
            />
          </label>
          <label className="input-group">
            <span>Duration (minutes)</span>
            <input
              type="number"
              min={1}
              value={draft.durationMinutes}
              onChange={(event) =>
                updateDraft({ durationMinutes: Number(event.target.value) || 0 })
              }
              placeholder="45"
            />
          </label>
        </div>

        <div className="question-type-block">
          <div className="question-type-header">
            <strong>Question Type</strong>
            <strong>No. of Questions</strong>
            <strong>Marks</strong>
            <span />
          </div>

          {draft.questionTypes.map((item) => (
            <div key={item.id} className="question-row">
              <select
                value={item.type}
                onChange={(event) =>
                  updateQuestionType(item.id, { type: event.target.value })
                }
              >
                {questionTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <div className="counter-control">
                <button
                  type="button"
                  onClick={() =>
                    updateQuestionType(item.id, { count: Math.max(1, item.count - 1) })
                  }
                >
                  -
                </button>
                <span>{item.count}</span>
                <button
                  type="button"
                  onClick={() => updateQuestionType(item.id, { count: item.count + 1 })}
                >
                  +
                </button>
              </div>

              <div className="counter-control">
                <button
                  type="button"
                  onClick={() =>
                    updateQuestionType(item.id, { marks: Math.max(1, item.marks - 1) })
                  }
                >
                  -
                </button>
                <span>{item.marks}</span>
                <button
                  type="button"
                  onClick={() => updateQuestionType(item.id, { marks: item.marks + 1 })}
                >
                  +
                </button>
              </div>

              <button
                className="remove-row-button"
                type="button"
                onClick={() => removeQuestionType(item.id)}
              >
                ×
              </button>
            </div>
          ))}

          <button className="add-row-button" type="button" onClick={addQuestionType}>
            <span>+</span> Add Question Type
          </button>
        </div>

        <div className="totals-panel">
          <span>Total Questions : {totalQuestions}</span>
          <span>Total Marks : {totalMarks}</span>
        </div>

        <label className="input-group">
          <span>Additional Information (For better output)</span>
          <textarea
            rows={5}
            value={draft.instructions}
            onChange={(event) => updateDraft({ instructions: event.target.value })}
            placeholder="Generate a question paper for a 3 hour exam duration..."
          />
        </label>

        {errors.length ? (
          <div className="error-stack">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
      </section>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={() => router.push("/assignments")}>
          ← Previous
        </button>
        <button className="primary-button" type="submit">
          {isSubmitting
            ? (isEditMode ? "Saving..." : "Submitting...")
            : (isEditMode ? "Save Changes" : "Next →")}
        </button>
      </div>
    </form>
  );
}
