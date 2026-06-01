import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'agent-create',
  description: '创建新的智能体',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'name', required: true, help: '智能体名称' },
    { name: 'code', required: true, help: '智能体编码（唯一标识）' },
    { name: 'description', type: 'string', default: '', help: '描述' },
    { name: 'systemPrompt', type: 'string', default: '', help: '系统提示词（或从文件读取：@file:path）' },
    { name: 'skillIds', type: 'string', default: '', help: '技能 ID 列表，逗号分隔' },
    { name: 'modelConfigId', type: 'string', default: '', help: '模型配置 ID' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'agentId', 'name', 'agentCode'],
  func: async (args) => {
    const name = String(args.name || '').trim();
    const code = String(args.code || '').trim();
    if (!name) throw new ArgumentError('智能体名称不能为空');
    if (!code) throw new ArgumentError('智能体编码不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const description = String(args.description || '');
    let systemPrompt = String(args.systemPrompt || '');

    // Support @file:path to read prompt from file
    if (systemPrompt.startsWith('@file:')) {
      const fs = await import('node:fs');
      const filePath = systemPrompt.slice(6);
      if (!fs.existsSync(filePath)) {
        throw new ArgumentError(`提示词文件不存在: ${filePath}`);
      }
      systemPrompt = fs.readFileSync(filePath, 'utf-8');
    }

    const skillIds = String(args.skillIds || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const modelConfigId = String(args.modelConfigId || '').trim() || undefined;

    const payload = {
      agentType: 'CUSTOM',
      name,
      agentCode: code,
      description,
      tag: '',
      modelConfigId,
      systemPromptTemplateId: undefined,
      systemPrompt,
      skill: skillIds,
      tool: [],
      knowledgeBase: [],
      mcp: [],
      mcpBindings: [],
      subAgent: [],
      hook: [],
      enabled: true,
      enablePlanning: false,
      enableMemory: false,
      showToolProcess: true,
    };

    // Remove undefined fields
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    const url = `${base}/api/agent/definition`;
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
      throw new CommandExecutionError(`创建智能体失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`创建智能体失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const data = await resp.json();
    const result = data?.data || data;

    return [{
      success: true,
      agentId: result?.id || null,
      name,
      agentCode: code,
    }];
  },
});
