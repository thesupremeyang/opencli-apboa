import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError, EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'sensitive-update',
  description: '更新敏感词配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'id', required: true, positional: true, help: '配置 ID' },
    { name: 'name', type: 'string', default: '', help: '新名称（留空则不更新）' },
    { name: 'category', type: 'string', default: '', help: '新分类（留空则不更新）' },
    { name: 'words', type: 'string', default: '', help: '新敏感词列表，逗号分隔（留空则不更新）' },
    { name: 'description', type: 'string', default: '', help: '新描述（留空则不更新）' },
    { name: 'action', type: 'string', default: '', help: '新处理动作: BLOCK / WARN / REPLACE（留空则不更新）' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'configId', 'name', 'updated'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('配置 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');

    // Fetch existing config
    let existing;
    try {
      const data = await apiFetch(base, `/api/sensitive/config/${id}`);
      existing = data?.data || data;
    } catch (e) {
      throw new EmptyResultError('apboa sensitive-update', `未找到 ID 为 ${id} 的敏感词配置`);
    }

    if (!existing || !existing.id) {
      throw new EmptyResultError('apboa sensitive-update', `未找到 ID 为 ${id} 的敏感词配置`);
    }

    // Build update payload
    const payload = { ...existing, id };

    const newName = String(args.name || '').trim();
    if (newName) payload.name = newName;

    const newCategory = String(args.category || '').trim();
    if (newCategory) payload.category = newCategory;

    const newWords = String(args.words || '').trim();
    if (newWords) {
      payload.words = newWords.split(',').map(w => w.trim()).filter(Boolean);
    }

    const newDesc = String(args.description || '').trim();
    if (newDesc) payload.description = newDesc;

    const newAction = String(args.action || '').trim().toUpperCase();
    if (['BLOCK', 'WARN', 'REPLACE'].includes(newAction)) {
      payload.action = newAction;
    }

    const url = `${base}/api/sensitive/config`;
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
      throw new CommandExecutionError(`更新敏感词配置失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`更新敏感词配置失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const updatedFields = [];
    if (newName) updatedFields.push('name');
    if (newCategory) updatedFields.push('category');
    if (newWords) updatedFields.push('words');
    if (newDesc) updatedFields.push('description');
    if (newAction) updatedFields.push('action');

    return [{
      success: true,
      configId: id,
      name: payload.name,
      updated: updatedFields.join(', ') || 'none',
    }];
  },
});
