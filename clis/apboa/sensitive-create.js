import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'sensitive-create',
  description: '创建敏感词配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'name', required: true, help: '配置名称' },
    { name: 'category', required: true, help: '分类标签' },
    { name: 'words', required: true, help: '敏感词列表，逗号分隔' },
    { name: 'description', type: 'string', default: '', help: '描述' },
    { name: 'action', type: 'string', default: 'BLOCK', help: '处理动作: BLOCK(阻止) / WARN(警告) / REPLACE(替换)' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'configId', 'name', 'category', 'wordCount'],
  func: async (args) => {
    const name = String(args.name || '').trim();
    const category = String(args.category || '').trim();
    const wordsStr = String(args.words || '').trim();

    if (!name) throw new ArgumentError('配置名称不能为空');
    if (!category) throw new ArgumentError('分类标签不能为空');
    if (!wordsStr) throw new ArgumentError('敏感词不能为空');

    const words = wordsStr.split(',').map(w => w.trim()).filter(Boolean);
    const actionRaw = String(args.action || 'BLOCK').toUpperCase();
    const action = ['BLOCK', 'WARN', 'REPLACE'].includes(actionRaw) ? actionRaw : 'BLOCK';
    const description = String(args.description || '');
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');

    const payload = {
      name,
      category,
      description,
      words,
      action,
    };

    const url = `${base}/api/sensitive/config`;
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
      throw new CommandExecutionError(`创建敏感词配置失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`创建敏感词配置失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const data = await resp.json();
    const result = data?.data || data;

    return [{
      success: true,
      configId: result?.id || null,
      name,
      category,
      wordCount: words.length,
    }];
  },
});
