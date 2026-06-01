import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'agent-get',
  description: '获取智能体详情',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'id', required: true, positional: true, help: '智能体 ID' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['id', 'name', 'agentCode', 'description', 'systemPrompt', 'skillCount', 'enabled'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('智能体 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const data = await apiFetch(base, `/api/agent/definition/${id}`);
    const agent = data?.data || data;

    if (!agent || !agent.id) {
      throw new EmptyResultError('apboa agent-get', `未找到 ID 为 ${id} 的智能体`);
    }

    const skillIds = Array.isArray(agent.skill) ? agent.skill : [];

    return [{
      id: agent.id,
      name: agent.name,
      agentCode: agent.agentCode,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      skillCount: skillIds.length,
      enabled: agent.enabled,
    }];
  },
});
