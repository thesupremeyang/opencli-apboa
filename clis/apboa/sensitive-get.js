import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'sensitive-get',
  description: '获取敏感词配置详情',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'read',
  args: [
    { name: 'id', required: true, positional: true, help: '配置 ID' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['id', 'name', 'category', 'description', 'action', 'words', 'createdAt'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('配置 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const data = await apiFetch(base, `/api/sensitive/config/${id}`);
    const config = data?.data || data;

    if (!config || !config.id) {
      throw new EmptyResultError('apboa sensitive-get', `未找到 ID 为 ${id} 的敏感词配置`);
    }

    return [{
      id: config.id,
      name: config.name,
      category: config.category,
      description: config.description,
      action: config.action,
      words: Array.isArray(config.words) ? config.words.join(',') : '',
      createdAt: config.createdAt,
    }];
  },
});
