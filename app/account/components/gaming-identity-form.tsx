"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { INITIAL_PROFILE_ACTION_STATE } from "@/app/account/action-state";
import { updateGamingIdentityAction } from "@/app/account/actions";
import PrivacyToggle from "@/app/account/components/privacy-toggle";
import SubmitButton from "@/app/auth/components/submit-button";
import { GAME_DEFINITIONS } from "@/constants/games";
import { PLATFORM_DEFINITIONS } from "@/constants/platforms";

type Props = {
  favouriteGameIds: string[]; favouriteGamesIsPublic: boolean;
  platformIds: string[]; platformsIsPublic: boolean;
  gamingSince: number | null; gamingSinceIsPublic: boolean;
};
const optionClass = "flex min-h-11 items-center gap-sa-2 border border-sa-border-subtle bg-sa-surface-inset px-sa-3 py-sa-2 text-sm";
const moveClass = "min-h-11 min-w-11 border border-sa-border-subtle px-sa-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-sa-accent disabled:opacity-40";

export default function GamingIdentityForm(props: Props) {
  const [state, action, pending] = useActionState(updateGamingIdentityAction, INITIAL_PROFILE_ACTION_STATE);
  const [games, setGames] = useState(props.favouriteGameIds);
  const [platforms, setPlatforms] = useState(props.platformIds);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "error") formRef.current?.querySelector<HTMLElement>(
      state.field === "gamingSince" ? "#gaming-since" : `#${state.field === "platforms" ? "platform-options" : "game-options"} input`
    )?.focus();
  }, [state]);
  function move(index: number, offset: number) {
    setGames((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  }
  return (
    <form ref={formRef} action={action} className="space-y-sa-5"
      // Server Actions reset native controls after submission. This is an editor,
      // so retain the submitted values alongside the controlled selection/order.
      onReset={(event) => event.preventDefault()}>
      <p className="text-sm leading-6 text-sa-text-muted">All fields are optional. Minimal identity is complete identity. These describe what you choose to share, not your skill or observed activity.</p>
      <input type="hidden" name="favouriteGameIds" value={JSON.stringify(games)} />
      <input type="hidden" name="platformIds" value={JSON.stringify(platforms)} />
      <fieldset disabled={pending} id="game-options" className="space-y-sa-3" aria-describedby="gaming-message">
        <legend className="sa-type-label text-xs">Favourite Games (optional)</legend>
        <div className="grid gap-sa-2 sm:grid-cols-2">
          {GAME_DEFINITIONS.map((game) => (
            <label key={game.id} className={optionClass}>
              <input type="checkbox" checked={games.includes(game.id)} className="h-4 w-4 shrink-0 accent-sa-accent focus-visible:ring-2 focus-visible:ring-sa-accent"
                onChange={(event) => setGames((current) => event.target.checked ? [...current, game.id] : current.filter((id) => id !== game.id))} />
              <span>{game.name}</span>
            </label>
          ))}
        </div>
        {games.length > 1 ? <ol aria-label="Favourite game display order" className="space-y-sa-2">
          {games.map((id, index) => {
            const name = GAME_DEFINITIONS.find((game) => game.id === id)?.name ?? id;
            return <li key={id} className="flex flex-wrap items-center gap-sa-2 text-sm">
              <span className="min-w-0 flex-1 break-words">{index + 1}. {name}</span>
              <button type="button" className={moveClass} disabled={index === 0} aria-label={`Move ${name} up`} onClick={() => move(index, -1)}>↑</button>
              <button type="button" className={moveClass} disabled={index === games.length - 1} aria-label={`Move ${name} down`} onClick={() => move(index, 1)}>↓</button>
            </li>;
          })}
        </ol> : null}
        <PrivacyToggle id="games-public" name="favouriteGamesIsPublic" label="Show Favourite Games publicly" description="Off means only you can see this identity field." defaultChecked={props.favouriteGamesIsPublic} />
      </fieldset>
      <fieldset disabled={pending} id="platform-options" className="space-y-sa-3" aria-describedby="gaming-message">
        <legend className="sa-type-label text-xs">Platforms (optional)</legend>
        <div className="grid gap-sa-2 sm:grid-cols-2">
          {PLATFORM_DEFINITIONS.map((platform) => <label key={platform.id} className={optionClass}>
            <input type="checkbox" checked={platforms.includes(platform.id)} className="h-4 w-4 shrink-0 accent-sa-accent focus-visible:ring-2 focus-visible:ring-sa-accent"
              onChange={(event) => setPlatforms((current) => event.target.checked ? [...current, platform.id] : current.filter((id) => id !== platform.id))} />
            <span>{platform.name}</span>
          </label>)}
        </div>
        <PrivacyToggle id="platforms-public" name="platformsIsPublic" label="Show Platforms publicly" description="Off means only you can see this identity field." defaultChecked={props.platformsIsPublic} />
      </fieldset>
      <fieldset disabled={pending} className="space-y-sa-3">
        <label htmlFor="gaming-since" className="sa-type-label text-xs">Gaming Since (optional)</label>
        <p id="gaming-since-help" className="text-xs leading-5 text-sa-text-technical">Your declared start year, not verified history or a credential. Clear the field to remove it.</p>
        <input id="gaming-since" name="gamingSince" type="text" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" defaultValue={props.gamingSince ?? ""}
          aria-invalid={state.field === "gamingSince"} aria-describedby="gaming-since-help gaming-message"
          className="min-h-11 w-full border border-sa-border-strong bg-sa-surface-inset px-sa-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-sa-accent sm:max-w-48 sm:text-sm" />
        <PrivacyToggle id="gaming-since-public" name="gamingSinceIsPublic" label="Show Gaming Since publicly" description="Off means only you can see this identity field." defaultChecked={props.gamingSinceIsPublic} />
      </fieldset>
      <p id="gaming-message" role="status" aria-live="polite" className={`text-sm ${state.status === "error" ? "text-sa-negative" : "text-sa-text-muted"}`}>{state.message}</p>
      <SubmitButton pendingLabel="Saving gaming identity…">Save gaming identity</SubmitButton>
    </form>
  );
}
