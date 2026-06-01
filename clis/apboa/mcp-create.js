import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'mcp-create',
  description: '创建 MCP 服务器配置',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'name', required: true, help: 'MCP 服务器名称' },
    { name: 'description', required: true, help: '描述' },
    { name: 'protocol', type: 'string', default: 'HTTP', help: '协议: HTTP / SSE / STDIO' },
    { name: 'url', type: 'string', default: '', help: '服务地址（HTTP/SSE 协议必填）' },
    { name: 'command', type: 'string', default: '', help: '命令（STDIO 协议必填）' },
    { name: 'args', type: 'string', default: '', help: '命令参数，逗号分隔（STDIO 协议）' },
    { name: 'env', type: 'string', default: '', help: '环境变量，格式 KEY=VALUE,KEY2=VALUE2（STDIO 协议）' },
    { name: 'queryParams', type: 'string', default: '', help: '查询参数，格式 KEY=VALUE,KEY2=VALUE2（HTTP/SSE 协议）' },
    { name: 'headers', type: 'string', default: '', help: '请求头，格式 KEY=VALUE,KEY2=VALUE2（HTTP/SSE 协议）' },
    { name: 'timeout', type: 'int', default: 30000, help: '超时时间（毫秒）' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'mcpId', 'name', 'protocol'],
  func: async (args) => {
    const name = String(args.name || '').trim();
    const description = String(args.description || '').trim();

    if (!name) throw new ArgumentError('MCP 服务器名称不能为空');
    if (!description) throw new ArgumentError('描述不能为空');

    const protocol = String(args.protocol || 'HTTP').toUpperCase();
    if (!['HTTP', 'SSE', 'STDIO'].includes(protocol)) {
      throw new ArgumentError('协议类型必须是 HTTP、SSE 或 STDIO');
    }

    const timeout = Number(args.timeout) || 30000;
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');

    // Build protocolConfig based on protocol type
    let protocolConfig = {};

    if (protocol === 'HTTP' || protocol === 'SSE') {
      const url = String(args.url || '').trim();
      if (!url) throw new ArgumentError('HTTP/SSE 协议必须提供 URL');

      const queryParams = String(args.queryParams || '')
        .split(',')
        .filter(Boolean)
        .map(pair => {
          const [key, value] = pair.split('=');
          return { key: key?.trim() || '', value: value?.trim() || '' };
        });

      const headers = String(args.headers || '')
        .split(',')
        .filter(Boolean)
        .map(pair => {
          const [key, value] = pair.split('=');
          return { key: key?.trim() || '', value: value?.trim() || '' };
        });

      protocolConfig = { url, queryParams, headers };
    } else if (protocol === 'STDIO') {
      const command = String(args.command || '').trim();
      if (!command) throw new ArgumentError('STDIO 协议必须提供命令');

      const cmdArgs = String(args.args || '')
        .split(',')
        .filter(Boolean)
        .map(a => a.trim());

      const env = String(args.env || '')
        .split(',')
        .filter(Boolean)
        .map(pair => {
          const [key, value] = pair.split('=');
          return { key: key?.trim() || '', value: value?.trim() || '' };
        });

      protocolConfig = { command, args: cmdArgs, env, encoding: 'UTF-8' };
    }

    const payload = {
      name,
      description,
      protocol,
      mode: 'SYNC',
      timeout,
      protocolConfig,
    };

    const url = `${base}/api/mcp/server`;
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
      throw new CommandExecutionError(`创建 MCP 服务器失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`创建 MCP 服务器失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const data = await resp.json();
    const result = data?.data || data;

    return [{
      success: true,
      mcpId: result?.id || null,
      name,
      protocol,
    }];
  },
});
