"use client";

import { useSearchParams } from "next/navigation";
import { MfaChallengeForm } from "./mfa-challenge-form";
import { MfaEnrollFlow } from "./mfa-enroll-flow";

export function MfaRouter() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step");

  if (step === "enroll") {
    return <MfaEnrollFlow />;
  }
  return <MfaChallengeForm />;
}
