import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError } from '@jackwener/opencli/errors';
import { saveToken, publicFetch } from './utils.js';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

cli({
  site: 'apboa',
  name: 'login',
  description: '登录 Apboa 智能体平台并保存 token',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'username', required: true, positional: true, help: '用户名' },
    { name: 'password', required: true, help: '密码' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'username', 'tokenSaved'],
  func: async (args) => {
    const username = String(args.username || '').trim();
    const password = String(args.password || '').trim();
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');

    if (!username) throw new ArgumentError('用户名不能为空');
    if (!password) throw new ArgumentError('密码不能为空');

    const url = `${base}/api/auth/login`;
    let data;
    try {
      data = await publicFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch (e) {
      throw new CommandExecutionError(`登录失败: ${e.message}`);
    }

    const token = data?.accessToken || data?.data?.accessToken;
    if (!token) {
      throw new CommandExecutionError(`登录成功但未返回 token，响应: ${JSON.stringify(data).slice(0, 200)}`);
    }

    saveToken(token);

    return [{
      success: true,
      username,
      tokenSaved: true,
    }];
  },
});
