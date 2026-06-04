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

test("mapKapitalBankOrderStatus never treats partial payment as success", () => {
  // Both the normalized and raw spellings must resolve to a non-succeeded status
  // so a partially paid order never grants entitlement.
  assert.equal(mapKapitalBankOrderStatus("partiallypaid"), "failed");
  assert.equal(mapKapitalBankOrderStatus("Partially paid"), "failed");
  assert.equal(mapKapitalBankOrderStatus("PartiallyPaid"), "failed");
});

test("toKapitalBankInternalStatus fallback mapping remains predictable", () => {
  assert.equal(toKapitalBankInternalStatus("success"), "succeeded");
  assert.equal(toKapitalBankInternalStatus("cancelled"), "cancelled");
  assert.equal(toKapitalBankInternalStatus("unknown"), "failed");
});
