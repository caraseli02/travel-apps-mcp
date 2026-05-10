import type { Meta, StoryObj } from "@storybook/react";
import { TravelDestinationGuideLayout } from "./widget";
import * as fixtures from "../stories/fixtures/travelFixtures";

const meta: Meta<typeof TravelDestinationGuideLayout> = {
  title: "Widgets/TravelDestinationGuide",
  component: TravelDestinationGuideLayout,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TravelDestinationGuideLayout>;

export const Madrid: Story = {
  args: { props: fixtures.destinationGuideMadrid },
};
