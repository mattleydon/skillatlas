export type ProfileActionField =
  | "username"
  | "displayName"
  | "bio"
  | "representingCountry"
  | "birthCountry"
  | "residenceCountry"
  | "cityTown"
  | "heritage";

export type ProfileActionState = {
  status: "idle" | "error" | "success";
  message: string;
  field?: ProfileActionField;
};

export const INITIAL_PROFILE_ACTION_STATE: ProfileActionState = {
  status: "idle",
  message: "",
};
