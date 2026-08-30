type FontSpec = {
  name: string
  data: ArrayBuffer
  weight: 700
  style: 'normal'
}

export const loadFonts = (fontData: ArrayBuffer): FontSpec[] => [
  {
    name: 'M PLUS Rounded 1c',
    data: fontData,
    weight: 700,
    style: 'normal',
  },
]
