import index from "../../generated/blog-index.json";
import {
  type BlogPost,
  type BlogPostMeta,
  type BlogTagItem,
  getTagSlug,
} from "./blog";
import type { SiteLang } from "./i18n";

const posts = index.posts as BlogPostMeta[];
const tags = index.tags as Record<SiteLang, BlogTagItem[]>;
const ogImages = index.ogImages as Record<string, string>;
export const getAllPosts = (lang?: SiteLang) =>
  lang ? posts.filter((post) => post.lang === lang) : posts;

export const getPost = async (
  slug: string,
  lang: SiteLang,
): Promise<BlogPost | null> => {
  if (!posts.some((post) => post.lang === lang && post.slug === slug))
    return null;
  const module = await import(`../../generated/posts/${lang}/${slug}.json`);
  return module.default as BlogPost;
};

export const getPostLanguages = (slug: string) =>
  posts.filter((post) => post.slug === slug).map((post) => post.lang);

export const getAllTagItems = (lang: SiteLang) => tags[lang];

export const getTagItem = (slug: string, lang: SiteLang) =>
  tags[lang].find((tag) => tag.slug === getTagSlug(slug)) ?? null;

export const getPostsByTag = (slug: string, lang: SiteLang) =>
  getAllPosts(lang).filter((post) =>
    post.tags.some((tag) => getTagSlug(tag) === getTagSlug(slug)),
  );

export const getOgImage = (path: string) => ogImages[path];
