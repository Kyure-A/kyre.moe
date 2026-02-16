import type { Meta, StoryObj } from "@storybook/react";
import AboutMe from "./AboutMe";

const meta = {
  title: "Pages/AboutMe/AboutMe",
  component: AboutMe,
  tags: ["autodocs"],
  args: {
    lang: "ja",
  },
} satisfies Meta<typeof AboutMe>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Japanese: Story = {};

export const English: Story = {
  args: {
    lang: "en",
  },
};
