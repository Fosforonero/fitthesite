export function betaWelcomeEmail(opts: {
  locale: "it" | "en";
  founderNumber?: number | null;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const lc = opts.locale;
  if (lc === "it") {
    return {
      subject: "Benvenuto nella beta FitMesh Sync 🎉",
      html: `
        <!DOCTYPE html>
        <html><body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1A1F2E;">
          <h1 style="color: #21E6C1;">Grazie per esserti iscritto!</h1>
          <p>Sei tra i primi a richiedere FitMesh Sync — l'app Android che porta tutti i dati del tuo smartwatch in una dashboard salute unificata.</p>
          ${opts.founderNumber ? `<p><strong>Sei il founder #${opts.founderNumber}</strong> della beta.</p>` : ""}
          <h2 style="color: #1A1F2E; margin-top: 32px;">Cosa succede ora?</h2>
          <ol>
            <li>Stiamo rilasciando l'app gradualmente ai tester</li>
            <li>Riceverai un'email separata con il link Play Store quando il tuo turno arriva</li>
            <li>Nel frattempo, puoi aiutare condividendo questo link con chi pensi possa esserci utile: <a href="https://www.fitmesh.fit" style="color:#21E6C1;">fitmesh.fit</a></li>
          </ol>
          <p style="margin-top: 32px; padding: 16px; background: #F5F7FA; border-radius: 8px; font-size: 14px;">
            Hai domande? Rispondi a questa email — la legge un essere umano (non un bot).
          </p>
          <p style="font-size: 12px; color: #6B7280; margin-top: 40px;">
            Stai ricevendo questa email perché ti sei iscritto alla beta su fitmesh.fit.
            Per non ricevere più nostre comunicazioni, rispondi a questa email scrivendo "UNSUBSCRIBE".
          </p>
        </body></html>
      `,
      text: `Benvenuto nella beta FitMesh Sync!\n\nSei tra i primi a richiedere FitMesh Sync.\n\n${opts.founderNumber ? `Sei il founder #${opts.founderNumber} della beta.\n\n` : ""}Cosa succede ora?\n1. Stiamo rilasciando l'app gradualmente ai tester\n2. Riceverai un'email separata con il link Play Store quando il tuo turno arriva\n3. Nel frattempo, puoi condividere fitmesh.fit con chi pensi possa esserci utile\n\nDomande? Rispondi a questa email.\n\n---\nStai ricevendo questa email perché ti sei iscritto alla beta su fitmesh.fit.`,
    };
  } else {
    return {
      subject: "Welcome to FitMesh Sync beta 🎉",
      html: `
        <!DOCTYPE html>
        <html><body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1A1F2E;">
          <h1 style="color: #21E6C1;">Thanks for signing up!</h1>
          <p>You're among the first to request FitMesh Sync — the Android app that brings all your smartwatch data into a unified health dashboard.</p>
          ${opts.founderNumber ? `<p><strong>You're founder #${opts.founderNumber}</strong> of the beta.</p>` : ""}
          <h2 style="color: #1A1F2E; margin-top: 32px;">What happens now?</h2>
          <ol>
            <li>We're rolling out the app gradually to testers</li>
            <li>You'll receive a separate email with the Play Store link when it's your turn</li>
            <li>In the meantime, you can help by sharing this link with anyone you think might find it useful: <a href="https://www.fitmesh.fit" style="color:#21E6C1;">fitmesh.fit</a></li>
          </ol>
          <p style="margin-top: 32px; padding: 16px; background: #F5F7FA; border-radius: 8px; font-size: 14px;">
            Questions? Reply to this email — a human reads it (not a bot).
          </p>
          <p style="font-size: 12px; color: #6B7280; margin-top: 40px;">
            You're receiving this email because you signed up for the beta at fitmesh.fit.
            To unsubscribe, reply with "UNSUBSCRIBE".
          </p>
        </body></html>
      `,
      text: `Welcome to FitMesh Sync beta!\n\nYou're among the first to request FitMesh Sync.\n\n${opts.founderNumber ? `You're founder #${opts.founderNumber} of the beta.\n\n` : ""}What happens now?\n1. We're rolling out the app gradually to testers\n2. You'll receive a separate email with the Play Store link when it's your turn\n3. In the meantime, share fitmesh.fit with anyone who might find it useful\n\nQuestions? Reply to this email.`,
    };
  }
}
