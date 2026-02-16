import type { Meta, StoryObj } from "@storybook/react";
import ThemeToggle from "./ThemeToggleSwitch";

const meta = {
  title: "Shared/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
