// Dependency-injected flow keeps platform code isolated and failures testable.
export type GoogleResult = { type: "success"; data: { idToken: string | null } } | { type: "cancelled" };
type NativeGoogleDependencies = {
  webClientId: string;
  configure: (options: { webClientId: string }) => void;
  hasPlayServices: () => Promise<unknown>;
  signIn: () => Promise<GoogleResult>;
  exchange: (token: string) => Promise<{ error: { message: string } | null; hasSession: boolean }>;
};
export async function nativeGoogleFlow(deps: NativeGoogleDependencies): Promise<"signed-in" | "cancelled"> {
  if (!deps.webClientId.endsWith(".apps.googleusercontent.com")) {
    throw new Error("Google sign-in is not configured yet.");
  }
  deps.configure({ webClientId: deps.webClientId });
  await deps.hasPlayServices();
  const result = await deps.signIn();
  if (result.type !== "success") return "cancelled";
  const token = result.data.idToken;
  if (!token) throw new Error("Google did not confirm the sign-in. Please try again.");
  const session = await deps.exchange(token);
  if (session.error) throw new Error(session.error.message);
  if (!session.hasSession) throw new Error("Sign-in could not be completed. Please try again.");
  return "signed-in";
}