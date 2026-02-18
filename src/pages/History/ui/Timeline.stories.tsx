import type { Meta, StoryObj } from "@storybook/react";
import Timeline from "./Timeline";

const meta = {
  title: "Pages/History/Timeline",
  component: Timeline,
  tags: ["autodocs"],
  args: {
    items: [
      {
        date: "July 10, 2005",
        title: "Kyure_A is born",
        description: "Natto Day, about 2700 g",
      },
      {
        date: "August, 2025",
        title: "1st Sakura AI Hackathon with Kloud",
        description: "Grand Prize",
        url: "https://kloud-hackathon.connpass.com/event/361937/",
      },
    ],
  },
} satisfies Meta<typeof Timeline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    items: [],
  },
};
