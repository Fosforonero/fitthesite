import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background:
            "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#03121f",
          fontSize: 92,
          fontWeight: 900,
          letterSpacing: -3,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        FM
      </div>
    ),
    { ...size },
  );
}
