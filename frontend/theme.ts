"use client";

import { createTheme } from "@mantine/core";

export const theme = createTheme({
  fontFamily: 'sans-serif', // Default font for non-headings
  headings: {
    fontFamily: 'Exo 2, serif',
  },
  colors: {
    purple: [
      '#fff4ff', // Purple 50
      '#fff0ff', // Purple 100
      '#faebff', // Purple 200
      '#efdfff', // Purple 300
      '#ccbde2', // Purple 400
      '#ad9fc2', // Purple 500
      '#837597', // Purple 600
      '#6e6182', // Purple 700
      '#4e4261', // Purple 800
      '#2b213d', // Purple 900
    ],
    green: [
      '#f4f7ec', // Green 50
      '#e5eacf', // Green 100
      '#d3dcb2', // Green 200
      '#c3ce96', // Green 300
      '#b6c480', // Green 400
      '#aaba6c', // Green 500
      '#9bab63', // Green 600
      '#879759', // Green 700
      '#748351', // Green 800
      '#556142', // Green 900
    ],
    pink: [
      '#f2e8f3', // Pink 50
      '#e1c5e3', // Pink 100
      '#d2a2d1', // Pink 200
      '#c781bf', // Pink 300
      '#c16baf', // Pink 400
      '#c05c9f', // Pink 500
      '#af5796', // Pink 600
      '#995289', // Pink 700
      '#834c7b', // Pink 800
      '#5d4261', // Pink 900
    ],
    bordo: [
      '#faebef', // Bordo 50
      '#e4d0d9', // Bordo 100
      '#cdb2bf', // Bordo 200
      '#b694a3', // Bordo 300
      '#a37b8e', // Bordo 400
      '#926379', // Bordo 500
      '#845a6f', // Bordo 600
      '#724d61', // Bordo 700
      '#614255', // Bordo 800
      '#4f3547', // Bordo 900
    ],
    brown: [
      '#ebebeb', // Brown 50
      '#cdcdcd', // Brown 100
      '#b0aca9', // Brown 200
      '#958983', // Brown 300
      '#807065', // Brown 400
      '#6c5749', // Brown 500
      '#614e42', // Brown 600
      '#524238', // Brown 700
      '#43362f', // Brown 800
      '#342924', // Brown 900
    ],
    blue: [
      '#e7f5ff', // Blue 0
      '#efedff', // Blue 50
      '#d1d7f0', // Blue 100
      '#b8bcd9', // Blue 200
      '#9da1c3', // Blue 300
      '#898db1', // Blue 400
      '#747aa0', // Blue 500
      '#535877', // Blue 600
      '#424661', // Blue 700
      '#2e3149', // Blue 900
      '#339af0', // Blue 5
      '#1864ab', // Blue 9
    ],
    grey: [
      '#f8f9fa', // Grey 0
      '#f1f3f5', // Grey 100
      '#e9ecef', // Grey 200
      '#dee2e6', // Grey 300
      '#ced4da', // Grey 400
      '#adb5bd', // Grey 500
      '#868e96', // Grey 600
      '#495057', // Grey 700
      '#343a40', // Grey 800
      '#212529', // Grey 900
    ],
    gray: [
      '#f8f9fa', // Gray 0
      '#dee2e6', // Gray 3
      '#ced4da', // Gray 4
      '#adb5bd', // Gray 5
      '#868e96', // Gray 6
      '#495057', // Gray 7
      '#212529', // Gray 9
    ],
    red: ['#f03e3e'], // Red 7
  },
});
