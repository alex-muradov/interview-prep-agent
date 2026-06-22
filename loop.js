#!/usr/bin/env node

// Learning loop heartbeat — invoked daily by cron.
// Reads agent state, detects conditions, replans schedule,
// sends macOS notification. Delegates complex reasoning to Claude
// by spawning `claude` CLI with the loop skill.

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE = path.join(os.homedir(), '.claude', 'interview-prep-agent');
const STATE_FILE = path.join(BASE, 'state.json');
const LOG_FILE = path.join(BASE, 'loop.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

function notify(message, subtitle) {
  const escaped = (s) => s.replace(/"/g, '\\"');
  try {
    execSync(
      `osascript -e 'display notification "${escaped(message)}" with title "interview-prep-agent" subtitle "${escaped(subtitle)}"'`
    );
  } catch (e) {
    log(`notification failed: ${e.message}`);
  }
}

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  log('loop tick started');

  // Exit early if agent not active
  const state = readJSON(STATE_FILE);
  if (!state || state.status !== 'active') {
    log('agent not active — exiting');
    return;
  }

  // Delegate observe/detect/replan/notify to Claude via loop skill
  // The loop skill handles all reasoning; this script is just the launcher.
  const result = spawnSync(
    'claude',
    ['--skill', path.join(os.homedir(), '.claude', 'skills', 'interview-prep-agent', 'loop'), '--print'],
    { encoding: 'utf8', timeout: 120_000 }
  );

  if (result.error || result.status !== 0) {
    log(`claude invocation failed: ${result.stderr || result.error?.message}`);
    // Fallback notification so user knows something ran
    notify('interview-prep-agent active — check /interview-prep-agent for next session', 'Loop tick');
    return;
  }

  log('loop tick complete');
}

main();
