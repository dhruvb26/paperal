import ky from "ky";
import { useEffect, useState } from "react";

/**
 * This reusable hook is an example on how to query your backend for a JWT
 */
export const useAiAuthentication = (): {
  isAuthenticating: boolean;
  error: string | undefined;
  appId: string | undefined;
  token: string | undefined;
} => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | undefined>();
  // We’re holding all necessary settings for the AI extension here in the state
  const [appId, setAppId] = useState<string | undefined>();
  const [token, setToken] = useState<string | undefined>();

  useEffect(() => {
    async function doAuthenticate() {
      setIsAuthenticating(true);
      setAppId(undefined);
      setToken(undefined);

      try {
        // Perform an API call to your backend route, which resolves the app ID and generates a JWT based in your secret
        const response = (await ky.post("/api/ai/authenticate").json()) as {
          appId: string;
          token: string;
        };

        setAppId(response?.appId);
        setToken(response?.token);
        setIsAuthenticating(false);
      } catch (error) {
        console.error(error);

        setError("Authentication failed.");
      }
    }

    setAppId(undefined);
    setToken(undefined);

    doAuthenticate();
  }, []);

  return { isAuthenticating, error, appId, token };
};
