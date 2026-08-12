export type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string;
  field?: "email" | "token";
};

export const INITIAL_AUTH_ACTION_STATE: AuthActionState = {
  status: "idle",
  message: "",
};
