import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'knowledge-create',
  description: '创建知识库配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'name', required: true, help: '知识库名称' },
    { name: 'description', required: true, help: '描述' },
    { name: 'kbType', type: 'string', default: 'LOCAL', help: '类型: LOCAL / BAILIAN / DIFY / RAGFLOW' },
    { name: 'ragMode', type: 'string', default: 'AGENTIC', help: 'RAG模式: AGENTIC' },
    { name: 'providerType', type: 'string', default: 'ollama', help: '模型提供商: ollama / bailian' },
    { name: 'baseUrl', type: 'string', default: 'http://localhost:11434/api/embed', help: '服务地址' },
    { name: 'embeddingModel', type: 'string', default: 'qwen3-embedding:4b', help: '嵌入模型' },
    { name: 'dimension', type: 'int', default: 1024, help: '向量化维度' },
    { name: 'chunkSize', type: 'int', default: 512, help: '分块大小' },
    { name: 'topK', type: 'int', default: 5, help: '检索数量' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'knowledgeId', 'name', 'kbType'],
  func: async (args) => {
    const name = String(args.name || '').trim();
    const description = String(args.description || '').trim();

    if (!name) throw new ArgumentError('知识库名称不能为空');
    if (!description) throw new ArgumentError('描述不能为空');

    const kbType = String(args.kbType || 'LOCAL').toUpperCase();
    const ragMode = String(args.ragMode || 'AGENTIC').toUpperCase();
    const providerType = String(args.providerType || 'ollama');
    const baseUrl = String(args.baseUrl || 'http://localhost:11434/api/embed');
    const embeddingModel = String(args.embeddingModel || 'qwen3-embedding:4b');
    const dimension = Number(args.dimension) || 1024;
    const chunkSize = Number(args.chunkSize) || 512;
    const topK = Number(args.topK) || 5;
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');

    const payload = {
      name,
      description,
      kbType,
      ragMode,
      connectionConfig: {
        providerType,
        baseUrl,
        embeddingModel,
        dimension,
        bufferSizeMb: 50,
        batchSize: 10,
      },
      retrievalConfig: {
        chunkSize,
        chunkOverlap: 64,
        chunkDelimiters: '',
        topK,
        scoreThreshold: 0.5,
      },
    };

    const url = `${base}/api/knowledge/config`;
    const headers = {
      ...authHeaders(),
      'Content-Type': 'application/json',
    };

    let resp;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (e) {
      throw new CommandExecutionError(`创建知识库失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`创建知识库失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const data = await resp.json();
    const result = data?.data || data;

    return [{
      success: true,
      knowledgeId: result?.id || null,
      name,
      kbType,
    }];
  },
});
