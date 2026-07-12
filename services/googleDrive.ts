import { Course } from '../types';
import { buildCourseDocxBlob, slugify } from './exportService';

export interface DriveFile {
  id: string;
  webViewLink: string;
}

// Multipart upload to Drive v3. When convertToGoogleDoc is true, Drive
// converts the uploaded file (e.g. a .docx) into a native Google Doc —
// that's how "Ouvrir dans Google Docs" works without a separate Docs API
// integration: Drive does the conversion for us on upload.
export const uploadBlobToDrive = async (
  blob: Blob,
  filename: string,
  sourceMimeType: string,
  accessToken: string,
  convertToGoogleDoc: boolean = false,
): Promise<DriveFile> => {
  const metadata: Record<string, string> = { name: filename };
  if (convertToGoogleDoc) metadata.mimeType = 'application/vnd.google-apps.document';

  const boundary = `blackmind-${Math.random().toString(36).slice(2)}`;
  const fileBuffer = await blob.arrayBuffer();
  const multipartBody = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${sourceMimeType}\r\n\r\n`,
    fileBuffer,
    `\r\n--${boundary}--`,
  ]);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Drive upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
};

// Builds the course DOCX and uploads it converted to a native Google Doc —
// the returned webViewLink opens directly in the Google Docs editor.
export const uploadCourseAsGoogleDoc = async (course: Course, accessToken: string): Promise<DriveFile> => {
  const blob = await buildCourseDocxBlob(course);
  return uploadBlobToDrive(
    blob,
    slugify(course.title),
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    accessToken,
    true,
  );
};

// Saves a media asset (course cover, generated image, AR model...) to the
// user's Drive as-is, no conversion.
export const uploadMediaToDrive = async (mediaUrl: string, filename: string, accessToken: string): Promise<DriveFile> => {
  const res = mediaUrl.startsWith('data:')
    ? await fetch(mediaUrl)
    : await fetch(mediaUrl, { mode: 'cors' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return uploadBlobToDrive(blob, filename, blob.type || 'application/octet-stream', accessToken, false);
};
