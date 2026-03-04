"use client";

import { useEffect, useRef, useState } from "react";
import { MailIcon } from "lucide-react";
import { OTPInput, type SlotProps } from "input-otp";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, maskEmail } from "@/lib/utils";
import type { verificationProps } from "@/app/types";

function Slot(props: SlotProps) {
  return (
    <div
      className={cn(
        "border-dark-4 bg-dark-3 text-light-1 flex size-9 items-center justify-center rounded-md border font-medium shadow-xs transition-[color,box-shadow]",
        {
          "border-primary-500 ring-primary-500/50 z-10 ring-[3px]":
            props.isActive,
        }
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
    </div>
  );
}

export default function VerificationDialog({
  isOpen,
  email,
  onClose,
  onComplete,
  onResend,
  resendColldown = 60,
}: verificationProps) {
  const [value, setValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const maskedEmail = email ? maskEmail(email) : "";

  useEffect(() => {
    if (!isOpen) {
      setValue("");
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleComplete(code: string) {
    if (!code || isVerifying) return;
    setIsVerifying(true);
    setError(null);
    try {
      await onComplete(code);
      onClose();
    } catch {
      setError("Invalid code. Please try again.");
      setValue("");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || !onResend) return;
    try {
      await onResend();
      setCooldown(resendColldown);
    } catch {
      setError("Failed to resend. Try again.");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-dark-2 border-dark-4">
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10"
            aria-hidden="true"
          >
            <MailIcon className="text-primary-500" strokeWidth={1} />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center text-light-1">
              Check Your Email
            </DialogTitle>
            <DialogDescription className="sm:text-center text-light-3">
              We have sent a verification code to{" "}
              <strong className="text-light-1">{maskedEmail}</strong>. Please
              check your inbox and enter the code below.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <OTPInput
              id="confirmation-code"
              ref={inputRef}
              value={value}
              onChange={setValue}
              containerClassName="flex items-center gap-3 has-disabled:opacity-50"
              maxLength={6}
              render={({ slots }) => (
                <div className="flex gap-2">
                  {slots.map((slot, idx) => (
                    <Slot key={idx} {...slot} />
                  ))}
                </div>
              )}
              onComplete={(code) => handleComplete(code)}
              disabled={isVerifying}
            />
          </div>
          {error && (
            <p
              className="text-red text-center text-xs"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}
          <p className="text-center text-sm text-light-3">
            Didn&apos;t get a code?{" "}
            <button
              type="button"
              className="text-primary-500 hover:text-primary-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleResend}
              disabled={cooldown > 0 || !onResend}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
