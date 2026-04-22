import { useCallback, useMemo, useState } from "react";
import { requestGoogleToken, revokeGoogleToken } from "../lib/googleAuth";

interface SessionState {
  accessToken: string | null;
  expiresAt: number | null;
  isSigningIn: boolean;
  error: string | null;
}

export function useGoogleSession() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
  const [state, setState] = useState<SessionState>({
    accessToken: null,
    expiresAt: null,
    isSigningIn: false,
    error: null
  });

  const isExpired = state.expiresAt ? Date.now() > state.expiresAt - 60_000 : false;
  const accessToken = state.accessToken && !isExpired ? state.accessToken : null;

  const signIn = useCallback(
    async (prompt = "") => {
      if (!clientId) {
        setState((current) => ({
          ...current,
          error: "Bitte VITE_GOOGLE_CLIENT_ID in einer .env Datei eintragen."
        }));
        return;
      }

      setState((current) => ({ ...current, isSigningIn: true, error: null }));
      const response = await requestGoogleToken(clientId, prompt);

      if (response.error || !response.access_token) {
        setState((current) => ({
          ...current,
          isSigningIn: false,
          error: response.error_description ?? response.error ?? "Google-Anmeldung fehlgeschlagen."
        }));
        return;
      }

      setState({
        accessToken: response.access_token,
        expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
        isSigningIn: false,
        error: null
      });
    },
    [clientId]
  );

  const signOut = useCallback(async () => {
    if (state.accessToken) await revokeGoogleToken(state.accessToken);
    setState({ accessToken: null, expiresAt: null, isSigningIn: false, error: null });
  }, [state.accessToken]);

  return useMemo(
    () => ({
      accessToken,
      clientIdConfigured: Boolean(clientId),
      isExpired,
      isSigningIn: state.isSigningIn,
      error: state.error,
      signIn,
      signOut
    }),
    [accessToken, clientId, isExpired, signIn, signOut, state.error, state.isSigningIn]
  );
}
