import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch, buildQuery } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'hook-list',
  description: '列出钩子配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'read',
  args: [
    { name: 'page', type: 'int', default: 1, help: '页码' },
    { name: 'size', type: 'int', default: 20, help: '每页数量' },
    { name: 'keyword', type: 'string', default: '', help: '搜索关键词' },
    { name: 'hookType', type: 'string', default: '', help: '钩子类型: BUILTIN / CUSTOM' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['id', 'name', 'hookType', 'description', 'priority', 'enabled', 'updatedAt'],
  func: async (args) => {
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const query = buildQuery({
      current: args.page,
      size: args.size,
      keyword: args.keyword || undefined,
      hookType: args.hookType || undefined,
    });

    const data = await apiFetch(base, `/api/hook-config/page${query}`);
    const records = data?.data?.records || data?.records || [];

    if (!records.length) {
      throw new EmptyResultError('apboa hook-list', '没有找到钩子配置');
    }

    return records.map((it) => ({
      id: it.id,
      name: it.name,
      hookType: it.hookType,
      description: it.description,
      priority: it.priority,
      enabled: it.enabled,
      updatedAt: it.updatedAt,
    }));
  },
});
