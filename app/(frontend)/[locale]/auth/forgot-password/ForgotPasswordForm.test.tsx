import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE = fs.readFileSync(path.join(__dirname, "ForgotPasswordForm.tsx"), "utf8");

/**
 * Hotfix P0.10R (addendum): il rate limit deve stare server-side. Se questo
 * componente tornasse a chiamare Supabase direttamente, il doppio limite
 * (email/IP) applicato in app/api/v1/auth/forgot-password/route.ts
 * smetterebbe semplicemente di esistere per chi bypassa quella route —
 * cosa impossibile da rilevare con un test comportamentale mockato, che
 * mockerebbe via il problema stesso. Un'assertion sul sorgente e' voluta.
 */
describe("ForgotPasswordForm — non chiama Supabase direttamente", () => {
  it("non importa createRecoveryClient", () => {
    expect(SOURCE).not.toMatch(/from\s+['"]@\/lib\/supabase\/recovery-client['"]/);
  });

  it("non invoca resetPasswordForEmail", () => {
    expect(SOURCE).not.toContain("resetPasswordForEmail");
  });

  it("chiama l'endpoint server-side dedicato", () => {
    expect(SOURCE).toMatch(/fetch\(\s*['"]\/api\/v1\/auth\/forgot-password['"]/);
  });
});
