import type { Meta, StoryObj } from "@storybook/react";
import AnimatedContent from "./AnimatedContent";
import { css } from "styled-system/css";

const demoClass = css({
  borderRadius: "xl",
  borderWidth: "1px",
  borderColor: "border.subtle",
  backgroundColor: "background",
  p: "6",
  color: "text.primary",
});

const meta = {
  title: "Shared/AnimatedContent",
  component: AnimatedContent,
  tags: ["autodocs"],
  args: {
    distance: 100,
    direction: "vertical",
    reverse: false,
    delay: 0,
    threshold: 0.1,
    children: <div className={demoClass}>Fade-in demo content</div>,
  },
} satisfies Meta<typeof AnimatedContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Vertical: Story = {};

export const Horizontal: Story = {
  args: {
    direction: "horizontal",
  },
};

export const Reverse: Story = {
  args: {
    reverse: true,
  },
};
