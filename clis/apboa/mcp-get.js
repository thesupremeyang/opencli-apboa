import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'mcp-get',
  description: '获取 MCP 服务器配置详情',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'read',
  args: [
    { name: 'id', required: true, positional: true, help: 'MCP 服务器 ID' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['id', 'name', 'protocol', 'mode', 'description', 'url', 'timeout', 'healthStatus', 'enabled'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('MCP 服务器 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const data = await apiFetch(base, `/api/mcp/server/${id}`);
    const mcp = data?.data || data;

    if (!mcp || !mcp.id) {
      throw new EmptyResultError('apboa mcp-get', `未找到 ID 为 ${id} 的 MCP 服务器配置`);
    }

    const config = mcp.protocolConfig || {};
    const url = config.url || config.command || '';

    return [{
      id: mcp.id,
      name: mcp.name,
      protocol: mcp.protocol,
      mode: mcp.mode,
      description: mcp.description,
      url,
      timeout: mcp.timeout,
      healthStatus: mcp.healthStatus || 'UNKNOWN',
      enabled: mcp.enabled,
    }];
  },
});
