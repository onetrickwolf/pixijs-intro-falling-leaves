export default function bttvMapper(json: any[]): object {
  const map: { [code: string]: { imageType: string; id: string; }; } = {};
  json.forEach((emote) => {
    map[emote.code] = {
      id: emote.id,
      imageType: emote.imageType,
    };
  });
  return map;
}
