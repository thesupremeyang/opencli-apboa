import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch, buildQuery } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'agent-list',
  description: '列出平台上的所有智能体',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'read',
  args: [
    { name: 'page', type: 'int', default: 1, help: '页码' },
    { name: 'size', type: 'int', default: 20, help: '每页数量' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['id', 'name', 'agentCode', 'description', 'enabled', 'createdAt'],
  func: async (args) => {
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const query = buildQuery({
      page: args.page,
      size: args.size,
    });

    const data = await apiFetch(base, `/api/agent/definition/page${query}`);
    const records = data?.data?.records || data?.records || [];

    if (!records.length) {
      throw new EmptyResultError('apboa agent-list', '没有找到智能体');
    }

    return records.map((it) => ({
      id: it.id,
      name: it.name,
      agentCode: it.agentCode,
      description: it.description,
      enabled: it.enabled,
      createdAt: it.createdAt,
    }));
  },
});
