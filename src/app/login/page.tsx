import { Suspense } from "react";
import LoginPage from "./loginPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}