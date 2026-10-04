import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import About from "./server-pages/About";
import Accounts from "./server-pages/Accounts";
import { AssetContext, type PageAssets } from "./server-pages/Assets";
import Blog from "./server-pages/Blog";
import History from "./server-pages/History";
import Home from "./server-pages/Home";
import NotFound from "./server-pages/NotFound";
import Post from "./server-pages/Post";
import Tag from "./server-pages/Tag";
import Tags from "./server-pages/Tags";
import type { PageProps } from "./server-pages/types";
import { NavigationProvider } from "./shared/lib/navigation";

export function createApp(assets: PageAssets) {
  const app = new Hono();
  const pages = [
    ["/", Home],
    ["/404", NotFound],
    ["/:lang", Home],
    ["/:lang/about", About],
    ["/:lang/accounts", Accounts],
    ["/:lang/history", History],
    ["/:lang/blog", Blog],
    ["/:lang/blog/tag", Tags],
    ["/:lang/blog/tag/:tag", Tag],
    ["/:lang/blog/:slug", Post],
  ] as const;
  for (const [path, Page] of pages) {
    app.get(path, (c) => {
      const props: PageProps = {
        params: c.req.param(),
        url: new URL(c.req.url),
      };
      return c.html(
        <NavigationProvider pathname={props.url.pathname}>
          <AssetContext.Provider value={assets}>
            <Page {...props} />
          </AssetContext.Provider>
        </NavigationProvider>,
      );
    });
  }
  const fallback = (url: URL) => (
    <NavigationProvider pathname={url.pathname}>
      <AssetContext.Provider value={assets}>
        <NotFound params={{}} url={url} />
      </AssetContext.Provider>
    </NavigationProvider>
  );
  app.notFound((c) => c.html(fallback(new URL(c.req.url)), 404));
  app.onError((error, c) => {
    if (error instanceof HTTPException && error.status === 404) {
      return c.html(fallback(new URL(c.req.url)), 404);
    }
    throw error;
  });
  return app;
}

export default createApp({
  script: "/src/app/client.tsx",
  styles: [],
});
