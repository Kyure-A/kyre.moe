import type { Meta, StoryObj } from "@storybook/react";
import FadeTransition from "./FadeTransition";

const meta = {
  title: "Shared/FadeTransition",
  component: FadeTransition,
  tags: ["autodocs"],
  args: {
    activeIndex: 0,
    duration: 500,
    blur: false,
    children: [
      <div
        key="one"
        className="rounded-xl border border-[var(--border-subtle)] p-5 text-[var(--text-primary)]"
      >
        First content
      </div>,
      <div
        key="two"
        className="rounded-xl border border-[var(--border-subtle)] p-5 text-[var(--text-primary)]"
      >
        Second content
      </div>,
    ],
  },
} satisfies Meta<typeof FadeTransition>;

export default meta;

type Story = StoryObj<typeof meta>;

export const First: Story = {};

export const Second: Story = {
  args: {
    activeIndex: 1,
  },
};

export const WithBlur: Story = {
  args: {
    blur: true,
    activeIndex: 1,
  },
};
