import PDFDocument from "pdfkit";

type PaperPayload = {
  title: string;
  schoolName: string;
  subject: string;
  className: string;
  duration: string;
  maximumMarks: number;
  sections: {
    title: string;
    instruction: string;
    questions: {
      text: string;
      difficulty: "easy" | "moderate" | "hard";
      marks: number;
    }[];
  }[];
  answerKey: {
    questionNumber: number;
    answer: string;
  }[];
};

function difficultyColor(level: "easy" | "moderate" | "hard") {
  if (level === "easy") return "#2f7a45";
  if (level === "moderate") return "#9a6700";
  return "#b42318";
}

export async function generatePaperPdf(paper: PaperPayload) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
  });

  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(18).text(paper.schoolName, {
      align: "center",
    });
    doc.moveDown(0.25);
    doc.font("Helvetica").fontSize(11).text(paper.title, {
      align: "center",
    });
    doc.moveDown(0.3);
    doc.text(`Subject: ${paper.subject}`, { align: "center" });
    doc.text(`Class: ${paper.className}`, { align: "center" });
    doc.moveDown(0.8);

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(`Time Allowed: ${paper.duration}`, 48, doc.y, { continued: true })
      .text(`Maximum Marks: ${paper.maximumMarks}`, { align: "right" });
    doc.moveDown(0.8);

    doc.font("Helvetica").fontSize(10);
    doc.text("Name: ________________________________", { continued: true });
    doc.text("Roll Number: ____________________", { align: "right" });
    doc.text(`Class: ${paper.className}    Section: ________________________`);
    doc.moveDown(1);

    for (const section of paper.sections) {
      doc.font("Helvetica-Bold").fontSize(13).text(section.title);
      doc.moveDown(0.2);
      doc
        .font("Helvetica-Oblique")
        .fontSize(10)
        .fillColor("#6b6461")
        .text(section.instruction);
      doc.fillColor("#222020");
      doc.moveDown(0.5);

      section.questions.forEach((question, index) => {
        const startY = doc.y;
        doc
          .font("Helvetica")
          .fontSize(10.5)
          .text(`${index + 1}. ${question.text}`, 60, startY, {
            width: 380,
          });

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(difficultyColor(question.difficulty))
          .text(question.difficulty.toUpperCase(), 450, startY, {
            width: 55,
            align: "right",
          });
        doc
          .fillColor("#222020")
          .text(`${question.marks} marks`, 510, startY, {
            width: 40,
            align: "right",
          });
        doc.moveDown(0.8);
      });

      doc.moveDown(0.6);
    }

    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(15).text("Answer Key");
    doc.moveDown(0.8);

    paper.answerKey.forEach((item) => {
      doc.font("Helvetica-Bold").fontSize(10.5).text(`${item.questionNumber}. `, {
        continued: true,
      });
      doc.font("Helvetica").text(item.answer);
      doc.moveDown(0.35);
    });

    doc.end();
  });
}
