import * as React from "react"

interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number
}

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 16 / 9, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{ aspectRatio: `${ratio}`, ...style }}
        {...props}
      />
    )
  }
)

AspectRatio.displayName = "AspectRatio"

export { AspectRatio }

