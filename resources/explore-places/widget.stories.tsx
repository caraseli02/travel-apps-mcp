import type { Meta, StoryObj } from "@storybook/react";
import { ExplorePlacesLayout } from "./widget";
import * as fixtures from "../stories/fixtures/travelFixtures";

const meta: Meta<typeof ExplorePlacesLayout> = {
  title: "Widgets/ExplorePlaces",
  component: ExplorePlacesLayout,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof ExplorePlacesLayout>;

export const Valencia: Story = {
  args: { props: fixtures.explorePlacesValencia },
};

export const Minimal: Story = {
  args: { props: fixtures.explorePlacesMinimal },
};
