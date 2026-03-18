import { Router } from "express";
import multer from "multer";
import { createAssignmentWithJob, getAssignmentWithOutput, listAssignments } from "../services/assignment-service";
import { requireTeacherSession } from "../middleware/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const assignmentsRouter = Router();

assignmentsRouter.use(requireTeacherSession);

assignmentsRouter.get("/", async (request, response) => {
  const assignments = await listAssignments(
    request.teacher!.id,
    typeof request.query.search === "string" ? request.query.search : undefined,
  );

  response.json({ assignments });
});

assignmentsRouter.get("/:id", async (request, response) => {
  const assignment = await getAssignmentWithOutput(request.params.id, request.teacher!.id);

  if (!assignment) {
    response.status(404).json({ message: "Assignment not found" });
    return;
  }

  response.json(assignment);
});

assignmentsRouter.post("/", upload.single("material"), async (request, response) => {
  const payload = {
    ...request.body,
    durationMinutes: Number(request.body.durationMinutes),
    questionTypes:
      typeof request.body.questionTypes === "string"
        ? JSON.parse(request.body.questionTypes)
        : request.body.questionTypes,
    materialText:
      request.file?.mimetype === "text/plain"
        ? request.file.buffer.toString("utf8")
        : request.body.materialText,
    materialFileName: request.file?.originalname ?? request.body.materialFileName,
  };

  const created = await createAssignmentWithJob(payload, request.teacher!.id);
  response.status(201).json(created);
});

assignmentsRouter.post("/:id/regenerate", async (request, response) => {
  const assignment = await getAssignmentWithOutput(request.params.id, request.teacher!.id);

  if (!assignment) {
    response.status(404).json({ message: "Assignment not found" });
    return;
  }

  const created = await createAssignmentWithJob(assignment.assignment, request.teacher!.id);
  response.status(202).json(created);
});
