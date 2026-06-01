import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError } from '@jackwener/opencli/errors';
import { authHeaders } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'mcp-delete',
  description: '删除 MCP 服务器配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'id', required: true, positional: true, help: 'MCP 服务器 ID' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'mcpId', 'deleted'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('MCP 服务器 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const url = `${base}/api/mcp/server/${id}`;
    const headers = authHeaders();

    let resp;
    try {
      resp = await fetch(url, {
        method: 'DELETE',
        headers,
      });
    } catch (e) {
      throw new CommandExecutionError(`删除 MCP 服务器失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`删除 MCP 服务器失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    return [{
      success: true,
      mcpId: id,
      deleted: true,
    }];
  },
});
