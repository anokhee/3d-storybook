// Applies theme.js to the Storybook shell. Nothing to edit here.
import { addons } from "storybook/manager-api";
import { storyTheme } from "./theme.js";

addons.setConfig({ theme: storyTheme });
