import type { Meta, StoryObj } from "@storybook/react";
import { FaTwitter } from "react-icons/fa6";
import Account from "./Account";

const meta = {
  title: "Pages/Accounts/Account",
  component: Account,
  tags: ["autodocs"],
  args: {
    id: "@kyremoe",
    description: "3rd account",
    platform: "Twitter",
    accentColor: "#1DA1F2",
    serviceIcon: <FaTwitter />,
    serviceUrl: "https://x.com/kyremoe",
  },
  argTypes: {
    serviceIcon: {
      control: false,
    },
  },
  render: (args) => (
    <ul className="max-w-xl">
      <Account {...args} />
    </ul>
  ),
} satisfies Meta<typeof Account>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: {
    description: "",
  },
};
