import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';
import fs from 'node:fs';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

const DEFAULT_CODE = `import io.agentscope.core.hook.Hook;
import io.agentscope.core.hook.HookEvent;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class CustomHook implements Hook {
    @Override
    public <T extends HookEvent> Mono<T> onEvent(T event) {
        // 自定义逻辑
        return Mono.just(event);
    }
}`;

cli({
  site: 'apboa',
  name: 'hook-create',
  description: '创建自定义钩子',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'name', required: true, help: '钩子名称' },
    { name: 'description', required: true, help: '描述' },
    { name: 'code', type: 'string', default: '', help: 'Java 代码（或 @file:path 从文件读取）' },
    { name: 'priority', type: 'int', default: 1, help: '优先级（数字越小越先执行）' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'hookId', 'name', 'hookType'],
  func: async (args) => {
    const name = String(args.name || '').trim();
    const description = String(args.description || '').trim();

    if (!name) throw new ArgumentError('钩子名称不能为空');
    if (!description) throw new ArgumentError('描述不能为空');

    let code = String(args.code || '').trim();
    if (!code) {
      code = DEFAULT_CODE;
    } else if (code.startsWith('@file:')) {
      const filePath = code.slice(6);
      if (!fs.existsSync(filePath)) {
        throw new ArgumentError(`代码文件不存在: ${filePath}`);
      }
      code = fs.readFileSync(filePath, 'utf-8');
    }

    const priority = Number(args.priority) || 1;
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');

    const payload = {
      name,
      description,
      code,
      priority,
      hookType: 'CUSTOM',
    };

    const url = `${base}/api/hook-config`;
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
      throw new CommandExecutionError(`创建钩子失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`创建钩子失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const data = await resp.json();
    const result = data?.data || data;

    return [{
      success: true,
      hookId: result?.id || null,
      name,
      hookType: 'CUSTOM',
    }];
  },
});
