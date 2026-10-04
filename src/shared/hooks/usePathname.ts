import { useNavigation } from "@/shared/lib/navigation";
export const usePathname = () => {
  const { url } = useNavigation();
  return url.pathname;
};
