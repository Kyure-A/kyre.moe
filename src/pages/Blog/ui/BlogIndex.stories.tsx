import type { Meta, StoryObj } from "@storybook/react";
import {
  sampleBlogPostsEn,
  sampleBlogPostsJa,
} from "@/shared/lib/storybook/blog-fixtures";
import BlogIndex from "./BlogIndex";

const meta = {
  title: "Pages/Blog/BlogIndex",
  component: BlogIndex,
  tags: ["autodocs"],
  args: {
    lang: "ja",
    posts: sampleBlogPostsJa,
  },
} satisfies Meta<typeof BlogIndex>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Japanese: Story = {};

export const English: Story = {
  args: {
    lang: "en",
    posts: sampleBlogPostsEn,
  },
};

export const Empty: Story = {
  args: {
    posts: [],
  },
};
