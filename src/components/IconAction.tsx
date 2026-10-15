import type { IconButtonProps } from "@astryxdesign/core/IconButton";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Tooltip } from "@astryxdesign/core/Tooltip";

export function IconAction({
  label,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <Tooltip content={label} placement="below" delay={450}>
      <IconButton
        variant="ghost"
        label={label}
        className={`icon-action ${className}`}
        {...props}
      />
    </Tooltip>
  );
}
