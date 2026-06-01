import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError, EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'mcp-update',
  description: '更新 MCP 服务器配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'id', required: true, positional: true, help: 'MCP 服务器 ID' },
    { name: 'name', type: 'string', default: '', help: '新名称（留空则不更新）' },
    { name: 'description', type: 'string', default: '', help: '新描述（留空则不更新）' },
    { name: 'url', type: 'string', default: '', help: '新服务地址（HTTP/SSE 协议）' },
    { name: 'timeout', type: 'int', default: -1, help: '新超时时间（-1 表示不更新）' },
    { name: 'enabled', type: 'string', default: '', help: '启用状态: true / false' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'mcpId', 'name', 'updated'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('MCP 服务器 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');

    // Fetch existing MCP server
    let existing;
    try {
      const data = await apiFetch(base, `/api/mcp/server/${id}`);
      existing = data?.data || data;
    } catch (e) {
      throw new EmptyResultError('apboa mcp-update', `未找到 ID 为 ${id} 的 MCP 服务器配置`);
    }

    if (!existing || !existing.id) {
      throw new EmptyResultError('apboa mcp-update', `未找到 ID 为 ${id} 的 MCP 服务器配置`);
    }

    // Build update payload
    const payload = { ...existing, id };

    const newName = String(args.name || '').trim();
    if (newName) payload.name = newName;

    const newDesc = String(args.description || '').trim();
    if (newDesc) payload.description = newDesc;

    const newUrl = String(args.url || '').trim();
    if (newUrl && payload.protocolConfig) {
      payload.protocolConfig = { ...payload.protocolConfig, url: newUrl };
    }

    const newTimeout = Number(args.timeout);
    if (newTimeout > 0) payload.timeout = newTimeout;

    const newEnabled = String(args.enabled || '').trim().toLowerCase();
    if (newEnabled === 'true') payload.enabled = true;
    if (newEnabled === 'false') payload.enabled = false;

    const url = `${base}/api/mcp/server`;
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
      throw new CommandExecutionError(`更新 MCP 服务器失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`更新 MCP 服务器失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const updatedFields = [];
    if (newName) updatedFields.push('name');
    if (newDesc) updatedFields.push('description');
    if (newUrl) updatedFields.push('url');
    if (newTimeout > 0) updatedFields.push('timeout');
    if (newEnabled) updatedFields.push('enabled');

    return [{
      success: true,
      mcpId: id,
      name: payload.name,
      updated: updatedFields.join(', ') || 'none',
    }];
  },
});
