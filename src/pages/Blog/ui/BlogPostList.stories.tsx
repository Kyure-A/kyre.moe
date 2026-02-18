import type { Meta, StoryObj } from "@storybook/react";
import { sampleBlogPostsJa } from "@/shared/lib/storybook/blog-fixtures";
import BlogPostList from "./BlogPostList";

const meta = {
  title: "Pages/Blog/BlogPostList",
  component: BlogPostList,
  tags: ["autodocs"],
  args: {
    posts: sampleBlogPostsJa,
    emptyLabel: "まだ記事がありません。",
  },
} satisfies Meta<typeof BlogPostList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    posts: [],
  },
};
