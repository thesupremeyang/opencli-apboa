import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch, buildQuery } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'sensitive-list',
  description: '列出敏感词配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'read',
  args: [
    { name: 'page', type: 'int', default: 1, help: '页码' },
    { name: 'size', type: 'int', default: 20, help: '每页数量' },
    { name: 'keyword', type: 'string', default: '', help: '搜索关键词' },
    { name: 'category', type: 'string', default: '', help: '分类筛选' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['id', 'name', 'category', 'description', 'action', 'wordCount', 'createdAt'],
  func: async (args) => {
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const query = buildQuery({
      page: args.page,
      size: args.size,
      keyword: args.keyword || undefined,
      category: args.category || undefined,
    });

    const data = await apiFetch(base, `/api/sensitive/config/page${query}`);
    const records = data?.data?.records || data?.records || [];

    if (!records.length) {
      throw new EmptyResultError('apboa sensitive-list', '没有找到敏感词配置');
    }

    return records.map((it) => ({
      id: it.id,
      name: it.name,
      category: it.category,
      description: it.description,
      action: it.action,
      wordCount: Array.isArray(it.words) ? it.words.length : 0,
      createdAt: it.createdAt,
    }));
  },
});
