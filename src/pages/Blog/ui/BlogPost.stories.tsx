import type { Meta, StoryObj } from "@storybook/react";
import { sampleBlogPostJa } from "@/shared/lib/storybook/blog-fixtures";
import BlogPostView from "./BlogPost";

const meta = {
  title: "Pages/Blog/BlogPost",
  component: BlogPostView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    post: sampleBlogPostJa,
  },
} satisfies Meta<typeof BlogPostView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutCanonicalAndCover: Story = {
  args: {
    post: {
      ...sampleBlogPostJa,
      canonical: undefined,
      cover: undefined,
    },
  },
};
