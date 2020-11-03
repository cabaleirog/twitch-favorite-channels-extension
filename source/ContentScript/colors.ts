// console.log(arrayToRGBA([12, 32, 45, 0.1]))
export function arrayToRGBA(array: number[]) {
  return `rgba(${array.join(",")})`;
}

export const COLORS = {
  dark: {
    button: {
      enabled: [35, 80, 35, 1.0],
      disabled: [255, 255, 255, 0.15],
    },
    sidebar: [35, 80, 35, 0.6],
  },
  light: {
    button: {
      enabled: [30, 165, 20, 0.3],
      disabled: [0, 0, 0, 0.0],
    },
    sidebar: [215, 170, 135, 0.0],
  },
};
