export default function parseEmotesToURLs(
  emotes: object,
  message: string,
  bttvMap?: any,
): object[] {
  // Things about to get messy...position used instead of index to avoid more confusion...
  const emotesArr: [emoteId: string, position: number, imageType: string, url: string][] = [];

  if (emotes) {
  // For each emote object break it into its own entry based on the number of occurrences it has
  // e.g. 304734759":["0-8","20-28"] becomes ['304734759','0-8', ... ],['304734759','20-28', ... ]
    Object.entries(emotes).forEach(([emoteId, positions]) => {
      positions.forEach((position: string) => {
        const indexEnd = Number(position.split('-')[1]); // Only need the end of index for order

        let imageType = 'static';
        let url = `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/3.0`;

        if (emoteId.includes('emotesv2_')) {
          imageType = 'animated';
          url = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`;
        }

        emotesArr.push([emoteId, indexEnd, imageType, url]);
      });
    });
  }

  // Do the same with bttv emotes if bttvMap is set
  if (bttvMap) {
    // Get index of every word so so we can order emotes if match is found
    const wordIndex: number[] = [];
    const regex = new RegExp(/(\w+)/g);
    while ((regex.exec(message)) !== null) {
      // Gives us the
      wordIndex.push(regex.lastIndex);
    }

    // Check each word against in message against bttv map
    const words = message.split(' ');
    words.forEach((word, index) => {
      if (bttvMap[word]) {
        const { id } = bttvMap[word];
        let { imageType } = bttvMap[word];
        const url = `https://cdn.betterttv.net/emote/${id}/3x`;
        imageType = imageType === 'gif' ? 'animated' : 'static';
        emotesArr.push([
          id,
          wordIndex[index],
          imageType,
          url,
        ]);
      }
    });
  }

  emotesArr.sort((a, b) => a[1] - b[1]); // Sort by position

  // Returning ordered mapped array of objects containing position, image type, and URL
  return emotesArr.map(([emoteId, position, imageType, url]) => ({
    emoteId,
    position,
    imageType,
    url,
  }));
}
