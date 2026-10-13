import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readPrivateJson, readPrivateRecords, writePrivateJson } from "./privateData";

function withStore(check: (directory: string) => void) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "nexo-private-test-"));
  try { check(directory); } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test("private JSON roundtrip preserves all legacy fields and permissions", () => withStore(directory => {
  const file = path.join(directory, "users_db.json");
  const users = [{ id: "nexo-test-user", email: "nexo-test@example.invalid", passwordHash: "$2b$synthetic-test-only", role: "aluno", status: "bloqueado", legacyField: { retained: true } }];
  writePrivateJson(file, users);
  assert.deepEqual(readPrivateRecords<{ id: string; email: string }>(file, "email"), users);
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.deepEqual(fs.readdirSync(directory), ["users_db.json"]);
}));

test("voucher roundtrip keeps identifiers, limits and usage counters", () => withStore(directory => {
  const file = path.join(directory, "vouchers_db.json");
  const vouchers = [{ id: "nexo-test-voucher", code: "NEXO-TEST-ONLY", role: "aluno", maxUses: 7, usedCount: 4, expiresAt: "2030-01-01T00:00:00.000Z" }];
  writePrivateJson(file, vouchers);
  assert.deepEqual(readPrivateRecords<{ id: string; code: string }>(file, "code"), vouchers);
}));

test("invalid or duplicate records fail closed without replacing the source", () => withStore(directory => {
  const file = path.join(directory, "users_db.json");
  fs.writeFileSync(file, "{invalid-json");
  assert.throws(() => readPrivateRecords<{ id: string; email: string }>(file, "email"), /Não foi possível ler/);
  assert.equal(fs.readFileSync(file, "utf8"), "{invalid-json");
  const duplicate = [{ id: "test-one", email: "test@example.invalid" }, { id: "test-two", email: "TEST@example.invalid" }];
  writePrivateJson(file, duplicate);
  assert.throws(() => readPrivateRecords<{ id: string; email: string }>(file, "email"), /duplicados/);
  assert.deepEqual(readPrivateJson(file, []), duplicate);
}));

test("production refuses missing, relative or public-directory storage", () => {
  for (const directory of ["", "relative-data", path.join(process.cwd(), "dist", "data")]) {
    const result = spawnSync(process.execPath, ["--import", "tsx", "--eval", "import('./src/lib/privateData.ts')"], {
      cwd: process.cwd(), encoding: "utf8", env: { ...process.env, NODE_ENV: "production", NEXO_DATA_DIR: directory },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /NEXO_DATA_DIR/);
  }
});
