import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError } from '@jackwener/opencli/errors';
import { authHeaders } from './utils.js';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'skill-upload',
  description: '上传技能包到平台',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'path', required: true, positional: true, help: '技能包 zip 文件路径' },
    { name: 'category', type: 'string', default: 'general', help: '技能分类' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'skillId', 'name', 'category'],
  func: async (args) => {
    const zipPath = String(args.path || '').trim();
    if (!zipPath) throw new ArgumentError('技能包路径不能为空');

    const absPath = path.resolve(zipPath);
    if (!fs.existsSync(absPath)) {
      throw new ArgumentError(`文件不存在: ${absPath}`);
    }

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const category = String(args.category || 'general');

    // Build multipart form data
    const fileBuffer = fs.readFileSync(absPath);
    const fileName = path.basename(absPath);

    // Use FormData to build multipart body
    const boundary = `----FormBoundary${Date.now()}`;
    const parts = [];

    // file field
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`);
    parts.push(`Content-Type: application/zip\r\n\r\n`);
    parts.push(fileBuffer);
    parts.push(`\r\n`);

    // category field
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="category"\r\n\r\n`);
    parts.push(Buffer.from(category, 'utf-8'));
    parts.push(`\r\n`);

    // cover field (empty)
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="cover"\r\n\r\n`);
    parts.push(`\r\n`);

    // closing boundary
    parts.push(`--${boundary}--\r\n`);

    const body = Buffer.concat(parts.map(p => typeof p === 'string' ? Buffer.from(p, 'utf-8') : p));

    const url = `${base}/api/skill/import/upload`;
    const headers = {
      ...authHeaders(),
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    };

    let resp;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
    } catch (e) {
      throw new CommandExecutionError(`上传失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`上传失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const data = await resp.json();
    const result = data?.data || data;

    return [{
      success: true,
      skillId: result?.id || null,
      name: result?.name || fileName,
      category,
    }];
  },
});
