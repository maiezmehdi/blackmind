import { Course } from '../types';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
   .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'cours';

/* Markdown -> plain text (keeps the words, drops the syntax) */
const mdToText = (md: string): string =>
  String(md || '')
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, '').trim())
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .trim();

/* ------------------------------------------------------------------ */
/* PDF export (jsPDF text API — reliable, selectable text, no canvas)  */
/* ------------------------------------------------------------------ */

export const exportCoursePdf = async (course: Course): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (
    text: string,
    opts: { size?: number; style?: 'normal' | 'bold' | 'italic'; color?: [number, number, number]; gap?: number; indent?: number } = {}
  ) => {
    const size = opts.size ?? 11;
    const indent = opts.indent ?? 0;
    doc.setFont('helvetica', opts.style ?? 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? [17, 17, 17]));
    const lineH = size * 1.4;
    const lines = doc.splitTextToSize(text, maxW - indent);
    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, margin + indent, y);
      y += lineH;
    }
    y += opts.gap ?? 4;
  };

  const rule = () => {
    ensureSpace(10);
    doc.setDrawColor(220);
    doc.line(margin, y, pageW - margin, y);
    y += 12;
  };

  // Cover / title block
  write(course.title, { size: 22, style: 'bold', gap: 2 });
  write([course.category, course.author].filter(Boolean).join('  •  '), { size: 10, color: [120, 120, 120], gap: 6 });
  if (course.description) write(mdToText(course.description), { size: 12, color: [70, 70, 70], gap: 8 });
  rule();

  (course.modules || []).forEach((mod, mIdx) => {
    if (mIdx > 0) { doc.addPage(); y = margin; }
    write(`Module ${mIdx + 1} — ${mod.title}`, { size: 16, style: 'bold', gap: 8 });
    (mod.lessons || []).forEach((lesson, lIdx) => {
      write(`${mIdx + 1}.${lIdx + 1}  ${lesson.title}`, { size: 13, style: 'bold', gap: 6 });
      (lesson.content || []).forEach((block: any) => {
        if (block.type === 'text') {
          for (const para of mdToText(block.value).split('\n').filter((p) => p.trim())) {
            const bullet = /^\s*([-*]|\d+\.)\s+/.test(para);
            write(bullet ? '•  ' + para.replace(/^\s*([-*]|\d+\.)\s+/, '') : para, { size: 11, indent: bullet ? 12 : 0, gap: 3 });
          }
          y += 4;
        } else if (block.type === 'insight' && block.value) {
          write('Insight — ' + (block.value.title || ''), { size: 11, style: 'bold', color: [79, 70, 229], gap: 2 });
          write(mdToText(block.value.content), { size: 11, color: [70, 70, 70], gap: 6, indent: 12 });
        } else if (block.type === 'quiz' && block.value) {
          write('Quiz : ' + (block.value.question || ''), { size: 11, style: 'bold', gap: 3 });
          (block.value.options || []).forEach((o: string, i: number) => {
            const correct = i === block.value.correctAnswer;
            write('-  ' + o + (correct ? '   (bonne reponse)' : ''), { size: 11, style: correct ? 'bold' : 'normal', indent: 12, gap: 2 });
          });
          y += 4;
        } else if (block.type === 'overview' && block.value?.objectives?.length) {
          write('Objectifs :', { size: 11, style: 'bold', gap: 2 });
          block.value.objectives.forEach((o: string) => write('•  ' + o, { size: 11, indent: 12, gap: 2 }));
        }
      });
    });
  });

  doc.save(`${slugify(course.title)}.pdf`);
};

/* ------------------------------------------------------------------ */
/* DOCX export (docx lib, loaded on demand)                            */
/* ------------------------------------------------------------------ */

// Minimal markdown line -> docx runs (handles **bold**, strips `code`/links)
const mdRuns = (line: string, TextRun: any) => {
  const clean = line
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  return clean.split('**').map((part, i) => new TextRun({ text: part, bold: i % 2 === 1 }));
};

export const exportCourseDocx = async (course: Course): Promise<void> => {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

  const children: any[] = [
    new Paragraph({ text: course.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: course.description || '', italics: true })] }),
    new Paragraph({ text: '' }),
  ];

  const pushMarkdown = (md: string) => {
    for (const raw of String(md || '').split('\n')) {
      const line = raw.trimEnd();
      if (!line.trim()) continue;
      const h = line.match(/^(#{1,4})\s+(.*)/);
      if (h) {
        const levels = [HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_4];
        children.push(new Paragraph({ text: h[2].replace(/\*\*/g, ''), heading: levels[h[1].length - 1] }));
      } else if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
        const text = line.replace(/^\s*([-*]|\d+\.)\s+/, '');
        children.push(new Paragraph({ children: mdRuns(text, TextRun), bullet: { level: 0 } }));
      } else if (/^>\s?/.test(line)) {
        children.push(new Paragraph({ children: [new TextRun({ text: line.replace(/^>\s?/, ''), italics: true })] }));
      } else {
        children.push(new Paragraph({ children: mdRuns(line, TextRun) }));
      }
    }
  };

  (course.modules || []).forEach((mod, mIdx) => {
    children.push(new Paragraph({ text: `Module ${mIdx + 1} — ${mod.title}`, heading: HeadingLevel.HEADING_1, pageBreakBefore: mIdx > 0 }));
    (mod.lessons || []).forEach((lesson, lIdx) => {
      children.push(new Paragraph({ text: `${mIdx + 1}.${lIdx + 1} ${lesson.title}`, heading: HeadingLevel.HEADING_2 }));
      (lesson.content || []).forEach((block: any) => {
        if (block.type === 'text') {
          pushMarkdown(block.value);
        } else if (block.type === 'insight' && block.value) {
          children.push(new Paragraph({ children: [new TextRun({ text: `💡 ${block.value.title || 'Insight'}`, bold: true })] }));
          pushMarkdown(block.value.content);
        } else if (block.type === 'quiz' && block.value) {
          children.push(new Paragraph({ children: [new TextRun({ text: `Quiz : ${block.value.question || ''}`, bold: true })] }));
          (block.value.options || []).forEach((o: string, i: number) => {
            children.push(new Paragraph({
              children: [new TextRun({ text: o + (i === block.value.correctAnswer ? '  ✓' : ''), bold: i === block.value.correctAnswer })],
              bullet: { level: 0 },
            }));
          });
        } else if (block.type === 'overview' && block.value?.objectives?.length) {
          children.push(new Paragraph({ children: [new TextRun({ text: 'Objectifs :', bold: true })] }));
          block.value.objectives.forEach((o: string) =>
            children.push(new Paragraph({ text: o, bullet: { level: 0 } })));
        }
      });
    });
  });

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(course.title)}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
