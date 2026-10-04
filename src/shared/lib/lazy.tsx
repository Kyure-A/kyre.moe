import { type Child, type FC, useEffect, useState } from "hono/jsx";

// Loading happens only after mounting, so server rendering never imports WebGL.
export const lazy = <Props extends object>(
  load: () => Promise<{ default: FC<Props> }>,
): FC<Props & { fallback?: Child }> => {
  let component: FC<Props> | undefined;
  let pending: Promise<void> | undefined;
  return function LazyComponent({ fallback = null, ...props }) {
    const [loaded, setLoaded] = useState(() => Boolean(component));
    useEffect(() => {
      if (component) return;
      let mounted = true;
      pending ??= load().then((module) => {
        component = module.default;
      });
      void pending
        .then(() => {
          if (mounted) setLoaded(true);
        })
        .catch(() => {
          // Keep the static fallback usable if an optional animation fails to load.
          pending = undefined;
        });
      return () => {
        mounted = false;
      };
    }, []);
    const Component = component;
    return loaded && Component ? (
      <Component {...(props as Props)} />
    ) : (
      // biome-ignore lint/complexity/noUselessFragments: Hono components must return a JSX element.
      <>{fallback}</>
    );
  };
};
