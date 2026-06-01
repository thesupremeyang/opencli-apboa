import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError } from '@jackwener/opencli/errors';
import { authHeaders } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'hook-delete',
  description: '删除钩子配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'id', required: true, positional: true, help: '钩子 ID' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'hookId', 'deleted'],
  func: async (args) => {
    const id = String(args.id || '').trim();
    if (!id) throw new ArgumentError('钩子 ID 不能为空');

    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');
    const url = `${base}/api/hook-config/${id}`;
    const headers = authHeaders();

    let resp;
    try {
      resp = await fetch(url, {
        method: 'DELETE',
        headers,
      });
    } catch (e) {
      throw new CommandExecutionError(`删除钩子失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`删除钩子失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    return [{
      success: true,
      hookId: id,
      deleted: true,
    }];
  },
});
