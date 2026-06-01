import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';
import fs from 'node:fs';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'agent-create',
  description: '创建新的自定义智能体（支持 5 步配置）',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    // Step 1: 基本信息
    { name: 'name', required: true, help: '【步骤1】智能体名称' },
    { name: 'code', required: true, help: '【步骤1】智能体编码（唯一标识）' },
    { name: 'description', type: 'string', default: '', help: '【步骤1】描述' },
    { name: 'tag', type: 'string', default: '', help: '【步骤1】标签' },
    // Step 2: 模型与提示词
    { name: 'modelConfigId', type: 'string', default: '', help: '【步骤2】模型配置 ID' },
    { name: 'promptTemplateId', type: 'string', default: '', help: '【步骤2】提示词模板 ID' },
    { name: 'systemPrompt', type: 'string', default: '', help: '【步骤2】系统提示词（或 @file:path）' },
    // Step 3: 工具与能力
    { name: 'skillIds', type: 'string', default: '', help: '【步骤3】技能 ID 列表，逗号分隔' },
    { name: 'toolIds', type: 'string', default: '', help: '【步骤3】工具 ID 列表，逗号分隔' },
    { name: 'hookIds', type: 'string', default: '', help: '【步骤3】钩子 ID 列表，逗号分隔' },
    { name: 'sensitiveIds', type: 'string', default: '', help: '【步骤3】敏感词配置 ID 列表，逗号分隔' },
    // Step 4: 知识库与MCP
    { name: 'knowledgeIds', type: 'string', default: '', help: '【步骤4】知识库 ID 列表，逗号分隔' },
    { name: 'mcpIds', type: 'string', default: '', help: '【步骤4】MCP 服务器 ID 列表，逗号分隔' },
    { name: 'subAgentIds', type: 'string', default: '', help: '【步骤4】子智能体 ID 列表，逗号分隔' },
    // Step 5: 高级设置
    { name: 'enablePlanning', type: 'bool', default: false, help: '【步骤5】启用计划能力' },
    { name: 'enableMemory', type: 'bool', default: false, help: '【步骤5】启用记忆能力' },
    { name: 'showToolProcess', type: 'bool', default: true, help: '【步骤5】显示工具调用过程' },
    // Common
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'agentId', 'name', 'agentCode', 'steps'],
  func: async (args) => {
    // Step 1: 基本信息
    const name = String(args.name || '').trim();
    const code = String(args.code || '').trim();
    if (!name) throw new ArgumentError('智能体名称不能为空');
    if (!code) throw new ArgumentError('智能体编码不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const description = String(args.description || '');
    const tag = String(args.tag || '');

    // Step 2: 模型与提示词
    let systemPrompt = String(args.systemPrompt || '');
    if (systemPrompt.startsWith('@file:')) {
      const filePath = systemPrompt.slice(6);
      if (!fs.existsSync(filePath)) {
        throw new ArgumentError(`提示词文件不存在: ${filePath}`);
      }
      systemPrompt = fs.readFileSync(filePath, 'utf-8');
    }

    const modelConfigId = String(args.modelConfigId || '').trim() || undefined;
    const promptTemplateId = String(args.promptTemplateId || '').trim() || undefined;

    // Step 3: 工具与能力
    const skillIds = String(args.skillIds || '').split(',').map(s => s.trim()).filter(Boolean);
    const toolIds = String(args.toolIds || '').split(',').map(s => s.trim()).filter(Boolean);
    const hookIds = String(args.hookIds || '').split(',').map(s => s.trim()).filter(Boolean);
    const sensitiveIds = String(args.sensitiveIds || '').split(',').map(s => s.trim()).filter(Boolean);

    // Step 4: 知识库与MCP
    const knowledgeIds = String(args.knowledgeIds || '').split(',').map(s => s.trim()).filter(Boolean);
    const mcpIds = String(args.mcpIds || '').split(',').map(s => s.trim()).filter(Boolean);
    const subAgentIds = String(args.subAgentIds || '').split(',').map(s => s.trim()).filter(Boolean);

    // Step 5: 高级设置
    const enablePlanning = Boolean(args.enablePlanning);
    const enableMemory = Boolean(args.enableMemory);
    const showToolProcess = Boolean(args.showToolProcess);

    // Track which steps have config
    const steps = [];
    if (name && code) steps.push('1-基本信息');
    if (modelConfigId || systemPrompt) steps.push('2-模型提示词');
    if (skillIds.length || toolIds.length || hookIds.length || sensitiveIds.length) steps.push('3-工具能力');
    if (knowledgeIds.length || mcpIds.length || subAgentIds.length) steps.push('4-知识库MCP');
    if (enablePlanning || enableMemory) steps.push('5-高级设置');

    const payload = {
      agentType: 'CUSTOM',
      name,
      agentCode: code,
      description,
      tag,
      modelConfigId,
      systemPromptTemplateId: promptTemplateId,
      systemPrompt,
      skill: skillIds,
      tool: toolIds,
      hook: hookIds,
      sensitive: sensitiveIds,
      knowledgeBase: knowledgeIds,
      mcp: mcpIds,
      mcpBindings: [],
      subAgent: subAgentIds,
      enabled: true,
      enablePlanning,
      enableMemory,
      showToolProcess,
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
      steps: steps.join(', ') || 'basic',
    }];
  },
});
