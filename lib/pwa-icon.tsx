import { ImageResponse } from 'next/og';

// The installed icon uses the same vector artwork as public/icon.svg.
// Keep this source in sync if the brand logo is updated.
const brandedLogo = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"180\" height=\"180\" fill=\"#171715\" viewBox=\"0 0 256 256\" style=\"background:#c8ff35;padding:32px;border-radius:36px;box-sizing:border-box\"><path d=\"M200,224H150.54A266.56,266.56,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25a88,88,0,0,0-176,0c0,31.4,14.51,64.68,42,96.25A266.56,266.56,0,0,0,105.46,224H56a8,8,0,0,0,0,16H200a8,8,0,0,0,0-16ZM56,104a72,72,0,0,1,144,0c0,57.23-55.47,105-72,118C111.47,209,56,161.23,56,104Zm112,0a40,40,0,1,0-40,40A40,40,0,0,0,168,104Zm-64,0a24,24,0,1,1,24,24A24,24,0,0,1,104,104Z\"></path></svg>";
const svgDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(brandedLogo).toString('base64');

export function brandedPwaIcon(size: number, maskable = false) {
  // Android adaptive masks can crop outside the centre safe area.
  const artworkSize = maskable ? Math.round(size * 0.70) : size;
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#c8ff35',
        }}
      >
        <img src={svgDataUrl} width={artworkSize} height={artworkSize} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
