// One place to manage every song. The Map jukebox and the Music page both read from here.
// To add a release: change `released` to true, set the real title, and fill in the links.
// Leave a link as '' and its button simply won't show.

export const MUSIC_SECTION_NAME = 'MESSAGES FROM BEYOND' // rename this one line to rename the section everywhere

export const SONGS = [
  {
    id: 'cosmic-scars',
    title: 'COSMIC SCARS',
    released: true,
    date: 'AUG 2026',
    blurb: 'The song that started the signal.',
    cover: '', // e.g. '/covers/cosmic-scars.jpg' (put the image in your /public/covers folder)
    spotify: 'https://open.spotify.com/album/30gxzgYB2Yhlo5zKDpdGXR',
    apple: 'https://music.apple.com/us/album/cosmic-scars/6800647953?i=6800647954',
    youtube: '', // paste your YouTube link here
  },
  {
    id: 'signal-2',
    title: 'UNKNOWN SIGNAL',
    released: false,
    date: 'OCT 2026',
    blurb: 'Something is coming through.',
    cover: '',
    spotify: '',
    apple: '',
    youtube: '',
  },
  {
    id: 'signal-3',
    title: 'UNKNOWN SIGNAL',
    released: false,
    date: 'JAN 2027',
    blurb: 'Still too faint to read.',
    cover: '',
    spotify: '',
    apple: '',
    youtube: '',
  },
]

export const PLATFORMS = [
  { key: 'spotify', label: 'SPOTIFY', color: '30,215,96' },
  { key: 'apple', label: 'APPLE MUSIC', color: '250,87,110' },
  { key: 'youtube', label: 'YOUTUBE', color: '255,70,70' },
]