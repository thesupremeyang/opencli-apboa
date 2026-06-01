import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'hook-get',
  description: '获取钩子配置详情',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'read',
  args: [
    { name: 'id', required: true, positional: true, help: '钩子 ID' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['id', 'name', 'hookType', 'description', 'code', 'priority', 'enabled', 'createdAt'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('钩子 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const data = await apiFetch(base, `/api/hook-config/${id}`);
    const hook = data?.data || data;

    if (!hook || !hook.id) {
      throw new EmptyResultError('apboa hook-get', `未找到 ID 为 ${id} 的钩子配置`);
    }

    return [{
      id: hook.id,
      name: hook.name,
      hookType: hook.hookType,
      description: hook.description,
      code: hook.code || '',
      priority: hook.priority,
      enabled: hook.enabled,
      createdAt: hook.createdAt,
    }];
  },
});
