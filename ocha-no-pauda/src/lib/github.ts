/**
 * Tiny GitHub REST client used by the owner menu (/admin).
 * The site is static (GitHub Pages), so "saving" = committing a file to the repo;
 * the Pages workflow then rebuilds and republishes the site automatically.
 */

export const REPO = process.env.NEXT_PUBLIC_GH_REPO || "alkuwarik079-gif/Mm-";
export const BRANCH = "main";
/** folder of the website inside the repository */
export const APP_DIR = "ocha-no-pauda";
export const STORE_PATH = `${APP_DIR}/src/data/store.json`;

const API = "https://api.github.com";

export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function gh<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = (await res.json()).message || msg;
    } catch {}
    throw new GitHubError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

/** confirms the key works and can write to the repository */
export async function checkToken(token: string) {
  const repo = await gh<{ permissions?: { push?: boolean } }>(token, `/repos/${REPO}`);
  if (!repo.permissions?.push) throw new GitHubError(403, "This key can't edit the website. Give it “Contents: Read and write”.");
  return true;
}

const toB64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};
const fromB64 = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

export async function readJson<T>(token: string, path: string): Promise<{ data: T; sha: string }> {
  const f = await gh<{ content: string; sha: string }>(token, `/repos/${REPO}/contents/${path}?ref=${BRANCH}`);
  return { data: JSON.parse(fromB64(f.content)) as T, sha: f.sha };
}

export async function writeFile(token: string, path: string, base64: string, message: string, sha?: string) {
  const r = await gh<{ content: { sha: string } }>(token, `/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: base64, branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  return r.content.sha;
}

export const writeJson = (token: string, path: string, data: unknown, message: string, sha?: string) =>
  writeFile(token, path, toB64(JSON.stringify(data, null, 2) + "\n"), message, sha);

export type RunState = { status: string; conclusion: string | null; createdAt: string };

/** the most recent publish of the website */
export async function latestPublish(token: string): Promise<RunState | null> {
  const r = await gh<{ workflow_runs: { status: string; conclusion: string | null; created_at: string }[] }>(
    token,
    `/repos/${REPO}/actions/workflows/pages.yml/runs?per_page=1&branch=${BRANCH}`,
  );
  const x = r.workflow_runs[0];
  return x ? { status: x.status, conclusion: x.conclusion, createdAt: x.created_at } : null;
}

/** shrink a photo in the browser and return it as base64 JPEG (no data: prefix) */
export async function photoToJpegBase64(file: File, max = 1400): Promise<{ b64: string; preview: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("That file isn't a photo we can read."));
      i.src = url;
    });
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const preview = c.toDataURL("image/jpeg", 0.86);
    return { b64: preview.split(",")[1], preview };
  } finally {
    URL.revokeObjectURL(url);
  }
}
