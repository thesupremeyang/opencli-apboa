import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError, EmptyResultError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';
import fs from 'node:fs';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'agent-update',
  description: '更新已有智能体（支持 5 步配置）',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'id', required: true, positional: true, help: '智能体 ID' },
    // Step 1: 基本信息
    { name: 'name', type: 'string', default: '', help: '【步骤1】新名称（留空则不更新）' },
    { name: 'description', type: 'string', default: '', help: '【步骤1】新描述（留空则不更新）' },
    { name: 'tag', type: 'string', default: '', help: '【步骤1】新标签（留空则不更新）' },
    // Step 2: 模型与提示词
    { name: 'modelConfigId', type: 'string', default: '', help: '【步骤2】新模型配置 ID' },
    { name: 'promptTemplateId', type: 'string', default: '', help: '【步骤2】新提示词模板 ID' },
    { name: 'systemPrompt', type: 'string', default: '', help: '【步骤2】新系统提示词（或 @file:path）' },
    // Step 3: 工具与能力
    { name: 'skillIds', type: 'string', default: '', help: '【步骤3】新技能 ID 列表，逗号分隔' },
    { name: 'toolIds', type: 'string', default: '', help: '【步骤3】新工具 ID 列表，逗号分隔' },
    { name: 'hookIds', type: 'string', default: '', help: '【步骤3】新钩子 ID 列表，逗号分隔' },
    { name: 'sensitiveIds', type: 'string', default: '', help: '【步骤3】新敏感词配置 ID 列表，逗号分隔' },
    // Step 4: 知识库与MCP
    { name: 'knowledgeIds', type: 'string', default: '', help: '【步骤4】新知识库 ID 列表，逗号分隔' },
    { name: 'mcpIds', type: 'string', default: '', help: '【步骤4】新 MCP 服务器 ID 列表，逗号分隔' },
    { name: 'subAgentIds', type: 'string', default: '', help: '【步骤4】新子智能体 ID 列表，逗号分隔' },
    // Step 5: 高级设置
    { name: 'enablePlanning', type: 'string', default: '', help: '【步骤5】启用计划能力: true / false' },
    { name: 'enableMemory', type: 'string', default: '', help: '【步骤5】启用记忆能力: true / false' },
    { name: 'showToolProcess', type: 'string', default: '', help: '【步骤5】显示工具调用过程: true / false' },
    { name: 'enabled', type: 'string', default: '', help: '启用状态: true / false' },
    // Common
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'agentId', 'name', 'updated'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('智能体 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');

    // Fetch existing agent
    let existing;
    try {
      const data = await apiFetch(base, `/api/agent/definition/${id}`);
      existing = data?.data || data;
    } catch (e) {
      throw new EmptyResultError('apboa agent-update', `未找到 ID 为 ${id} 的智能体`);
    }

    if (!existing || !existing.id) {
      throw new EmptyResultError('apboa agent-update', `未找到 ID 为 ${id} 的智能体`);
    }

    // Build update payload
    const payload = { ...existing, id };
    const updatedFields = [];

    // Step 1: 基本信息
    const newName = String(args.name || '').trim();
    if (newName) { payload.name = newName; updatedFields.push('name'); }

    const newDesc = String(args.description || '').trim();
    if (newDesc) { payload.description = newDesc; updatedFields.push('description'); }

    const newTag = String(args.tag || '').trim();
    if (newTag) { payload.tag = newTag; updatedFields.push('tag'); }

    // Step 2: 模型与提示词
    const newModelConfigId = String(args.modelConfigId || '').trim();
    if (newModelConfigId) { payload.modelConfigId = newModelConfigId; updatedFields.push('modelConfigId'); }

    const newPromptTemplateId = String(args.promptTemplateId || '').trim();
    if (newPromptTemplateId) { payload.systemPromptTemplateId = newPromptTemplateId; updatedFields.push('promptTemplateId'); }

    let newPrompt = String(args.systemPrompt || '').trim();
    if (newPrompt) {
      if (newPrompt.startsWith('@file:')) {
        const filePath = newPrompt.slice(6);
        if (!fs.existsSync(filePath)) {
          throw new ArgumentError(`提示词文件不存在: ${filePath}`);
        }
        newPrompt = fs.readFileSync(filePath, 'utf-8');
      }
      payload.systemPrompt = newPrompt;
      updatedFields.push('systemPrompt');
    }

    // Step 3: 工具与能力
    const newSkillIds = String(args.skillIds || '').trim();
    if (newSkillIds) {
      payload.skill = newSkillIds.split(',').map(s => s.trim()).filter(Boolean);
      updatedFields.push('skill');
    }

    const newToolIds = String(args.toolIds || '').trim();
    if (newToolIds) {
      payload.tool = newToolIds.split(',').map(s => s.trim()).filter(Boolean);
      updatedFields.push('tool');
    }

    const newHookIds = String(args.hookIds || '').trim();
    if (newHookIds) {
      payload.hook = newHookIds.split(',').map(s => s.trim()).filter(Boolean);
      updatedFields.push('hook');
    }

    const newSensitiveIds = String(args.sensitiveIds || '').trim();
    if (newSensitiveIds) {
      payload.sensitive = newSensitiveIds.split(',').map(s => s.trim()).filter(Boolean);
      updatedFields.push('sensitive');
    }

    // Step 4: 知识库与MCP
    const newKnowledgeIds = String(args.knowledgeIds || '').trim();
    if (newKnowledgeIds) {
      payload.knowledgeBase = newKnowledgeIds.split(',').map(s => s.trim()).filter(Boolean);
      updatedFields.push('knowledgeBase');
    }

    const newMcpIds = String(args.mcpIds || '').trim();
    if (newMcpIds) {
      payload.mcp = newMcpIds.split(',').map(s => s.trim()).filter(Boolean);
      updatedFields.push('mcp');
    }

    const newSubAgentIds = String(args.subAgentIds || '').trim();
    if (newSubAgentIds) {
      payload.subAgent = newSubAgentIds.split(',').map(s => s.trim()).filter(Boolean);
      updatedFields.push('subAgent');
    }

    // Step 5: 高级设置
    const newEnablePlanning = String(args.enablePlanning || '').trim().toLowerCase();
    if (newEnablePlanning === 'true' || newEnablePlanning === 'false') {
      payload.enablePlanning = newEnablePlanning === 'true';
      updatedFields.push('enablePlanning');
    }

    const newEnableMemory = String(args.enableMemory || '').trim().toLowerCase();
    if (newEnableMemory === 'true' || newEnableMemory === 'false') {
      payload.enableMemory = newEnableMemory === 'true';
      updatedFields.push('enableMemory');
    }

    const newShowToolProcess = String(args.showToolProcess || '').trim().toLowerCase();
    if (newShowToolProcess === 'true' || newShowToolProcess === 'false') {
      payload.showToolProcess = newShowToolProcess === 'true';
      updatedFields.push('showToolProcess');
    }

    const newEnabled = String(args.enabled || '').trim().toLowerCase();
    if (newEnabled === 'true' || newEnabled === 'false') {
      payload.enabled = newEnabled === 'true';
      updatedFields.push('enabled');
    }

    // PUT request
    const url = `${base}/api/agent/definition`;
    const headers = {
      ...authHeaders(),
      'Content-Type': 'application/json',
    };

    let resp;
    try {
      resp = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (e) {
      throw new CommandExecutionError(`更新智能体失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`更新智能体失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    return [{
      success: true,
      agentId: id,
      name: payload.name,
      updated: updatedFields.join(', ') || 'none',
    }];
  },
});
