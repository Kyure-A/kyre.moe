import type { NavigationState } from "@rshono/core/client";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

const Context = createContext<NavigationState | null>(null);
export function StoryNavigation({
  pathname,
  children,
}: {
  pathname: string;
  children: ReactNode;
}) {
  const [path, setPath] = useState(pathname);
  const value = useMemo<NavigationState>(
    () => ({
      url: new URL(path, "http://localhost"),
      params: {},
      router: {
        push: setPath,
        replace: setPath,
        back: () => setPath(pathname),
        forward: () => {},
        refresh: () => {},
        pending: false,
      },
    }),
    [path, pathname],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useNavigation() {
  const value = useContext(Context);
  if (!value) throw new Error("Story requires StoryNavigation");
  return value;
}
