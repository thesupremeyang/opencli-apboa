import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch, buildQuery } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'mcp-list',
  description: '列出 MCP 服务器配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'read',
  args: [
    { name: 'page', type: 'int', default: 1, help: '页码' },
    { name: 'size', type: 'int', default: 20, help: '每页数量' },
    { name: 'keyword', type: 'string', default: '', help: '搜索关键词' },
    { name: 'protocol', type: 'string', default: '', help: '协议类型: HTTP / SSE / STDIO' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['id', 'name', 'protocol', 'mode', 'description', 'healthStatus', 'enabled', 'updatedAt'],
  func: async (args) => {
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const query = buildQuery({
      page: args.page,
      size: args.size,
      keyword: args.keyword || undefined,
      protocol: args.protocol || undefined,
    });

    const data = await apiFetch(base, `/api/mcp/server/page${query}`);
    const records = data?.data?.records || data?.records || [];

    if (!records.length) {
      throw new EmptyResultError('apboa mcp-list', '没有找到 MCP 服务器配置');
    }

    return records.map((it) => ({
      id: it.id,
      name: it.name,
      protocol: it.protocol,
      mode: it.mode,
      description: it.description,
      healthStatus: it.healthStatus || 'UNKNOWN',
      enabled: it.enabled,
      updatedAt: it.updatedAt,
    }));
  },
});
