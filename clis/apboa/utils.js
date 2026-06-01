import { AuthRequiredError, CommandExecutionError } from '@jackwener/opencli/errors';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Token file path: ~/.apboa/token
const TOKEN_DIR = path.join(os.homedir(), '.apboa');
const TOKEN_FILE = path.join(TOKEN_DIR, 'token');

/**
 * Ensure token directory exists
 */
function ensureTokenDir() {
  if (!fs.existsSync(TOKEN_DIR)) {
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
  }
}

/**
 * Save access token to file
 */
export function saveToken(token) {
  ensureTokenDir();
  fs.writeFileSync(TOKEN_FILE, token, 'utf-8');
}

/**
 * Read access token from file
 */
export function readToken() {
  if (!fs.existsSync(TOKEN_FILE)) {
    return null;
  }
  return fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
}

/**
 * Delete stored token
 */
export function clearToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    fs.unlinkSync(TOKEN_FILE);
  }
}

/**
 * Get auth headers with Bearer token
 * Throws AuthRequiredError if no token found
 */
export function authHeaders() {
  const token = readToken();
  if (!token) {
    throw new AuthRequiredError('apboa', '未登录，请先运行 opencli apboa login <username> <password>');
  }
  return {
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Make authenticated API request
 * @param {string} baseUrl - Platform base URL
 * @param {string} apiPath - API path (e.g., /api/skill/page)
 * @param {object} options - Fetch options
 * @returns {Promise<object>} - Parsed JSON response
 */
export async function apiFetch(baseUrl, apiPath, options = {}) {
  const url = `${baseUrl}${apiPath}`;
  const headers = {
    ...authHeaders(),
    ...options.headers,
  };

  const resp = await fetch(url, {
    ...options,
    headers,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new CommandExecutionError(`API 请求失败: ${resp.status} ${resp.statusText} - ${text}`);
  }

  const data = await resp.json();
  return data;
}

/**
 * Make unauthenticated API request (e.g., login)
 */
export async function publicFetch(url, options = {}) {
  const resp = await fetch(url, options);
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new CommandExecutionError(`请求失败: ${resp.status} ${resp.statusText} - ${text}`);
  }
  return resp.json();
}

/**
 * Build query string from params object
 */
export function buildQuery(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}
