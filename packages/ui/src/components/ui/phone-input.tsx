import React, { forwardRef } from "react"
import PhoneInputFromLib from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { Input } from "@/presentation/components/ui/input"
import { cn } from "@/lib/utils"

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string
  onChange: (value: string | undefined) => void
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    return (
      <PhoneInputFromLib
        international
        defaultCountry="BR"
        value={value}
        onChange={onChange}
        inputComponent={Input}
        /**
         * We need to handle the ref manually because react-phone-number-input
         * might pass it differently or we want to forward it to the underlying Input.
         * However, react-phone-number-input forwards ref to the input component.
         */
        // ref={ref} // react-phone-number-input handles ref forwarding if using inputComponent?
        // Let's verify standard usage. Usually it just works.
        className={cn("flex", className)}
        numberInputProps={{
            className: cn("rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className), // styling the input itself
            ref: ref, // Forward ref to the input
            ...props
        }}
      />
    )
  }
)

PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
