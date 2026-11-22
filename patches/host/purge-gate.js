// [dsh-purge] 预设闸门：只有名单里的预设才享受补丁行为，其余预设走宿主原始逻辑。
// 名单文件：$DSH_HOME/dsh-purge/gate-presets.json  {"presets": ["standard","unrestricted","redteam"]}
// 名单为空 = 闸门关闭（等价补丁全量生效）。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HOME = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
const FILE = path.join(HOME, "dsh-purge", "gate-presets.json");
let cachedAt = -1;
let cachedList = null;
let warned = false;

export function gatePresets() {
  try {
    const st = fs.statSync(FILE);
    if (cachedList && st.mtimeMs === cachedAt) return cachedList;
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
    cachedList = Array.isArray(raw?.presets) ? raw.presets.map((item) => String(item).trim().toLowerCase()).filter(Boolean) : [];
    cachedAt = st.mtimeMs;
    return cachedList;
  } catch {
    return cachedList ?? [];
  }
}

export function purgeGateAllowsPreset(preset) {
  const list = gatePresets();
  if (list.length === 0) return true;
  const id = String(preset ?? "").trim().toLowerCase();
  // 拿不到预设 id 时保持原状（fail-open），否则会把所有会话一起关进原版。
  if (!id) {
    if (!warned) {
      warned = true;
      try { console.warn("[dsh-purge-gate] session preset unknown; gate stays open for this context"); } catch {}
    }
    return true;
  }
  return list.includes(id);
}

export function purgeGateAllows(session) {
  return purgeGateAllowsPreset(session?.header?.agentPreset ?? session?.agentPreset);
}

export function purgeGateAllowsPolicy(policy) {
  return policy && typeof policy.purgeGate === "boolean" ? policy.purgeGate : true;
}
