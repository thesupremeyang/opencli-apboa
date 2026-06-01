import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch, buildQuery } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'knowledge-list',
  description: '列出知识库配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'read',
  args: [
    { name: 'page', type: 'int', default: 1, help: '页码' },
    { name: 'size', type: 'int', default: 20, help: '每页数量' },
    { name: 'keyword', type: 'string', default: '', help: '搜索关键词' },
    { name: 'kbType', type: 'string', default: '', help: '知识库类型: LOCAL / BAILIAN / DIFY / RAGFLOW' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['id', 'name', 'kbType', 'ragMode', 'description', 'healthStatus', 'enabled', 'updatedAt'],
  func: async (args) => {
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const query = buildQuery({
      page: args.page,
      size: args.size,
      keyword: args.keyword || undefined,
      kbType: args.kbType || undefined,
    });

    const data = await apiFetch(base, `/api/knowledge/config/page${query}`);
    const records = data?.data?.records || data?.records || [];

    if (!records.length) {
      throw new EmptyResultError('apboa knowledge-list', '没有找到知识库配置');
    }

    return records.map((it) => ({
      id: it.id,
      name: it.name,
      kbType: it.kbType,
      ragMode: it.ragMode,
      description: it.description,
      healthStatus: it.healthStatus || 'UNKNOWN',
      enabled: it.enabled,
      updatedAt: it.updatedAt,
    }));
  },
});
