// 一键重放本地修复（幂等）。插件更新 / 宿主重新解包后跑一次即可。
// 用法：node reapply-purge-fix.mjs [--check]
import fs from "node:fs";
import path from "node:path";

const PLUGIN_DIR = "C:/Users/DELL/.dsh/profiles/desktop/node_modules/dsh-purge-community";
const HOST = "E:/Program Files (x86)/Ai-Agent/da-fei-yu/zhuan-wu/resources/app/dsh/node_modules/@deepseek-ai";
const PINNED_VERSION = "1.7.20";
const checkOnly = process.argv.includes("--check");
let dirty = false;

// 1) 插件 handoff 修复
const handoff = path.join(PLUGIN_DIR, "lib", "windows-asar-handoff.js");
const pkg = JSON.parse(fs.readFileSync(path.join(PLUGIN_DIR, "package.json"), "utf8"));
const handoffText = fs.readFileSync(handoff, "utf8");
if (handoffText.includes("helperArgv") && handoffText.includes("scheduleHandoffViaTask")) {
  console.log(`[handoff] 已是修复版（插件 ${pkg.version}）`);
} else if (pkg.version !== PINNED_VERSION) {
  console.log(`[handoff] 未修复，插件版本 ${pkg.version} ≠ ${PINNED_VERSION}：先 diff，未写入`);
  dirty = true;
} else if (!checkOnly) {
  fs.writeFileSync(`${handoff}.bak-${Date.now()}`, handoffText, "utf8");
  fs.copyFileSync(path.join(process.cwd(), "windows-asar-handoff.fixed.js"), handoff);
  console.log("[handoff] 已重放");
} else {
  console.log("[handoff] 需要重放");
  dirty = true;
}

// 2) 预设闸门：宿主代码快照还原
const GATE_FILES = [
  ["dsh-purge-gate/index.js", "purge-gate.js", "dsh-purge-gate"],
  ["dsh-sandbox-policy/lib/index.js", "sandbox-policy.js", "purgeGate"],
  ["dsh-sandbox-local/lib/index.js", "sandbox-local.js", "purgeGateAllowsPolicy"],
  ["dsh-fs-sandbox/lib/index.js", "fs-sandbox.js", "purgeGateAllowsPolicy"],
  ["dsh-user-approval/lib/index.js", "user-approval.js", "purgeGateAllows"],
  ["dsh-sandbox/lib/index.js", "sandbox-core.js", "purgeGateAllows"],
  ["dsh-tool-bash/lib/index.js", "tool-bash.js", "purgeGate"],
  ["dsh-tool-fs/lib/index.js", "tool-fs.js", "purgeGate"],
  ["dsh-tool-pwsh/lib/index.js", "tool-pwsh.js", "purgeGate"],
  ["dsh-tools/lib/index.js", "tools.js", "purgeGate"],
  ["dsh-plugin-manager/lib/types/tools.js", "plugin-manager-tools.js", "purgeGate"],
];
for (const [rel, snapshot, marker] of GATE_FILES) {
  const target = path.join(HOST, rel);
  if (!fs.existsSync(target)) {
    console.log(`[gate] 缺少 ${rel}，跳过`);
    continue;
  }
  const text = fs.readFileSync(target, "utf8");
  if (text.includes(marker)) {
    console.log(`[gate] ${rel} 已就位`);
    continue;
  }
  if (checkOnly) {
    console.log(`[gate] ${rel} 需要重放`);
    dirty = true;
    continue;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(`${target}.bak-reapply`, text, "utf8");
  fs.copyFileSync(path.join(process.cwd(), "host-patched", snapshot), target);
  console.log(`[gate] ${rel} 已重放`);
}

// 3) 闸门名单（缺失时补默认值）
const listFile = "C:/Users/DELL/.dsh/dsh-purge/gate-presets.json";
if (!fs.existsSync(listFile)) {
  if (checkOnly) {
    console.log("[gate] 名单缺失");
    dirty = true;
  } else {
    fs.mkdirSync(path.dirname(listFile), { recursive: true });
    fs.writeFileSync(listFile, '{\n  "presets": ["standard", "unrestricted", "redteam"]\n}\n', "utf8");
    console.log("[gate] 已写入默认名单");
  }
} else {
  console.log("[gate] 名单存在");
}

process.exit(dirty ? 1 : 0);
