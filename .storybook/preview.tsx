import type { Preview } from "@storybook/react";
import "../app/globals.css";
import ThemeProvider from "@/shared/ui/ThemeProvider/ThemeProvider";
import { css } from "styled-system/css";

const previewFrameClass = css({
  width: "full",
  minHeight: "screen",
  py: "10",
  px: "6",
});

const preview: Preview = {
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className={previewFrameClass}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
