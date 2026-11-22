// 用计划任务拉起 handoff helper，并每 1 分钟自愈重试：
// helper 被系统回收（本机表现为 0xC000013A 控制台关闭）也能在下一分钟补上。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { WINDOWS_ASAR_HANDOFF_PS1 } from "file:///C:/Users/DELL/.dsh/profiles/desktop/node_modules/dsh-purge-community/lib/windows-asar-handoff.js";

const argv = process.argv.slice(2);
const opt = (name, fallback = "") => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const asar = opt("asar");
const exe = opt("exe");
const timeout = opt("timeout", "1800");
const hours = opt("hours", "3");
if (!asar || !exe) {
  console.error("usage: node purge-handoff-task.mjs --asar <app.asar> --exe <exe> [--timeout 1800] [--hours 3] [--tag name]");
  process.exit(2);
}

const statePath = `${asar}.purge-handoff.json`;
const token = randomUUID();
const short = token.slice(0, 8);
const taskName = opt("tag", `dsh-purge-handoff-${short}`);
const helper = path.join(os.tmpdir(), `dsh-purge-handoff-${token}.ps1`);
fs.writeFileSync(helper, WINDOWS_ASAR_HANDOFF_PS1, "utf8");
fs.writeFileSync(`${asar}.rename-pending`, `${token}\n`, "utf8");
fs.writeFileSync(statePath, JSON.stringify({ token, phase: "starting", updated_at: new Date().toISOString() }), "utf8");

const q = (s) => `"${s}"`;
const runner = path.join(os.tmpdir(), `dsh-purge-handoff-${token}.run.ps1`);
const runnerBody = [
  "$ErrorActionPreference='Stop'",
  `& ${q(helper)} -ExePath ${q(exe)} -AsarPath ${q(asar)} -StatePath ${q(statePath)} -Token ${q(token)} -TimeoutSeconds ${timeout}`,
  // helper 结束后：已换包/已失效就把任务删掉，避免遗留
  `try { $s = Get-Content -LiteralPath ${q(statePath)} -Raw | ConvertFrom-Json } catch { $s = $null }`,
  `if (-not $s -or $s.token -ne ${q(token)} -or $s.phase -in @('complete','already_unsealed','expired','failed')) { schtasks /delete /tn ${q(taskName)} /f 2>$null | Out-Null }`,
].join("\r\n");
fs.writeFileSync(runner, runnerBody, "utf8");

const ps = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
const register = `
$ErrorActionPreference='Stop'
$action = New-ScheduledTaskAction -Execute ${q(ps)} -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ' + ${q(runner)})
$trigger = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddYears(1)) -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration (New-TimeSpan -Hours ${hours})
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName ${q(taskName)} -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName ${q(taskName)}
Write-Output 'registered'
`;
const out = spawnSync(ps, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", register], { encoding: "utf8" });
console.log("token:", token);
console.log("task:", taskName, "| register:", (out.stdout || out.stderr || "").trim().split(/\r?\n/).pop());

let phase = "starting";
for (let i = 0; i < 80; i++) {
  await new Promise((r) => setTimeout(r, 300));
  try {
    const s = JSON.parse(fs.readFileSync(statePath, "utf8"));
    phase = s.phase;
    if (phase !== "starting") {
      console.log(`acknowledged after ${i * 300}ms: phase=${phase} pid=${s.pid ?? "-"}`);
      break;
    }
  } catch {}
}
if (phase === "starting") {
  const q2 = spawnSync("schtasks.exe", ["/query", "/tn", taskName, "/v", "/fo", "list"], { encoding: "utf8" });
  console.log("no acknowledgement:\n" + (q2.stdout || q2.stderr || "").slice(-1200));
  process.exit(1);
}
