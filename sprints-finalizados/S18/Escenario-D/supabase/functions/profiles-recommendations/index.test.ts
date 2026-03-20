import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { calculateProfileCompatibilityScore } from "./index.ts";
import type { Profile } from "../_shared/types.ts";

const createBaseProfile = (): Profile => ({
  id: "test",
  updated_at: new Date().toISOString()
});

Deno.test("calculateProfileCompatibilityScore - Máximo (100)", () => {
  const seeker: Profile = {
    ...createBaseProfile(),
    housing_situation: "seeking",
    preferred_zones: ["centro"],
    budget_min: 500,
    budget_max: 800,
    interests: ["futbol", "leer", "cocinar", "viajar", "cine"],
    lifestyle_preferences: {
      schedule: "schedule_flexible",
      cleaning: "cleaning_muy_limpio",
      guests: "guests_algunos",
    }
  };

  const target: Profile = {
    ...createBaseProfile(),
    housing_situation: "offering",
    preferred_zones: ["norte", "centro"],
    budget_min: 500,
    budget_max: 800,
    interests: ["futbol", "leer", "cocinar", "viajar", "cine", "extra"],
    lifestyle_preferences: {
      schedule: "schedule_flexible",
      cleaning: "cleaning_muy_limpio",
      guests: "guests_algunos",
    }
  };

  const result = calculateProfileCompatibilityScore(seeker, target);
  assertEquals(result.score, 100);
  assertEquals(result.breakdown["housing"], 25);
  assertEquals(result.breakdown["zones"], 20);
  assertEquals(result.breakdown["budget"], 20);
  assertEquals(result.breakdown["interests"], 25);
  assertEquals(result.breakdown["lifestyle"], 10);
});

Deno.test("calculateProfileCompatibilityScore - Mínimo (0)", () => {
  const seeker: Profile = {
    ...createBaseProfile(),
    housing_situation: "seeking",
    preferred_zones: ["centro"],
    budget_min: 300,
    budget_max: 400,
    interests: ["gaming"],
    lifestyle_preferences: {
      schedule: "schedule_manana",
      cleaning: "cleaning_normal",
      guests: "guests_no",
    }
  };

  const target: Profile = {
    ...createBaseProfile(),
    housing_situation: "seeking", // same, so 0 pts
    preferred_zones: ["norte"],  // diff, so 0 pts
    budget_min: 600,
    budget_max: 800,             // no overlap, so 0 pts
    interests: ["leer"],         // diff, so 0 pts
    lifestyle_preferences: {
      schedule: "schedule_tarde",
      cleaning: "cleaning_estricto",
      guests: "guests_si",
    }                            // all diff, 0 pts
  };

  const result = calculateProfileCompatibilityScore(seeker, target);
  assertEquals(result.score, 0);
  assertEquals(result.breakdown, {});
});

Deno.test("calculateProfileCompatibilityScore - Presupuesto solapado parcial", () => {
  const seeker: Profile = {
    ...createBaseProfile(),
    budget_min: 400,
    budget_max: 600,
  };

  const target: Profile = {
    ...createBaseProfile(),
    budget_min: 500,
    budget_max: 700,
  };

  // overlap is 500 to 600 (100)
  // range is 400 to 700 (300)
  const result = calculateProfileCompatibilityScore(seeker, target);
  
  // (100/300) * 20 = 6.666... => 7
  assertEquals(Math.round(result.breakdown["budget"]), 7);
});

Deno.test("calculateProfileCompatibilityScore - Intereses (0 en común)", () => {
  const seeker: Profile = {
    ...createBaseProfile(),
    interests: ["futbol", "leer"]
  };
  const target: Profile = {
    ...createBaseProfile(),
    interests: ["cine", "cocina"]
  };
  
  const result = calculateProfileCompatibilityScore(seeker, target);
  assertEquals(result.breakdown["interests"], 0);
});

Deno.test("calculateProfileCompatibilityScore - Intereses (≥5 en común -> 25)", () => {
  const seeker: Profile = {
    ...createBaseProfile(),
    interests: ["futbol", "leer", "cine", "viajar", "musica", "arte"]
  };
  const target: Profile = {
    ...createBaseProfile(),
    interests: ["futbol", "leer", "cine", "viajar", "musica", "arte"]
  };
  
  const result = calculateProfileCompatibilityScore(seeker, target);
  assertEquals(result.breakdown["interests"], 25);
});

Deno.test("calculateProfileCompatibilityScore - Suma breakdown = score total", () => {
  const seeker: Profile = {
    ...createBaseProfile(),
    housing_situation: "seeking",
    preferred_zones: ["sur"],
    budget_min: 500,
    budget_max: 600,
  };

  const target: Profile = {
    ...createBaseProfile(),
    housing_situation: "offering",
    preferred_zones: ["sur"],
    budget_min: 550,
    budget_max: 700,
  };

  const result = calculateProfileCompatibilityScore(seeker, target);
  
  const sum = Object.values(result.breakdown).reduce((a, b) => a + b, 0);
  assertEquals(sum, result.score);
});
