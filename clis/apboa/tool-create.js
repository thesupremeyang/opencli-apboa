import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError, CommandExecutionError } from '@jackwener/opencli/errors';
import { apiFetch, authHeaders } from './utils.js';
import fs from 'node:fs';

const DEFAULT_BASE = 'http://117.72.185.237:3000';

const DEFAULT_CODE = `import java.util.*;
import com.hxh.apboa.core.tool.dynamices.IDynamicAgentTool;
import com.hxh.apboa.core.agui.AgentContext;

import org.springframework.stereotype.Component;

@Component
public class CustomTool implements IDynamicAgentTool {

    @Override
    public Object execute(AgentContext context, Object... args) {
        // 自定义工具逻辑
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return result;
    }
}`;

cli({
  site: 'apboa',
  name: 'tool-create',
  description: '创建自定义工具',
  domain: '117.72.185.237',
  strategy: Strategy.PUBLIC,
  browser: false,
  access: 'write',
  args: [
    { name: 'name', required: true, help: '工具名称' },
    { name: 'toolId', required: true, help: '工具编号（唯一标识）' },
    { name: 'description', required: true, help: '描述' },
    { name: 'category', type: 'string', default: '通用', help: '分类标签' },
    { name: 'code', type: 'string', default: '', help: 'Java 代码（或 @file:path 从文件读取）' },
    { name: 'language', type: 'string', default: 'JAVA', help: '编程语言' },
    { name: 'version', type: 'string', default: '1.0.0', help: '版本号' },
    { name: 'needConfirm', type: 'bool', default: false, help: '是否需要确认' },
    { name: 'base', type: 'string', default: DEFAULT_BASE, help: '平台地址' },
  ],
  columns: ['success', 'toolId', 'name', 'category'],
  func: async (args) => {
    const name = String(args.name || '').trim();
    const toolId = String(args.toolId || '').trim();
    const description = String(args.description || '').trim();

    if (!name) throw new ArgumentError('工具名称不能为空');
    if (!toolId) throw new ArgumentError('工具编号不能为空');
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

    const category = String(args.category || '通用');
    const language = String(args.language || 'JAVA');
    const version = String(args.version || '1.0.0');
    const needConfirm = Boolean(args.needConfirm);
    const base = String(args.base || DEFAULT_BASE).replace(/\/+$/, '');

    const payload = {
      name,
      toolId,
      description,
      category,
      code,
      language,
      version,
      needConfirm,
      toolType: 'CUSTOM',
      inputSchema: [],
    };

    const url = `${base}/api/tool`;
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
      throw new CommandExecutionError(`创建工具失败: ${e.message}`);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new CommandExecutionError(`创建工具失败: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const data = await resp.json();
    const result = data?.data || data;

    return [{
      success: true,
      toolId: result?.toolId || toolId,
      name,
      category,
    }];
  },
});
