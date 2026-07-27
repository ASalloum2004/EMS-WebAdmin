import type { CSSProperties } from "react";
import type { SkeletonDimension, SkeletonProps } from "./Skeleton.types";
import "./Skeleton.scss";

type SkeletonStyle = CSSProperties & {
  "--skeleton-border-radius"?: string;
  "--skeleton-height"?: string;
  "--skeleton-width"?: string;
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getCssSize(value: SkeletonDimension | undefined) {
  return typeof value === "number" ? `${value}px` : value;
}

export function Skeleton({
  borderRadius,
  className,
  height,
  variant = "text",
  width,
}: SkeletonProps) {
  const style: SkeletonStyle = {
    "--skeleton-border-radius": getCssSize(borderRadius),
    "--skeleton-height": getCssSize(height),
    "--skeleton-width": getCssSize(width),
  };

  return (
    <span
      aria-hidden="true"
      className={classNames(
        "skeleton",
        `skeleton--${variant}`,
        className,
      )}
      style={style}
    />
  );
}
