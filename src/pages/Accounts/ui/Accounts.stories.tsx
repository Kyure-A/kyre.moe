import type { Meta, StoryObj } from "@storybook/react";
import Accounts from "./Accounts";

const meta = {
  title: "Pages/Accounts/Accounts",
  component: Accounts,
  tags: ["autodocs"],
  args: {
    lang: "ja",
  },
} satisfies Meta<typeof Accounts>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Japanese: Story = {};

export const English: Story = {
  args: {
    lang: "en",
  },
};
