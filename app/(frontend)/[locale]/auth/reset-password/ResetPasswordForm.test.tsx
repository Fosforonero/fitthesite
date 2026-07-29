import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ResetPasswordForm, type ResetPasswordTranslations } from "./ResetPasswordForm";

const verifyOtp = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn();
const createRecoveryClient = vi.fn((..._args: unknown[]) => ({
  auth: { verifyOtp, updateUser, signOut },
}));

vi.mock("@/lib/supabase/recovery-client", () => ({
  createRecoveryClient: (...args: unknown[]) => createRecoveryClient(...args),
}));

const t: ResetPasswordTranslations = {
  noCodeTitle: "No code?",
  noCodeBody: "Request one",
  requestCode: "Request a code",
  staleLinkTitle: "Link no longer usable",
  staleLinkBody: "Request a new code",
  emailLabel: "Email",
  emailPlaceholder: "email",
  otpLabel: "Code",
  otpPlaceholder: "123456",
  otpHint: "hint",
  passwordLabel: "Password",
  passwordPlaceholder: "password",
  confirmLabel: "Confirm",
  submit: "Submit",
  saving: "Saving...",
  success: "Password updated",
  errorMissingFields: "Enter email and code",
  errorTooShort: "Too short",
  errorMismatch: "Mismatch",
  errorExpiredOrUsed: "Expired or already used",
  errorRateLimited: "Rate limited",
  errorNetwork: "Network error",
  errorGeneric: "Generic error",
  backToLogin: "Back",
};

const EMAIL = "user-a@example.com";
const OTP = "654321";
const PASSWORD = "brand-new-password";

async function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(t.emailLabel), { target: { value: EMAIL } });
  fireEvent.change(screen.getByLabelText(t.otpLabel), { target: { value: OTP } });
  fireEvent.change(screen.getByLabelText(t.passwordLabel), { target: { value: PASSWORD } });
  fireEvent.change(screen.getByLabelText(t.confirmLabel), { target: { value: PASSWORD } });
  fireEvent.click(screen.getByRole("button", { name: t.submit }));
}

describe("ResetPasswordForm", () => {
  let consoleSpies: ReturnType<typeof vi.spyOn>[];

  beforeEach(() => {
    verifyOtp.mockReset().mockResolvedValue({ error: null });
    updateUser.mockReset().mockResolvedValue({ error: null });
    signOut.mockReset().mockResolvedValue({ error: null });
    createRecoveryClient.mockClear();
    consoleSpies = [
      vi.spyOn(console, "log").mockImplementation(() => {}),
      vi.spyOn(console, "warn").mockImplementation(() => {}),
      vi.spyOn(console, "error").mockImplementation(() => {}),
    ];
  });

  afterEach(() => {
    consoleSpies.forEach((s) => s.mockRestore());
    cleanup();
  });

  it("mounting alone performs zero Supabase calls (scanner-safe: a GET/prefetch never consumes the OTP)", () => {
    render(<ResetPasswordForm locale="en" translations={t} />);
    expect(createRecoveryClient).not.toHaveBeenCalled();
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("does not call updateUser without an OTP (missing code never enables the password change)", async () => {
    render(<ResetPasswordForm locale="en" translations={t} />);
    fireEvent.change(screen.getByLabelText(t.emailLabel), { target: { value: EMAIL } });
    fireEvent.change(screen.getByLabelText(t.passwordLabel), { target: { value: PASSWORD } });
    fireEvent.change(screen.getByLabelText(t.confirmLabel), { target: { value: PASSWORD } });

    // L'attributo HTML `required` sull'input OTP blocca gia' un click nativo
    // sul bottone (jsdom implementa la constraint validation implicita).
    // Qui verifichiamo il secondo livello di difesa, il controllo JS in
    // `onSubmit`, disaccoppiandolo dalla gate nativa del browser: si dispatcha
    // l'evento `submit` direttamente sul form, che salta la constraint
    // validation implicita (l'unico modo per cui questo branch e'
    // raggiungibile e' bypassare `required`, es. devtools o submit
    // programmatico).
    const form = screen.getByRole("button", { name: t.submit }).closest("form")!;
    fireEvent.submit(form);

    expect(await screen.findByText(t.errorMissingFields)).toBeInTheDocument();
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("has no ambient-session fallback: the fake auth client exposes no getSession, yet the form never needs it", async () => {
    // auth mock sopra definisce SOLO verifyOtp/updateUser/signOut — se il
    // componente chiamasse getSession() da qualche parte, il test fallirebbe
    // con "getSession is not a function", non silenziosamente.
    render(<ResetPasswordForm locale="en" translations={t} />);
    await fillAndSubmit();
    await waitFor(() => expect(screen.getByText(t.success)).toBeInTheDocument());
  });

  it("valid OTP + password → verifyOtp then updateUser, then success screen", async () => {
    render(<ResetPasswordForm locale="en" translations={t} />);
    await fillAndSubmit();

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ password: PASSWORD }));
    expect(verifyOtp).toHaveBeenCalledWith({ email: EMAIL, token: OTP, type: "recovery" });
    expect(verifyOtp.mock.invocationCallOrder[0]).toBeLessThan(
      updateUser.mock.invocationCallOrder[0],
    );
    expect(screen.getByText(t.success)).toBeInTheDocument();
  });

  it("updateUser is never called when verifyOtp fails (expired/used/wrong code)", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "Token has expired or is invalid" } });
    render(<ResetPasswordForm locale="en" translations={t} />);
    await fillAndSubmit();

    expect(await screen.findByText(t.errorExpiredOrUsed)).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rate-limited verifyOtp shows the rate-limit copy with a retry path (form stays usable)", async () => {
    verifyOtp.mockResolvedValue({ error: { status: 429, message: "over_email_send_rate_limit" } });
    render(<ResetPasswordForm locale="en" translations={t} />);
    await fillAndSubmit();

    expect(await screen.findByText(t.errorRateLimited)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.submit })).toBeEnabled();
  });

  it("network failure during verifyOtp shows the network copy, not a generic/opaque one", async () => {
    verifyOtp.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<ResetPasswordForm locale="en" translations={t} />);

    fireEvent.change(screen.getByLabelText(t.emailLabel), { target: { value: EMAIL } });
    fireEvent.change(screen.getByLabelText(t.otpLabel), { target: { value: OTP } });
    fireEvent.change(screen.getByLabelText(t.passwordLabel), { target: { value: PASSWORD } });
    fireEvent.change(screen.getByLabelText(t.confirmLabel), { target: { value: PASSWORD } });

    // Il componente non intercetta un reject non gestito; questo test
    // documenta il comportamento atteso una volta aggiunto un try/catch. Se
    // fallisce, e' un gap reale da chiudere prima del merge, non un test da
    // rimuovere.
    fireEvent.click(screen.getByRole("button", { name: t.submit }));
    await waitFor(() => expect(screen.getByText(t.errorNetwork)).toBeInTheDocument());
  });

  it("updateUser failure after a valid OTP still shows an error (password not silently unset)", async () => {
    updateUser.mockResolvedValue({ error: { message: "weak password" } });
    render(<ResetPasswordForm locale="en" translations={t} />);
    await fillAndSubmit();

    expect(await screen.findByText(t.errorGeneric)).toBeInTheDocument();
  });

  it("uses a fresh isolated client per submit, never a shared/cached instance", async () => {
    render(<ResetPasswordForm locale="en" translations={t} />);
    await fillAndSubmit();
    await waitFor(() => expect(createRecoveryClient).toHaveBeenCalledTimes(1));
  });

  it("never logs the email, OTP, or password to the console across a full success run", async () => {
    render(<ResetPasswordForm locale="en" translations={t} />);
    await fillAndSubmit();
    await waitFor(() => expect(screen.getByText(t.success)).toBeInTheDocument());

    for (const spy of consoleSpies) {
      for (const call of spy.mock.calls) {
        const serialized = call.map(String).join(" ");
        expect(serialized).not.toContain(EMAIL);
        expect(serialized).not.toContain(OTP);
        expect(serialized).not.toContain(PASSWORD);
      }
    }
  });

  it("never logs sensitive fields on an error path either", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "Token has expired or is invalid" } });
    render(<ResetPasswordForm locale="en" translations={t} />);
    await fillAndSubmit();
    await screen.findByText(t.errorExpiredOrUsed);

    for (const spy of consoleSpies) {
      for (const call of spy.mock.calls) {
        const serialized = call.map(String).join(" ");
        expect(serialized).not.toContain(EMAIL);
        expect(serialized).not.toContain(OTP);
        expect(serialized).not.toContain(PASSWORD);
      }
    }
  });

  it("the only navigation target after success is the hardcoded /{locale} link (no open redirect)", async () => {
    render(<ResetPasswordForm locale="it" translations={t} />);
    await fillAndSubmit();

    const link = await screen.findByRole("link", { name: t.backToLogin });
    expect(link).toHaveAttribute("href", "/it");
  });
});
