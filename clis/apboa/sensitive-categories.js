import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'sensitive-categories',
  description: '列出敏感词分类标签',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'read',
  args: [
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['category'],
  func: async (args) => {
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const data = await apiFetch(base, '/api/sensitive/config/get/categories');
    const categories = data?.data || [];

    if (!categories.length) {
      throw new EmptyResultError('apboa sensitive-categories', '没有找到敏感词分类');
    }

    return categories.map((cat) => ({
      category: cat,
    }));
  },
});
