import type { Preview } from "@storybook/react";
import "../resources/styles.css";

// Mock the ChatGPT Apps SDK bridge for Storybook
if (typeof window !== "undefined") {
  (window as any).openai = {
    callTool: async (name: string, args: any) => {
      console.log(`[Mock OpenAI] Called tool ${name} with args:`, args);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }
  };
}

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
