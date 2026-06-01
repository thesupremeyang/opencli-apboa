import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError, EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';
import fs from 'node:fs';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'tool-update',
  description: '更新工具配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'id', required: true, positional: true, help: '工具 ID' },
    { name: 'name', type: 'string', default: '', help: '新名称（留空则不更新）' },
    { name: 'description', type: 'string', default: '', help: '新描述（留空则不更新）' },
    { name: 'category', type: 'string', default: '', help: '新分类（留空则不更新）' },
    { name: 'code', type: 'string', default: '', help: '新代码（或 @file:path）' },
    { name: 'version', type: 'string', default: '', help: '新版本号（留空则不更新）' },
    { name: 'needConfirm', type: 'string', default: '', help: '是否需要确认: true / false' },
    { name: 'enabled', type: 'string', default: '', help: '启用状态: true / false' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'toolId', 'name', 'updated'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('工具 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');

    // Fetch existing tool
    let existing;
    try {
      const data = await apiFetch(base, `/api/tool/${id}`);
      existing = data?.data || data;
    } catch (e) {
      throw new EmptyResultError('apboa tool-update', `未找到 ID 为 ${id} 的工具配置`);
    }

    if (!existing || !existing.id) {
      throw new EmptyResultError('apboa tool-update', `未找到 ID 为 ${id} 的工具配置`);
    }

    // Build update payload
    const payload = { ...existing, id };

    const newName = String(args.name || '').trim();
    if (newName) payload.name = newName;

    const newDesc = String(args.description || '').trim();
    if (newDesc) payload.description = newDesc;

    const newCategory = String(args.category || '').trim();
    if (newCategory) payload.category = newCategory;

    let newCode = String(args.code || '').trim();
    if (newCode) {
      if (newCode.startsWith('@file:')) {
        const filePath = newCode.slice(6);
        if (!fs.existsSync(filePath)) {
          throw new ArgumentError(`代码文件不存在: ${filePath}`);
        }
        newCode = fs.readFileSync(filePath, 'utf-8');
      }
      payload.code = newCode;
    }

    const newVersion = String(args.version || '').trim();
    if (newVersion) payload.version = newVersion;

    const newNeedConfirm = String(args.needConfirm || '').trim().toLowerCase();
    if (newNeedConfirm === 'true') payload.needConfirm = true;
    if (newNeedConfirm === 'false') payload.needConfirm = false;

    const newEnabled = String(args.enabled || '').trim().toLowerCase();
    if (newEnabled === 'true') payload.enabled = true;
    if (newEnabled === 'false') payload.enabled = false;

    const url = `${base}/api/tool`;
    const headers = {
      ...authHeaders(),
      'Content-Type': 'application/json',
    };

    let resp;
    try {
      resp = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (e) {
      throw new CommandExecutionError(`更新工具失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`更新工具失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const updatedFields = [];
    if (newName) updatedFields.push('name');
    if (newDesc) updatedFields.push('description');
    if (newCategory) updatedFields.push('category');
    if (newCode) updatedFields.push('code');
    if (newVersion) updatedFields.push('version');
    if (newNeedConfirm) updatedFields.push('needConfirm');
    if (newEnabled) updatedFields.push('enabled');

    return [{
      success: true,
      toolId: existing.toolId || id,
      name: payload.name,
      updated: updatedFields.join(', ') || 'none',
    }];
  },
});
