export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  parents?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
}

const DRIVE_API = "https://www.googleapis.com/drive/v3";

const AUDIO_MIME_TYPES = [
  "audio/flac",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/x-flac",
  "audio/mp4",
  "audio/aac",
  "audio/x-m4a",
];

export async function listAudioFiles(
  accessToken: string,
  folderId?: string
): Promise<DriveFile[]> {
  const folderQuery = folderId
    ? `'${folderId}' in parents`
    : `'${process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID}' in parents`;

  const mimeQuery = AUDIO_MIME_TYPES.map((m) => `mimeType='${m}'`).join(
    " or "
  );

  const query = `(${folderQuery}) and (${mimeQuery}) and trashed=false`;

  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: query,
      fields: "nextPageToken, files(id, name, mimeType, size, parents)",
      pageSize: "1000",
      orderBy: "name",
      includeItemsFromAllDrives: "true",
      supportsAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${DRIVE_API}/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Drive API error: ${error.error?.message || res.statusText}`);
    }

    const data = await res.json();
    files.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

export async function listFolders(
  accessToken: string,
  parentId?: string
): Promise<DriveFolder[]> {
  const parent =
    parentId || process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID;
  const query = `'${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const params = new URLSearchParams({
    q: query,
    fields: "files(id, name)",
    pageSize: "100",
    orderBy: "name",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
  });

  const res = await fetch(`${DRIVE_API}/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Drive API error: ${error.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

export function getStreamUrl(fileId: string): string {
  return `/api/drive/stream?fileId=${fileId}`;
}

export function getArtUrl(fileId: string): string {
  return `/api/drive/art?fileId=${fileId}`;
}
