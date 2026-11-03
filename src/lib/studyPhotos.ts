/*
 * Photos of Indian students at their desks, for the pictures of a study room
 * on the phone's front door and the home page (Paul, 4 Nov 2026: "images in
 * the online tiles, indian students"). Stock photos, free under the Unsplash
 * License, which allows this use without attribution; credits:
 *   Vikas Makwana (unsplash.com/photos/upn798iEEYM), Fotos (TLdmnQz4Pns),
 *   Kyle Gregory Devaras (6RTM8EsD1T8), Amit Ranjan (3S0Ucv4BDCk).
 */
export const STUDY_TILES = [
  { on: 'Reading', photo: 'photo-1617009762269-c062aaf6b3a0', focus: '60% 30%' },
  { on: 'Exam prep', photo: 'photo-1637589308599-3478cc55510d', focus: '40% 30%' },
  { on: 'Homework', photo: 'photo-1514369118554-e20d93546b30', focus: '50% 25%' },
  { on: 'My project', photo: 'photo-1604177091072-b7b677a077f6', focus: '50% 30%' },
]

/** A tile's photo from Unsplash's CDN, cropped to the size it is shown at. */
export const studyPhoto = (photo: string, w = 360, h = 270) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${w}&h=${h}&q=70`
