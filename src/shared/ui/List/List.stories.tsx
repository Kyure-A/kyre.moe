import type { Meta, StoryObj } from "@storybook/react";
import List from "./List";

const meta = {
  title: "Shared/List",
  component: List,
  tags: ["autodocs"],
  args: {
    items: ["Emacs", "Roguelike", "Nix"],
  },
} satisfies Meta<typeof List>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Japanese: Story = {
  args: {
    items: ["キュレェ", "大阪", "プログラミング"],
  },
};
