# opencli-apboa

Apboa 智能体平台的 OpenCLI 适配器，支持通过命令行管理技能和智能体。

## 安装

```bash
npm install -g opencli-apboa
```

## 命令列表

| 命令 | 说明 |
|------|------|
| `opencli apboa login <username> --password <pwd>` | 登录平台 |
| `opencli apboa skill-list` | 列出所有技能 |
| `opencli apboa skill-upload <path>` | 上传技能包 |
| `opencli apboa agent-list` | 列出所有智能体 |
| `opencli apboa agent-get <id>` | 获取智能体详情 |
| `opencli apboa agent-create --name <name> --code <code>` | 创建智能体 |
| `opencli apboa agent-update <id> --name <name>` | 更新智能体 |
| `opencli apboa model-list` | 列出模型配置 |
| `opencli apboa prompt-list` | 列出提示词模板 |

## 使用示例

### 1. 登录

```bash
opencli apboa login admin --password Admin@123.com
```

### 2. 查看已有技能

```bash
opencli apboa skill-list
opencli apboa skill-list --size 50
```

### 3. 上传技能包

```bash
opencli apboa skill-upload ./my-skill.zip --category custom
```

### 4. 查看智能体

```bash
opencli apboa agent-list
opencli apboa agent-get <agent-id>
```

### 5. 创建智能体

```bash
opencli apboa agent-create \
  --name "我的助手" \
  --code "my-assistant" \
  --description "一个自定义助手" \
  --systemPrompt "你是一个有帮助的助手" \
  --skillIds "skill-id-1,skill-id-2" \
  --modelConfigId "model-id"
```

### 6. 更新智能体

```bash
opencli apboa agent-update <agent-id> --name "新名称"
opencli apboa agent-update <agent-id> --systemPrompt @file:./prompt.txt
```

## 输出格式

所有命令默认输出 JSON 格式。可通过 `-f` 参数指定其他格式：

```bash
opencli apboa agent-list -f table
opencli apboa skill-list -f csv
```

## 开发

```bash
git clone https://github.com/<your-username>/opencli-apboa.git
cd opencli-apboa
npm install
```

## License

MIT
