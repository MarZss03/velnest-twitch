/** Bound live-room buffers even inside a 1080p OBS source or high-DPI display. */
export function roomPixelRatio(width:number,height:number,pixelRatio:number) {
  const area=Number.isFinite(width*height)&&width>0&&height>0?width*height:1;
  const density=Number.isFinite(pixelRatio)&&pixelRatio>0?pixelRatio:1;
  return Math.min(density,1.25,Math.sqrt(1280*720/area));
}
