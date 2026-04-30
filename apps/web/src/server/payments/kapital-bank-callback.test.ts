import test from "node:test";
import assert from "node:assert/strict";
import {
  mapKapitalBankOrderStatus,
  toKapitalBankInternalStatus
} from "./kapital-bank-callback";

test("mapKapitalBankOrderStatus maps success statuses correctly", () => {
  assert.equal(mapKapitalBankOrderStatus("paid"), "succeeded");
  assert.equal(mapKapitalBankOrderStatus("authorized"), "succeeded");
  assert.equal(mapKapitalBankOrderStatus("closed"), "succeeded");
  assert.equal(mapKapitalBankOrderStatus("FullyPaid"), "succeeded");
});

test("mapKapitalBankOrderStatus maps cancel statuses correctly", () => {
  assert.equal(mapKapitalBankOrderStatus("cancelled"), "cancelled");
  assert.equal(mapKapitalBankOrderStatus("refunded"), "cancelled");
  assert.equal(mapKapitalBankOrderStatus("Rejected"), "cancelled");
});

test("toKapitalBankInternalStatus fallback mapping remains predictable", () => {
  assert.equal(toKapitalBankInternalStatus("success"), "succeeded");
  assert.equal(toKapitalBankInternalStatus("cancelled"), "cancelled");
  assert.equal(toKapitalBankInternalStatus("unknown"), "failed");
});
