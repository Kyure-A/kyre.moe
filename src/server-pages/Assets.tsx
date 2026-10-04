import { createContext, useContext } from "hono/jsx";

export type PageAssets = {
  script: string;
  styles: string[];
};
export const AssetContext = createContext<PageAssets>({
  script: "/src/app/client.tsx",
  styles: [],
});
export const useAssets = () => useContext(AssetContext);
