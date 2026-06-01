import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError, EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'agent-update',
  description: '更新已有智能体',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'id', required: true, positional: true, help: '智能体 ID' },
    { name: 'name', type: 'string', default: '', help: '新名称（留空则不更新）' },
    { name: 'description', type: 'string', default: '', help: '新描述（留空则不更新）' },
    { name: 'systemPrompt', type: 'string', default: '', help: '新系统提示词（或 @file:path）' },
    { name: 'skillIds', type: 'string', default: '', help: '新技能 ID 列表，逗号分隔（留空则不更新）' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'agentId', 'name', 'updated'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('智能体 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');

    // Fetch existing agent
    let existing;
    try {
      const data = await apiFetch(base, `/api/agent/definition/${id}`);
      existing = data?.data || data;
    } catch (e) {
      throw new EmptyResultError('apboa agent-update', `未找到 ID 为 ${id} 的智能体`);
    }

    if (!existing || !existing.id) {
      throw new EmptyResultError('apboa agent-update', `未找到 ID 为 ${id} 的智能体`);
    }

    // Build update payload - only include fields that were explicitly provided
    const payload = { ...existing };

    const newName = String(args.name || '').trim();
    if (newName) payload.name = newName;

    const newDesc = String(args.description || '').trim();
    if (newDesc) payload.description = newDesc;

    let newPrompt = String(args.systemPrompt || '').trim();
    if (newPrompt) {
      if (newPrompt.startsWith('@file:')) {
        const fs = await import('node:fs');
        const filePath = newPrompt.slice(6);
        if (!fs.existsSync(filePath)) {
          throw new ArgumentError(`提示词文件不存在: ${filePath}`);
        }
        newPrompt = fs.readFileSync(filePath, 'utf-8');
      }
      payload.systemPrompt = newPrompt;
    }

    const skillIdsStr = String(args.skillIds || '').trim();
    if (skillIdsStr) {
      payload.skill = skillIdsStr.split(',').map(s => s.trim()).filter(Boolean);
    }

    // PUT request
    const url = `${base}/api/agent/definition`;
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
      throw new CommandExecutionError(`更新智能体失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`更新智能体失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const updatedFields = [];
    if (newName) updatedFields.push('name');
    if (newDesc) updatedFields.push('description');
    if (newPrompt) updatedFields.push('systemPrompt');
    if (skillIdsStr) updatedFields.push('skill');

    return [{
      success: true,
      agentId: id,
      name: payload.name,
      updated: updatedFields.join(', ') || 'none',
    }];
  },
});
