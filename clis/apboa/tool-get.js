import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'tool-get',
  description: '获取工具配置详情',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'read',
  args: [
    { name: 'id', required: true, positional: true, help: '工具 ID' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['id', 'name', 'toolId', 'description', 'category', 'toolType', 'language', 'version', 'needConfirm', 'enabled', 'code'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('工具 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const data = await apiFetch(base, `/api/tool/${id}`);
    const tool = data?.data || data;

    if (!tool || !tool.id) {
      throw new EmptyResultError('apboa tool-get', `未找到 ID 为 ${id} 的工具配置`);
    }

    return [{
      id: tool.id,
      name: tool.name,
      toolId: tool.toolId,
      description: tool.description,
      category: tool.category,
      toolType: tool.toolType,
      language: tool.language || '',
      version: tool.version || '',
      needConfirm: tool.needConfirm || false,
      enabled: tool.enabled,
      code: tool.code || '',
    }];
  },
});
