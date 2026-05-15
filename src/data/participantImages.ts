import type { ParticipantImage } from '../types';

type ParticipantImageSet = {
  performance: ParticipantImage;
  portrait: ParticipantImage;
};

const sourceUrl = 'https://www.eurovision.com/newsroom/image-bank/';

export const participantImages: Record<string, ParticipantImageSet> = {
  austria: {
    performance: { src: '/participants/austria-performance.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 38559 },
    portrait: { src: '/participants/austria-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37985 }
  },
  france: {
    performance: { src: '/participants/france-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38553 },
    portrait: { src: '/participants/france-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37981 }
  },
  germany: {
    performance: { src: '/participants/germany-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38373 },
    portrait: { src: '/participants/germany-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37979 }
  },
  italy: {
    performance: { src: '/participants/italy-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38367 },
    portrait: { src: '/participants/italy-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37973 }
  },
  'united-kingdom': {
    performance: { src: '/participants/united-kingdom-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38564 },
    portrait: { src: '/participants/united-kingdom-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37984 }
  },
  belgium: {
    performance: { src: '/participants/belgium-performance.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 38346 },
    portrait: { src: '/participants/belgium-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37726 }
  },
  croatia: {
    performance: { src: '/participants/croatia-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38307 },
    portrait: { src: '/participants/croatia-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37666 }
  },
  finland: {
    performance: { src: '/participants/finland-performance.jpg', credit: '© EBU / Sarah Louise Bennett', sourceUrl, assetId: 38325 },
    portrait: { src: '/participants/finland-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37677 }
  },
  greece: {
    performance: { src: '/participants/greece-performance.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 38312 },
    portrait: { src: '/participants/greece-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37668 }
  },
  israel: {
    performance: { src: '/participants/israel-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38342 },
    portrait: { src: '/participants/israel-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37687 }
  },
  lithuania: {
    performance: { src: '/participants/lithuania-performance.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 38352 },
    portrait: { src: '/participants/lithuania-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37729 }
  },
  moldova: {
    performance: { src: '/participants/moldova-performance.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 38297 },
    portrait: { src: '/participants/moldova-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37659 }
  },
  poland: {
    performance: { src: '/participants/poland-performance.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 38360 },
    portrait: { src: '/participants/poland-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37736 }
  },
  serbia: {
    performance: { src: '/participants/serbia-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38401 },
    portrait: { src: '/participants/serbia-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37737 }
  },
  sweden: {
    performance: { src: '/participants/sweden-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38301 },
    portrait: { src: '/participants/sweden-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37662 }
  },
  albania: {
    performance: { src: '/participants/albania-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38539 },
    portrait: { src: '/participants/albania-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37964 }
  },
  australia: {
    performance: { src: '/participants/australia-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38529 },
    portrait: { src: '/participants/australia-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37955 }
  },
  bulgaria: {
    performance: { src: '/participants/bulgaria-performance.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 38479 },
    portrait: { src: '/participants/bulgaria-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37741 }
  },
  cyprus: {
    performance: { src: '/participants/cyprus-performance.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 38518 },
    portrait: { src: '/participants/cyprus-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37761 }
  },
  czechia: {
    performance: { src: '/participants/czechia-performance.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 38504 },
    portrait: { src: '/participants/czechia-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37752 }
  },
  denmark: {
    performance: { src: '/participants/denmark-performance.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 38524 },
    portrait: { src: '/participants/denmark-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37769 }
  },
  malta: {
    performance: { src: '/participants/malta-performance.jpg', credit: '© EBU / Sarah Louise Bennett', sourceUrl, assetId: 38543 },
    portrait: { src: '/participants/malta-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37970 }
  },
  norway: {
    performance: { src: '/participants/norway-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38565 },
    portrait: { src: '/participants/norway-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37976 }
  },
  romania: {
    performance: { src: '/participants/romania-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38489 },
    portrait: { src: '/participants/romania-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37747 }
  },
  ukraine: {
    performance: { src: '/participants/ukraine-performance.jpg', credit: '© EBU / Alma Bengtson', sourceUrl, assetId: 38534 },
    portrait: { src: '/participants/ukraine-portrait.jpg', credit: '© EBU / Corinne Cumming', sourceUrl, assetId: 37962 }
  }
};
