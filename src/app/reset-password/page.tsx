import { Suspense } from "react";
import ResetPasswordPage from "./reset-page";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}