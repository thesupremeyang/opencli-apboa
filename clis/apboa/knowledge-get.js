import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'knowledge-get',
  description: '获取知识库配置详情',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'read',
  args: [
    { name: 'id', required: true, positional: true, help: '知识库 ID' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['id', 'name', 'kbType', 'ragMode', 'description', 'embeddingModel', 'dimension', 'chunkSize', 'topK', 'healthStatus', 'enabled'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('知识库 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const data = await apiFetch(base, `/api/knowledge/config/${id}`);
    const kb = data?.data || data;

    if (!kb || !kb.id) {
      throw new EmptyResultError('apboa knowledge-get', `未找到 ID 为 ${id} 的知识库配置`);
    }

    const conn = kb.connectionConfig || {};
    const retrieval = kb.retrievalConfig || {};

    return [{
      id: kb.id,
      name: kb.name,
      kbType: kb.kbType,
      ragMode: kb.ragMode,
      description: kb.description,
      embeddingModel: conn.embeddingModel || '',
      dimension: conn.dimension || 0,
      chunkSize: retrieval.chunkSize || 0,
      topK: retrieval.topK || 0,
      healthStatus: kb.healthStatus || 'UNKNOWN',
      enabled: kb.enabled,
    }];
  },
});
