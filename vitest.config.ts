import { defineConfig } from "vitest/config";

// Scope minimo: solo unit test puri (schema/validazione), niente Next.js
// runtime né alias @/* — se in futuro serviranno test che toccano route
// handler/React, estendere qui (resolve.alias, environment: "jsdom").
export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
