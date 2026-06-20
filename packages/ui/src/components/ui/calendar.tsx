"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/presentation/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full p-3", className)}
      components={{
        Chevron: ({ className: chevronClassName, orientation, size = 16 }) => {
          const isDropdownChevron = orientation === "down" || orientation === "up"
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : orientation === "up"
                  ? ChevronUp
                  : ChevronDown

          return (
            <Icon
              className={cn(
                "h-4 w-4 text-muted-foreground",
                isDropdownChevron && "pointer-events-none absolute right-2",
                chevronClassName
              )}
              size={size}
            />
          )
        },
      }}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row sm:gap-4",
        month: "space-y-4",
        month_caption: "relative flex items-center justify-center pt-1",
        caption_label: "inline-flex h-8 items-center whitespace-nowrap pr-6 text-sm font-medium capitalize",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        dropdowns: "flex items-center gap-2",
        dropdown_root:
          "relative inline-flex h-8 min-w-[6rem] items-center rounded-md border border-input bg-background px-2",
        dropdown:
          "absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none border-none bg-transparent p-0 opacity-0",
        months_dropdown: "min-w-[8rem]",
        years_dropdown: "min-w-[6rem]",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "w-9 rounded-md text-center text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground",
        week: "mt-2 flex w-full",
        day: "h-9 w-9 p-0 text-center text-sm relative [&:has([aria-selected])]:bg-accent/40 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 rounded-md p-0 font-normal aria-selected:opacity-100"
        ),
        range_end: "range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-40",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
