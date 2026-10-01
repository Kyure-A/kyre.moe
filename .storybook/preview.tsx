import type { Preview } from "@storybook/react";
import type { ComponentType } from "react";
import { StoryNavigation } from "./rshono-navigation";
import "../src/app/globals.css";
import { css } from "styled-system/css";
import ThemeProvider from "@/shared/ui/ThemeProvider/ThemeProvider";

const previewFrameClass = css({
  width: "full",
  minHeight: "screen",
  py: "10",
  px: "6",
});

const StoryRouter = ({
  Story,
  pathname,
}: {
  Story: ComponentType;
  pathname: string;
}) => {
  return (
    <StoryNavigation pathname={pathname}>
      <ThemeProvider>
        <div className={previewFrameClass}>
          <Story />
        </div>
      </ThemeProvider>
    </StoryNavigation>
  );
};

const preview: Preview = {
  parameters: {
    layout: "centered",
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
    (Story, context) => (
      <StoryRouter
        Story={Story}
        pathname={context.parameters.router?.pathname ?? "/ja"}
      />
    ),
  ],
};

export default preview;
