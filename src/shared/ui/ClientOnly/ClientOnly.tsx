import { type Child, useEffect, useState } from "hono/jsx";

export default function ClientOnly({
  children,
  fallback = null,
}: {
  children: Child;
  fallback?: Child;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}
