import paths from "../generated/prerender-paths.json";

// GitHub Pages has one representation per file and cannot vary a page on RSC: 1.
// rshono generates the matching Flight payload alongside each HTML document.
const published = new Set(paths);
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const source = input instanceof Request ? input : null;
  const url = new URL(source?.url ?? String(input), window.location.href);
  const method = init?.method ?? source?.method ?? "GET";
  const requestHeaders = new Headers(init?.headers ?? source?.headers);
  if (
    method.toUpperCase() !== "GET" ||
    requestHeaders.get("rsc") !== "1" ||
    url.origin !== window.location.origin
  ) {
    return nativeFetch(input, init);
  }
  const request = new Request(input, init);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const path = published.has(pathname) ? pathname : "/404";
  url.pathname = `${path === "/" ? "" : path}/index.rsc`;
  url.search = "";
  const response = await nativeFetch(new Request(url, request));
  const headers = new Headers(response.headers);
  // Static hosts use application/octet-stream for .rsc. React needs Flight's type.
  headers.set("content-type", "text/x-component");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
