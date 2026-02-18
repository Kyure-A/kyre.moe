import type { Meta, StoryObj } from "@storybook/react";
import Image from "next/image";
import GlitchImage from "./GlitchImage";

type StoryProps = Omit<React.ComponentProps<typeof GlitchImage>, "children">;

const GlitchImageStory = (props: StoryProps) => (
  <div className="max-w-[280px]">
    <GlitchImage {...props}>
      <Image
        src="/kyure_a.png"
        alt="Kyure_A"
        width={460}
        height={952}
        className="w-full h-auto"
      />
    </GlitchImage>
  </div>
);

const meta = {
  title: "Shared/GlitchImage",
  component: GlitchImageStory,
  tags: ["autodocs"],
  args: {
    interval: 1,
    probability: 80,
    glitchDuration: 600,
    intensity: 5,
    active: true,
    startDelayMs: 0,
    ambientNoiseStrength: 0.1,
    coolNoiseStrength: 0.3,
  },
} satisfies Meta<typeof GlitchImageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StrongEffect: Story = {
  args: {
    intensity: 9,
    ambientNoiseStrength: 0.2,
    coolNoiseStrength: 0.6,
  },
};
