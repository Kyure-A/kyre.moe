import type { Meta, StoryObj } from "@storybook/react";
import {
  sampleBlogPostsEn,
  sampleBlogPostsJa,
} from "@/shared/lib/storybook/blog-fixtures";
import BlogTagIndex from "./BlogTagIndex";

const meta = {
  title: "Pages/Blog/BlogTagIndex",
  component: BlogTagIndex,
  tags: ["autodocs"],
  args: {
    lang: "ja",
    tag: "intro",
    posts: sampleBlogPostsJa.filter((post) => post.tags.includes("intro")),
  },
} satisfies Meta<typeof BlogTagIndex>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Japanese: Story = {};

export const English: Story = {
  args: {
    lang: "en",
    posts: sampleBlogPostsEn.filter((post) => post.tags.includes("intro")),
  },
};

export const Empty: Story = {
  args: {
    posts: [],
  },
};
