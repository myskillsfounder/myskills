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

/*
 * Twelve more for the home page's study room, a full gallery of students
 * (Paul, 4 Nov 2026: "show an online study room with a lot of students
 * studying"). Free under the Unsplash License; credits, by photo id:
 *   Sanket Mishra (9i2t23J7HnE), Noman Khan (V4_wB6EywfE), Kelum Chathuranga
 *   (0m-6I48ChD8), litoon dev (wwhm9XVTNAo), The Jopwell Collection
 *   (tgANYv9U10Q), Aejaz Memon (w2eWhTL4kl0), Dollar Gill (Kyoshy7BJIQ),
 *   Skytech Aviation (RhJ-fK2oZAI), Shantanu Kumar (NaVcHdClY7A), Allan Lainez
 *   (N4rPewIaJRk), Sudhakar Chandra (wBzxapFHSOk), Aman Singh (IhEWqtg0ldg).
 */
export const STUDY_CROWD = [
  { on: 'Coding', photo: 'photo-1675664534136-51375fb40129', focus: '50% 30%' },
  { on: 'Assignment', photo: 'photo-1716471453667-94383b1e4859', focus: '50% 25%' },
  { on: 'Spreadsheets', photo: 'photo-1654262609484-76d1a8f3b016', focus: '55% 30%' },
  { on: 'Notes', photo: 'photo-1737308584108-96f61d420638', focus: '50% 30%' },
  { on: 'Online course', photo: 'photo-1677594332295-affd04f83115', focus: '50% 30%' },
  { on: 'Revision', photo: 'photo-1667655699558-8f1b362a67a8', focus: '50% 30%' },
  { on: 'Library hour', photo: 'photo-1567168539593-59673ababaae', focus: '60% 35%' },
  { on: 'Study abroad', photo: 'photo-1762504720470-ffae2ce81038', focus: '50% 30%' },
  { on: 'Practice test', photo: 'photo-1682203534176-60f5d99da756', focus: '50% 35%' },
  { on: 'Reading', photo: 'photo-1616487095890-d4d1487a1d8b', focus: '50% 30%' },
  { on: 'Homework', photo: 'photo-1757877151735-e48f41c26393', focus: '50% 30%' },
  { on: 'Project', photo: 'photo-1682827815893-a0b547563e65', focus: '50% 30%' },
]
