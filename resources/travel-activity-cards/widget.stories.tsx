import type { Meta, StoryObj } from "@storybook/react";
import { TravelActivityCardsLayout } from "./widget";
import * as fixtures from "../stories/fixtures/travelFixtures";

const meta: Meta<typeof TravelActivityCardsLayout> = {
  title: "Widgets/TravelActivityCards",
  component: TravelActivityCardsLayout,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TravelActivityCardsLayout>;

export const London: Story = {
  args: { props: fixtures.activityCardsLondon },
};
