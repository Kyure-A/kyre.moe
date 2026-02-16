import type { Meta, StoryObj } from "@storybook/react";
import { FaHome } from "react-icons/fa";
import { FaClock, FaPenNib, FaUser } from "react-icons/fa6";
import { useState } from "react";
import { MdDescription } from "react-icons/md";
import { expect, fn, userEvent, within } from "storybook/test";
import OrbitDock, { type OrbitDockProps } from "./OrbitDock";

const onHomeClick = fn();
const onBlogClick = fn();
const onAccountsClick = fn();
const onHistoryClick = fn();
const onAboutClick = fn();

const items: OrbitDockProps["items"] = [
  { icon: <FaHome />, label: "Home", onClick: onHomeClick },
  { icon: <FaPenNib />, label: "Blog", onClick: onBlogClick },
  { icon: <FaUser />, label: "Accounts", onClick: onAccountsClick },
  { icon: <FaClock />, label: "History", onClick: onHistoryClick },
  { icon: <MdDescription />, label: "About", onClick: onAboutClick },
];

const StoryOrbitDock = (args: OrbitDockProps) => {
  const [rotation, setRotation] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const paused = hovered && !dragging;

  return (
    <div
      className="relative"
      style={{ width: "min(80vmin, 640px)", height: "min(80vmin, 640px)" }}
    >
      <div className="absolute top-2 left-2 z-30 rounded-md border border-[var(--border-subtle)] bg-[var(--bg)]/80 px-2 py-1 text-[11px] text-[var(--text-secondary)] backdrop-blur">
        rotation: {rotation.toFixed(1)}
      </div>
      <div className="absolute inset-0">
        <OrbitDock
          {...args}
          layer="back"
          rotation={rotation}
          hoveredIndex={hoveredIndex}
          paused={paused}
          showDecorations={args.showDecorations}
          dragEnabled={false}
        />
      </div>
      <div className="absolute inset-0">
        <OrbitDock
          {...args}
          layer="front"
          showDecorations={false}
          rotation={rotation}
          hoveredIndex={hoveredIndex}
          paused={paused}
          onRotate={setRotation}
          onHoverIndexChange={setHoveredIndex}
          onHoverChange={setHovered}
          onDragChange={setDragging}
        />
      </div>
    </div>
  );
};

const meta = {
  title: "Shared/OrbitDock",
  component: OrbitDock,
  tags: ["autodocs"],
  args: {
    items,
    showDecorations: true,
    speed: 10,
    size: "min(76vmin, 560px)",
    startAngle: -90,
    tiltX: 64,
    tiltZ: -20,
    dragEnabled: true,
  },
  argTypes: {
    items: { control: false },
    layer: { control: false },
    paused: { control: false },
    rotation: { control: false },
    hoveredIndex: { control: false },
    onRotate: { control: false },
    onHoverIndexChange: { control: false },
    onHoverChange: { control: false },
    onDragChange: { control: false },
  },
  render: (args) => <StoryOrbitDock {...args} />,
} satisfies Meta<typeof OrbitDock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Integrated: Story = {
  play: async ({ canvasElement }) => {
    onHomeClick.mockClear();
    const canvas = within(canvasElement);
    const homeButton = await canvas.findByRole("button", { name: "Home" });
    await userEvent.click(homeButton);
    await expect(onHomeClick).toHaveBeenCalled();
  },
};
