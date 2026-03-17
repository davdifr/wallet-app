"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type UseActionFormSyncOptions = {
  success: boolean;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
};

export function useActionFormSync({
  success,
  resetOnSuccess = true,
  onSuccess
}: UseActionFormSyncOptions) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const handledRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);

  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (success && !handledRef.current) {
      handledRef.current = true;

      if (resetOnSuccess) {
        formRef.current?.reset();
      }

      onSuccessRef.current?.();
      router.refresh();
    }

    if (!success) {
      handledRef.current = false;
    }
  }, [resetOnSuccess, router, success]);

  return formRef;
}
