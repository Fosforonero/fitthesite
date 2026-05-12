import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 14,
          background:
            "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#03121f",
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: -1,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        FM
      </div>
    ),
    { ...size },
  );
}
