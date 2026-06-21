import assert from "node:assert/strict";
import { test } from "node:test";

import { barbershopDemo } from "../dist/seeds/barbershop.demo.js";
import { beautyStudioDemo } from "../dist/seeds/beauty-studio.demo.js";

const definitions = [barbershopDemo, beautyStudioDemo];

function values(definition, collection, key) {
  return new Set(definition[collection].map((item) => item[key]));
}

function intersection(left, right) {
  return [...left].filter((value) => right.has(value));
}

test("Barbería y Beauty Studio usan tenants y verticales diferentes", () => {
  assert.notEqual(barbershopDemo.business.slug, beautyStudioDemo.business.slug);
  assert.equal(barbershopDemo.business.vertical, "BARBERSHOP");
  assert.equal(beautyStudioDemo.business.vertical, "BEAUTY_STUDIO");
});

test("las verticales no comparten servicios, profesionales ni productos", () => {
  for (const collection of ["services", "professionals", "products"]) {
    const overlap = intersection(
      values(barbershopDemo, collection, "slug"),
      values(beautyStudioDemo, collection, "slug"),
    );
    assert.deepEqual(overlap, [], `Hay slugs compartidos en ${collection}`);
  }
});

test("cada vertical cumple los conteos demo mínimos", () => {
  assert.ok(barbershopDemo.services.length >= 7);
  assert.ok(beautyStudioDemo.services.length >= 8);
  for (const definition of definitions) {
    assert.ok(definition.professionals.length >= 3);
    assert.ok(definition.packs.length >= 2);
    assert.ok(definition.products.length >= 5);
    assert.ok(definition.customers.length >= 3);
    assert.ok(definition.resources.length >= 3);
    assert.ok(definition.businessHours.length >= 6);
  }
});

test("precios CLP e inventarios demo son enteros no negativos", () => {
  for (const definition of definitions) {
    for (const item of [...definition.services, ...definition.packs, ...definition.products]) {
      assert.ok(Number.isInteger(item.priceClp));
      assert.ok(item.priceClp >= 0);
    }
    for (const product of definition.products) {
      assert.ok(Number.isInteger(product.onHand));
      assert.ok(Number.isInteger(product.reorderPoint));
      assert.ok(product.onHand >= 0);
      assert.ok(product.reorderPoint >= 0);
    }
  }
});

test("los teléfonos son marcadores ficticios chilenos", () => {
  for (const definition of definitions) {
    assert.match(definition.location.phone, /^\+56 9 0000 \d{4}$/);
    for (const customer of definition.customers) {
      assert.match(customer.phone, /^\+56 9 0000 \d{4}$/);
    }
  }
});
