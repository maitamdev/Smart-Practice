export type AdminAccount = {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "student";
};
