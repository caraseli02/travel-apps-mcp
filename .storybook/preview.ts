import type { Preview } from "@storybook/react";
import "../resources/styles.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#f5f7fa" },
        { name: "dark", value: "#111820" },
        { name: "white", value: "#ffffff" },
      ],
    },
  },
};

export default preview;
