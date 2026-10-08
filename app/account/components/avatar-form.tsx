"use client";

import { useActionState, useEffect, useRef } from "react";
import { INITIAL_PROFILE_ACTION_STATE } from "@/app/account/action-state";
import { updateAvatarAction } from "@/app/account/actions";
import SubmitButton from "@/app/auth/components/submit-button";
import MemberAvatar from "@/app/components/member-avatar";
import { avatarUrl, validateAvatarFile } from "@/lib/account/avatar";
import { notifyProfileIdentityUpdated } from "@/lib/account/profile-events";

export default function AvatarForm({ username, displayName, avatarVersion }: {
  username: string; displayName: string; avatarVersion: string | null;
}) {
  const [state, action, pending] = useActionState(updateAvatarAction, INITIAL_PROFILE_ACTION_STATE);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state.status === "success") {
      notifyProfileIdentityUpdated();
      if (fileRef.current) fileRef.current.value = "";
    }
    if (state.status === "error") fileRef.current?.focus();
  }, [state]);
  const initials = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || username.slice(0, 2).toUpperCase();
  return (
    <form action={action} className="mb-sa-5 space-y-sa-3 border-b border-sa-border-subtle pb-sa-5">
      <div className="flex items-center gap-sa-3">
        <div aria-hidden="true" className="sa-type-data grid h-16 w-16 shrink-0 place-items-center overflow-hidden border border-sa-border-active text-xl text-sa-accent">
          <MemberAvatar src={avatarUrl(username, avatarVersion)} initials={initials} />
        </div>
        <div className="min-w-0">
          <label htmlFor="profile-avatar" className="sa-type-label text-xs">Avatar (optional)</label>
          <p id="avatar-help" className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
            Public when set. JPEG, PNG or WebP up to 2 MiB / 16 megapixels. Saved as a square centre crop; the original is not retained.
          </p>
        </div>
      </div>
      <input ref={fileRef} id="profile-avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp"
        disabled={pending} aria-describedby="avatar-help avatar-message" aria-invalid={state.status === "error"}
        className="min-h-11 w-full min-w-0 max-w-full text-sm outline-none file:mr-sa-2 file:min-h-11 file:border file:border-sa-border-strong file:bg-sa-surface-2 file:px-sa-3 file:text-sa-text-primary focus-visible:ring-2 focus-visible:ring-sa-accent"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.setCustomValidity(file ? validateAvatarFile(file) ?? "" : "");
        }} />
      <div className="flex flex-wrap gap-sa-2">
        <SubmitButton pendingLabel="Updating avatar…">Save public avatar</SubmitButton>
        <button type="submit" name="operation" value="remove" formNoValidate disabled={pending}
          className="min-h-11 border border-sa-border-strong px-sa-3 text-sm outline-none hover:border-sa-border-active focus-visible:ring-2 focus-visible:ring-sa-accent disabled:opacity-50">
          Remove avatar
        </button>
      </div>
      <p id="avatar-message" role="status" aria-live="polite" className={`text-sm ${state.status === "error" ? "text-sa-negative" : "text-sa-text-muted"}`}>{state.message}</p>
    </form>
  );
}
