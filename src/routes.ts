import { defineRoutes } from "@rshono/core";
import index from "./generated/blog-index.json";

const languages = [{ lang: "ja" }, { lang: "en" }];

export const routes = defineRoutes({
  routes: [
    {
      path: "/",
      render: "static",
      component: () => import("./server-pages/Home"),
    },
    {
      path: "/404",
      render: "static",
      component: () => import("./server-pages/NotFound"),
    },
    {
      path: "/:lang",
      render: "static",
      staticPaths: () => languages,
      component: () => import("./server-pages/Home"),
    },
    {
      path: "/:lang/about",
      render: "static",
      staticPaths: () => languages,
      component: () => import("./server-pages/About"),
    },
    {
      path: "/:lang/accounts",
      render: "static",
      staticPaths: () => languages,
      component: () => import("./server-pages/Accounts"),
    },
    {
      path: "/:lang/history",
      render: "static",
      staticPaths: () => languages,
      component: () => import("./server-pages/History"),
    },
    {
      path: "/:lang/blog",
      render: "static",
      staticPaths: () => languages,
      component: () => import("./server-pages/Blog"),
    },
    {
      path: "/:lang/blog/tag",
      render: "static",
      staticPaths: () => languages,
      component: () => import("./server-pages/Tags"),
    },
    {
      path: "/:lang/blog/tag/:tag",
      render: "static",
      staticPaths: () =>
        Object.entries(index.tags).flatMap(([lang, tags]) =>
          tags.map((tag) => ({ lang, tag: tag.slug })),
        ),
      component: () => import("./server-pages/Tag"),
    },
    {
      path: "/:lang/blog/:slug",
      render: "static",
      staticPaths: () => index.posts.map(({ lang, slug }) => ({ lang, slug })),
      component: () => import("./server-pages/Post"),
    },
  ],
  notFound: { component: () => import("./server-pages/NotFound") },
});
