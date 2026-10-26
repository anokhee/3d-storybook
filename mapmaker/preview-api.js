// A stand-in for storybook/preview-api, for stories that call its hooks in
// their render: the React ones as React's, useArgs with nothing to update.
export { useEffect, useRef, useState, useMemo, useCallback } from "react";
export const useArgs = () => [{}, () => {}];
export const addons = { getChannel: () => ({ emit() {}, on() {}, off() {} }) };
