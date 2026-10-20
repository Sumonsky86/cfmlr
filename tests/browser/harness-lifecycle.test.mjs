import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { runChild } from './harness.mjs';

// Only owned Node processes and deterministic gates; no browser or network.
function ownedNode(t, { holdTerm = false } = {}) {
  const state = { signals: [], closed: false };
  state.ready = new Promise(done => { state.markReady = done; });
  state.spawnChild = (binary, args, options) => {
    const child = spawn(binary, args, options);
    const realKill = child.kill.bind(child);
    state.close = new Promise(done => child.once('close', () => { state.closed = true; done(); }));
    child.stdout.once('data', state.markReady);
    child.kill = signal => {
      state.signals.push(signal);
      return holdTerm && signal === 'SIGTERM' ? true : realKill(signal);
    };
    t.after(async () => { if (!state.closed) realKill('SIGKILL'); await state.close; });
    return child;
  };
  return state;
}

function gatedChild() {
  const child = new EventEmitter();
  child.stdout = new PassThrough(); child.stderr = new PassThrough();
  child.signals = [];
  child.kill = signal => { child.signals.push(signal); return false; };
  child.unref = () => { child.unreferenced = true; };
  return child;
}

test('owned Node success preserves UTF-8 output and closes before returning', { timeout: 5000 }, async t => {
  const state = ownedNode(t);
  const output = await runChild(process.execPath, ['-e', "process.stdout.write('María Ñúñez')"], state);
  assert.equal(output, 'María Ñúñez');
  assert.equal(state.closed, true);
  assert.deepEqual(state.signals, []);
});

test('timeout escalates a real owned Node child and rejects only after close', { timeout: 5000 }, async t => {
  const state = ownedNode(t, { holdTerm: true });
  await assert.rejects(runChild(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    ...state, timeoutMs: 100, terminateGraceMs: 25, killGraceMs: 500,
  }), error => error.code === 'ERR_CHILD_TIMEOUT' && error.terminationConfirmed === true);
  assert.equal(state.closed, true);
  assert.deepEqual(state.signals, ['SIGTERM', 'SIGKILL']);
});

test('outer abort waits for close and escalates even after repeated cancellation', { timeout: 5000 }, async t => {
  const state = ownedNode(t, { holdTerm: true });
  const controller = new AbortController();
  const result = runChild(process.execPath, ['-e', "process.stdout.write('ready'); setInterval(() => {}, 1000)"], {
    ...state, signal: controller.signal, timeoutMs: 3000, terminateGraceMs: 25, killGraceMs: 500,
  });
  const rejected = assert.rejects(result, error => error.name === 'AbortError' && error.terminationConfirmed === true);
  await state.ready;
  controller.abort('test-only cancellation'); controller.abort();
  await rejected;
  assert.equal(state.closed, true);
  assert.deepEqual(state.signals, ['SIGTERM', 'SIGKILL']);
});

test('pre-aborted and synchronous launch failures do not leave a child', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(runChild('unused', [], {
    signal: controller.signal, spawnChild() { assert.fail('must not spawn'); },
  }), error => error.code === 'ABORT_ERR' && error.terminationConfirmed === true);
  const failure = new Error('synthetic synchronous launch failure');
  await assert.rejects(runChild('unused', [], { spawnChild() { throw failure; } }), error => error === failure && error.terminationConfirmed === true);
});

test('real ENOENT launch failure settles only after the failed child closes', { timeout: 5000 }, async () => {
  let closed = false;
  await assert.rejects(runChild(process.execPath + '.cefem-nonexistent', [], {
    spawnChild(binary, args, options) {
      const child = spawn(binary, args, options);
      child.once('close', () => { closed = true; });
      return child;
    },
  }), error => error.code === 'ENOENT' && error.terminationConfirmed === true);
  assert.equal(closed, true);
});

test('nonzero Node exit includes bounded stderr and confirms closure', { timeout: 5000 }, async t => {
  const state = ownedNode(t);
  await assert.rejects(runChild(process.execPath, ['-e', "process.stderr.write('x'.repeat(10000) + 'TAIL'); process.exitCode = 7"], state), error => {
    assert.match(error.message, /código 7/);
    assert.match(error.message, /TAIL$/);
    assert.ok(error.message.length < 4200);
    return error.terminationConfirmed === true;
  });
  assert.equal(state.closed, true);
});

test('unconfirmed termination is bounded and explicitly forbids profile cleanup', { timeout: 5000 }, async () => {
  const child = gatedChild();
  await assert.rejects(runChild('synthetic-gated-child', [], {
    spawnChild: () => child, timeoutMs: 10, terminateGraceMs: 10, killGraceMs: 10,
  }), error => error.code === 'ERR_CHILD_TERMINATION_UNCONFIRMED' && error.terminationConfirmed === false
    && error.cause.code === 'ERR_CHILD_TIMEOUT');
  assert.deepEqual(child.signals, ['SIGTERM', 'SIGKILL']);
  assert.equal(child.unreferenced, true);
  assert.equal(child.stdout.destroyed, true);
});

test('repeated asynchronous process errors are absorbed until confirmed close', { timeout: 5000 }, async () => {
  const child = gatedChild();
  const first = new Error('first owned-process error');
  let settled = false;
  const result = runChild('synthetic-gated-child', [], {
    spawnChild: () => child, timeoutMs: 1000, terminateGraceMs: 100, killGraceMs: 100,
  }).then(value => ({ value }), error => ({ error })).finally(() => { settled = true; });
  try {
    child.emit('error', first);
    await new Promise(done => setImmediate(done));
    assert.equal(settled, false);
    assert.doesNotThrow(() => child.emit('error', new Error('later kill failure')));
  } finally { child.emit('close', null, 'SIGTERM'); }
  const outcome = await result;
  assert.equal(outcome.error, first);
  assert.equal(outcome.error.terminationConfirmed, true);
});

test('stdout limit counts bytes and keeps overflow failure even if child exits zero', async () => {
  const child = gatedChild();
  const result = runChild('synthetic-gated-child', [], {
    spawnChild: () => child, maxOutputBytes: 4,
  });
  const rejected = assert.rejects(result, error => error.code === 'ERR_CHILD_STDOUT_LIMIT' && error.terminationConfirmed === true);
  child.stdout.emit('data', Buffer.from('ñññ'));
  child.emit('close', 0, null);
  await rejected;
  assert.deepEqual(child.signals, ['SIGTERM']);
});

test('actual SIGTERM closure cancels escalation for an owned Node child', { timeout: 5000 }, async t => {
  const state = ownedNode(t);
  const controller = new AbortController();
  const result = runChild(process.execPath, ['-e', "process.stdout.write('ready'); setInterval(() => {}, 1000)"], {
    ...state, signal: controller.signal, terminateGraceMs: 100, killGraceMs: 100,
  });
  const rejected = assert.rejects(result, error => error.code === 'ABORT_ERR' && error.terminationConfirmed === true);
  await state.ready;
  controller.abort();
  await rejected;
  assert.equal(state.closed, true);
  assert.deepEqual(state.signals, ['SIGTERM']);
});

test('invalid lifecycle bounds fail before spawning any process', async () => {
  for (const option of ['timeoutMs', 'maxOutputBytes', 'terminateGraceMs', 'killGraceMs']) {
    await assert.rejects(runChild('unused', [], {
      [option]: 0, spawnChild() { assert.fail('invalid limits must not spawn'); },
    }), error => error instanceof TypeError && error.terminationConfirmed === true);
  }
});
