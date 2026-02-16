import NextLink from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type LinkProps = ComponentProps<typeof NextLink>;

export const Link = ({ children, ...props }: LinkProps) => {
  return <NextLink {...props}>{children}</NextLink>;
};

export const ViewTransitions = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};
