import type { Meta, StoryObj } from "@storybook/react";
import { PackingChecklistLayout } from "./widget";
import * as fixtures from "../stories/fixtures/travelFixtures";

const meta: Meta<typeof PackingChecklistLayout> = {
  title: "Widgets/PackingChecklist",
  component: PackingChecklistLayout,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof PackingChecklistLayout>;

export const Amsterdam: Story = {
  args: { props: fixtures.packingChecklistAmsterdam },
};

export const LongTrip: Story = {
  args: { props: fixtures.longPackingChecklistAmsterdam },
};
