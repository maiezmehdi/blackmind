import { Course } from '../types';

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
   .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'cours';

const today = () =>
  new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/* Markdown -> plain text (keeps words, drops ALL syntax incl. bold markers) */
const mdToText = (md: string): string =>
  String(md || '')
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, '').trim())
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .trim();

/* Clean one line but KEEP **bold** markers (for rich DOCX runs) */
const mdLineClean = (line: string): string =>
  line
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/, '')
    .replace(/^>\s?/, '')
    .trim();

/* Split a line into bold / normal segments on **markers** */
const mdSegments = (line: string): { text: string; bold: boolean }[] =>
  line.split('**').map((t, i) => ({ text: t, bold: i % 2 === 1 })).filter((s) => s.text);

const isBullet = (l: string) => /^\s*([-*]|\d+\.)\s+/.test(l);
const stripBullet = (l: string) => l.replace(/^\s*([-*]|\d+\.)\s+/, '');

/* ================================================================== */
/* PDF — polished layout with jsPDF text API                          */
/* ================================================================== */

// Builds the PDF document without triggering a browser download or save —
// reused both by exportCoursePdf (local download) and the email-attachment
// path, same pattern as buildCourseDocxBlob below.
const buildCoursePdfDoc = async (course: Course) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  const CW = W - M * 2;

  const INK: [number, number, number] = [26, 26, 26];
  const SUB: [number, number, number] = [90, 90, 95];
  const MUTED: [number, number, number] = [140, 140, 148];
  const LINE: [number, number, number] = [223, 223, 228];
  const ACCENT: [number, number, number] = [79, 70, 229];
  const BOXBG: [number, number, number] = [247, 247, 249];
  const INSBG: [number, number, number] = [244, 243, 255];

  let y = M;
  const set = (style: string, size: number, color: [number, number, number]) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const ensure = (need: number) => { if (y + need > H - M - 6) { doc.addPage(); y = M; } };

  const para = (
    text: string,
    o: { size?: number; style?: string; color?: [number, number, number]; gap?: number; indent?: number; lh?: number; bullet?: boolean } = {}
  ) => {
    const size = o.size ?? 10.5;
    const lh = (o.lh ?? 1.55) * size;
    const indent = o.indent ?? 0;
    const bulletPad = o.bullet ? 14 : 0;
    const usableW = CW - indent - bulletPad;
    set(o.style ?? 'normal', size, o.color ?? INK);
    const lines = doc.splitTextToSize(text, usableW);
    lines.forEach((ln: string, i: number) => {
      ensure(lh);
      if (o.bullet && i === 0) {
        set('normal', size, ACCENT);
        doc.text('•', M + indent, y);
        set(o.style ?? 'normal', size, o.color ?? INK);
      }
      doc.text(ln, M + indent + bulletPad, y);
      y += lh;
    });
    y += o.gap ?? 6;
  };

  const rule = (gapBefore = 2, gapAfter = 14) => {
    y += gapBefore;
    ensure(4);
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.7);
    doc.line(M, y, W - M, y);
    y += gapAfter;
  };

  // A filled rounded box that fits `lines` of `size`, with a header line
  const calloutBox = (opts: { title?: string; titleColor?: [number, number, number]; body: string; bg: [number, number, number]; accentBar?: boolean }) => {
    const pad = 14;
    const size = 10;
    const lh = size * 1.5;
    const bodyLines: string[] = doc.splitTextToSize(mdToText(opts.body), CW - pad * 2);
    const titleH = opts.title ? size * 1.6 : 0;
    const boxH = pad * 2 + titleH + bodyLines.length * lh;
    ensure(boxH + 6);
    doc.setFillColor(opts.bg[0], opts.bg[1], opts.bg[2]);
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.6);
    doc.roundedRect(M, y, CW, boxH, 9, 9, 'FD');
    if (opts.accentBar) {
      doc.setFillColor((opts.titleColor ?? ACCENT)[0], (opts.titleColor ?? ACCENT)[1], (opts.titleColor ?? ACCENT)[2]);
      doc.roundedRect(M, y, 4, boxH, 2, 2, 'F');
    }
    let cy = y + pad + size;
    if (opts.title) {
      set('bold', size + 0.5, opts.titleColor ?? ACCENT);
      doc.text(opts.title, M + pad, cy);
      cy += titleH;
    }
    set('normal', size, INK);
    bodyLines.forEach((ln) => { doc.text(ln, M + pad, cy); cy += lh; });
    y += boxH + 12;
  };

  /* ---- Title page ---- */
  doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.rect(M, y, 40, 4, 'F');
  y += 26;
  set('bold', 26, INK);
  doc.splitTextToSize(course.title, CW).forEach((ln: string) => { ensure(32); doc.text(ln, M, y); y += 31; });
  y += 4;
  set('normal', 10, MUTED);
  doc.text([course.category, course.author].filter(Boolean).join('   •   ').toUpperCase(), M, y);
  y += 22;
  if (course.description) para(mdToText(course.description), { size: 12, color: SUB, lh: 1.5, gap: 10 });
  rule(6, 20);

  /* ---- Table of contents ---- */
  const modules = course.modules || [];
  if (modules.length) {
    set('bold', 9, MUTED);
    doc.text('TABLE DES MATIÈRES', M, y);
    y += 18;
    modules.forEach((mod, mi) => {
      para(`${String(mi + 1).padStart(2, '0')}.  ${mod.title}`, { size: 11, style: 'bold', gap: 3 });
      (mod.lessons || []).forEach((les, li) => {
        para(`${mi + 1}.${li + 1}  ${les.title}`, { size: 10, color: SUB, indent: 22, gap: 2 });
      });
      y += 4;
    });
  }

  /* ---- Content ---- */
  modules.forEach((mod, mi) => {
    doc.addPage();
    y = M;
    set('bold', 9, ACCENT);
    doc.text(`MODULE ${String(mi + 1).padStart(2, '0')}`, M, y);
    y += 20;
    set('bold', 18, INK);
    doc.splitTextToSize(mod.title, CW).forEach((ln: string) => { ensure(24); doc.text(ln, M, y); y += 23; });
    rule(6, 18);

    (mod.lessons || []).forEach((les, li) => {
      ensure(30);
      set('bold', 13, INK);
      doc.text(`${mi + 1}.${li + 1}`, M, y);
      set('bold', 13, INK);
      doc.splitTextToSize(les.title, CW - 30).forEach((ln: string, k: number) => {
        doc.text(ln, M + 30, y); if (k < 999) y += 18;
      });
      y += 6;

      (les.content || []).forEach((block: any) => {
        if (block.type === 'text') {
          mdToText(block.value).split('\n').filter((p) => p.trim()).forEach((line) => {
            if (isBullet(line)) para(stripBullet(line), { indent: 6, bullet: true, gap: 4 });
            else para(line, { gap: 8, lh: 1.6 });
          });
        } else if (block.type === 'overview' && block.value?.objectives?.length) {
          para('Objectifs pédagogiques', { size: 9, style: 'bold', color: MUTED, gap: 5 });
          block.value.objectives.forEach((ob: string) => para(ob, { indent: 6, bullet: true, gap: 3 }));
          y += 4;
        } else if (block.type === 'insight' && block.value) {
          calloutBox({ title: block.value.title || 'Insight', titleColor: ACCENT, body: block.value.content || '', bg: INSBG, accentBar: true });
        } else if (block.type === 'quiz' && block.value) {
          const opts = (block.value.options || [])
            .map((o: string, i: number) => `${i === block.value.correctAnswer ? '[x]  ' : '[ ]  '}${o}${i === block.value.correctAnswer ? '   (bonne reponse)' : ''}`)
            .join('\n');
          calloutBox({ title: `Quiz — ${block.value.question || ''}`, titleColor: INK, body: opts, bg: BOXBG });
        }
      });
    });
  });

  /* ---- Header + footer on every page ---- */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    set('normal', 8, MUTED);
    doc.text(`${i} / ${pages}`, W / 2, H - 30, { align: 'center' });
    if (i > 1) {
      set('normal', 8, MUTED);
      doc.text(course.title.length > 70 ? course.title.slice(0, 70) + '…' : course.title, M, 34);
      doc.text('BLACKMIND', W - M, 34, { align: 'right' });
      doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
      doc.setLineWidth(0.5);
      doc.line(M, 42, W - M, 42);
    }
  }

  return doc;
};

export const exportCoursePdf = async (course: Course): Promise<void> => {
  const doc = await buildCoursePdfDoc(course);
  doc.save(`${slugify(course.title)}.pdf`);
};

export const buildCoursePdfBlob = async (course: Course): Promise<Blob> => {
  const doc = await buildCoursePdfDoc(course);
  return doc.output('blob');
};

/* ================================================================== */
/* DOCX — styled document with the docx library                       */
/* ================================================================== */

// Builds the DOCX as a Blob without triggering a browser download — reused
// both by exportCourseDocx (local download) and the Google Drive upload path
// (Drive auto-converts an uploaded .docx into a native Google Doc).
export const buildCourseDocxBlob = async (course: Course): Promise<Blob> => {
  const docx = await import('docx');
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
    Table, TableRow, TableCell, WidthType, Footer, PageNumber, ShadingType,
  } = docx;

  const ACCENT = '4F46E5';
  const INK = '1A1A1A';
  const MUTED = '6B7280';

  const runs = (line: string, base: any = {}) =>
    mdSegments(line).map((s) => new TextRun({ text: s.text, bold: s.bold || base.bold, italics: base.italics, color: base.color, size: base.size }));

  const body: any[] = [];

  const pushMarkdown = (md: string) => {
    String(md || '').split('\n').forEach((raw) => {
      const line = mdLineClean(raw);
      if (!line) return;
      if (isBullet(line)) {
        body.push(new Paragraph({ children: runs(stripBullet(line)), bullet: { level: 0 }, spacing: { after: 60 } }));
      } else {
        body.push(new Paragraph({ children: runs(line), alignment: AlignmentType.JUSTIFIED, spacing: { after: 160, line: 300 } }));
      }
    });
  };

  // one-cell shaded table used as a callout box
  const callout = (title: string, titleColor: string, lines: { text: string; bold?: boolean }[], fill: string) => {
    const children: any[] = [
      new Paragraph({ children: [new TextRun({ text: title, bold: true, color: titleColor, size: 21 })], spacing: { after: 100 } }),
      ...lines.map((l) => new Paragraph({ children: [new TextRun({ text: l.text, bold: l.bold, size: 21, color: INK })], spacing: { after: 40 } })),
    ];
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
        left: { style: BorderStyle.SINGLE, size: title.startsWith('Quiz') ? 4 : 24, color: title.startsWith('Quiz') ? 'E5E7EB' : ACCENT },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
      rows: [new TableRow({
        children: [new TableCell({
          shading: { type: ShadingType.CLEAR, color: 'auto', fill },
          margins: { top: 160, bottom: 160, left: 200, right: 200 },
          children,
        })],
      })],
    });
  };

  /* ---- Title block ---- */
  body.push(new Paragraph({ text: course.title, heading: HeadingLevel.TITLE, spacing: { after: 80 } }));
  body.push(new Paragraph({
    children: [new TextRun({ text: [course.category, course.author, today()].filter(Boolean).join('   •   ').toUpperCase(), color: MUTED, size: 18 })],
    spacing: { after: 160 },
  }));
  if (course.description) {
    body.push(new Paragraph({ children: [new TextRun({ text: mdToText(course.description), italics: true, color: '4B5563', size: 24 })], spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'DDDDDD', space: 8 } } }));
  }

  /* ---- Table of contents ---- */
  const modules = course.modules || [];
  if (modules.length) {
    body.push(new Paragraph({ children: [new TextRun({ text: 'TABLE DES MATIÈRES', bold: true, color: MUTED, size: 18 })], spacing: { before: 160, after: 120 } }));
    modules.forEach((mod, mi) => {
      body.push(new Paragraph({ children: [new TextRun({ text: `${String(mi + 1).padStart(2, '0')}.  ${mod.title}`, bold: true, size: 22 })], spacing: { after: 40 } }));
      (mod.lessons || []).forEach((les, li) =>
        body.push(new Paragraph({ children: [new TextRun({ text: `${mi + 1}.${li + 1}  ${les.title}`, color: MUTED, size: 20 })], indent: { left: 360 }, spacing: { after: 20 } })));
    });
  }

  /* ---- Content ---- */
  modules.forEach((mod, mi) => {
    body.push(new Paragraph({ children: [new TextRun({ text: `MODULE ${String(mi + 1).padStart(2, '0')}`, bold: true, color: ACCENT, size: 18 })], pageBreakBefore: true, spacing: { after: 40 } }));
    body.push(new Paragraph({ text: mod.title, heading: HeadingLevel.HEADING_1, spacing: { after: 120 } }));
    (mod.lessons || []).forEach((les, li) => {
      body.push(new Paragraph({ text: `${mi + 1}.${li + 1}  ${les.title}`, heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 80 } }));
      (les.content || []).forEach((block: any) => {
        if (block.type === 'text') {
          pushMarkdown(block.value);
        } else if (block.type === 'overview' && block.value?.objectives?.length) {
          body.push(new Paragraph({ children: [new TextRun({ text: 'Objectifs pédagogiques', bold: true, color: MUTED, size: 18 })], spacing: { after: 60 } }));
          block.value.objectives.forEach((ob: string) => body.push(new Paragraph({ children: runs(ob), bullet: { level: 0 }, spacing: { after: 40 } })));
        } else if (block.type === 'insight' && block.value) {
          body.push(callout(block.value.title || 'Insight', ACCENT, mdToText(block.value.content).split('\n').filter(Boolean).map((t) => ({ text: t })), 'F4F3FF'));
          body.push(new Paragraph({ text: '', spacing: { after: 120 } }));
        } else if (block.type === 'quiz' && block.value) {
          const lines = (block.value.options || []).map((o: string, i: number) => ({ text: `${i === block.value.correctAnswer ? '✔  ' : '•  '}${o}`, bold: i === block.value.correctAnswer }));
          body.push(callout(`Quiz — ${block.value.question || ''}`, INK, lines, 'F3F4F6'));
          body.push(new Paragraph({ text: '', spacing: { after: 120 } }));
        }
      });
    });
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22, color: INK } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { size: 52, bold: true, color: INK, font: 'Calibri' }, paragraph: { spacing: { after: 120 } } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, color: INK, font: 'Calibri' }, paragraph: { spacing: { before: 240, after: 120 }, border: { bottom: { color: 'DDDDDD', space: 6, style: BorderStyle.SINGLE, size: 6 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: '333333', font: 'Calibri' }, paragraph: { spacing: { before: 200, after: 80 } } },
      ],
    },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: ['Page ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], color: MUTED, size: 16 })],
          })],
        }),
      },
      children: body,
    }],
  });

  return Packer.toBlob(doc);
};

export const exportCourseDocx = async (course: Course): Promise<void> => {
  const blob = await buildCourseDocxBlob(course);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(course.title)}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
