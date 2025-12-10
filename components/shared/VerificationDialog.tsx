"use client";

import { useEffect, useRef, useState } from "react";

import { CheckIcon, MailIcon } from "lucide-react";

import { OTPInput, type SlotProps } from "input-otp";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

const CORRECT_CODE = "11208";

const VerificationDialog = () => {
  const [value, setValue] = useState("");
  const [hasGuessed, setHasGuessed] = useState<undefined | boolean>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (hasGuessed) {
      closeButtonRef.current?.focus();
    }
  }, [hasGuessed]);

  async function onSubmit(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault?.();

    inputRef.current?.select();
    await new Promise((r) => setTimeout(r, 1_00));

    setHasGuessed(value === CORRECT_CODE);

    setValue("");
    setTimeout(() => {
      inputRef.current?.blur();
    }, 20);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="shad-button_primary"
        >
          Test pop-up
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-dark-2 border-dark-4">
        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10",
              { "bg-primary-500/20": hasGuessed }
            )}
            aria-hidden="true"
          >
            {hasGuessed ? (
              <CheckIcon className="text-primary-500" strokeWidth={1} />
            ) : (
              <MailIcon className="text-primary-500" strokeWidth={1} />
            )}
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center text-light-1">
              {hasGuessed ? "Account verified!" : "Check Your Email"}
            </DialogTitle>
            <DialogDescription className="sm:text-center text-light-3">
              {hasGuessed ? (
                <span>
                  Congratulations! your email account{" "}
                  <strong className="text-light-1">Ami*******ed@gmail.com</strong>{" "}
                  has been verified
                </span>
              ) : (
                <span>
                  We have sent a verification code to{" "}
                  <strong className="text-light-1">Ami*******ed@gmail.com</strong>.
                  Please check your inbox and input the code below to activate
                  your account. Try {CORRECT_CODE}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {hasGuessed ? (
          <div className="text-center">
            <DialogClose asChild>
              <Button
                type="button"
                ref={closeButtonRef}
                className="bg-primary-500 hover:bg-primary-600 text-light-1"
              >
                Continue
              </Button>
            </DialogClose>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <OTPInput
                id="confirmation-code"
                ref={inputRef}
                value={value}
                onChange={setValue}
                containerClassName="flex items-center gap-3 has-disabled:opacity-50"
                maxLength={5}
                onFocus={() => setHasGuessed(undefined)}
                render={({ slots }) => (
                  <div className="flex gap-2">
                    {slots.map((slot, idx) => (
                      <Slot key={idx} {...slot} />
                    ))}
                  </div>
                )}
                onComplete={onSubmit}
              />
            </div>
            {hasGuessed === false && (
              <p
                className="text-red text-center text-xs"
                role="alert"
                aria-live="polite"
              >
                Invalid code. Please try again.
              </p>
            )}
            <p className="text-center text-sm text-light-3">
              Didn't get a code?{" "}
              <a
                className="text-primary-500 hover:text-primary-600 hover:underline"
                href="#"
              >
                Resend
              </a>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

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

export default VerificationDialog;
