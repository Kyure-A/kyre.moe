import type { Meta, StoryObj } from "@storybook/react";
import { sampleTagItemsJa } from "@/shared/lib/storybook/blog-fixtures";
import BlogTagList from "./BlogTagList";

const meta = {
  title: "Pages/Blog/BlogTagList",
  component: BlogTagList,
  tags: ["autodocs"],
  args: {
    lang: "ja",
    tags: sampleTagItemsJa,
  },
} satisfies Meta<typeof BlogTagList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Japanese: Story = {};

export const English: Story = {
  args: {
    lang: "en",
  },
};

export const Empty: Story = {
  args: {
    tags: [],
  },
};
