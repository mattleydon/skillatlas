// A same-tab invalidation signal, not an identity payload or shared state store.
export const PROFILE_IDENTITY_UPDATED_EVENT = "skillatlas:profile-identity-updated";

export function notifyProfileIdentityUpdated() {
  window.dispatchEvent(new Event(PROFILE_IDENTITY_UPDATED_EVENT));
}
