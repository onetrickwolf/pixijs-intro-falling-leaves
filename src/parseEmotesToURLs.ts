export default function parseEmotesToURLs(emotes: object, message: string): object[] {
  // Things about to get messy...
  const emotesArr:[string, number][] = [];
  // For each emote object break it into its own entry based on the number of positions it has
  // e.g. 304734759":["0-8","20-28"] becomes ['304734759','0-8' ],['304734759','20-28' ]
  Object.entries(emotes).forEach(([emoteId, positions]) => {
    positions.forEach((position:string) => {
      const firstPosition = Number(position.split('-')[0]); // Only need the first position for order
      emotesArr.push([emoteId, firstPosition]);
    });
  });

  emotesArr.sort((a, b) => a[1] - b[1]); // Sort by position
  return emotesArr.map(([emoteId, position]) => {
    const emoteObj = {
      position,
      imageType: 'static',
      url: `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/3.0`,
    };
    if (emoteId.includes('emotesv2_')) {
      emoteObj.imageType = 'animated';
      emoteObj.url = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`;
    }
    return emoteObj;
  });
}
