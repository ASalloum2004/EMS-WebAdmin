export type SkeletonVariant = "text" | "circle" | "rect" | "pill";

export type SkeletonDimension = number | string;

export type SkeletonProps = {
  borderRadius?: SkeletonDimension;
  className?: string;
  height?: SkeletonDimension;
  variant?: SkeletonVariant;
  width?: SkeletonDimension;
};
