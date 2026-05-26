import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #059669, #10b981)",
          color: "white",
          fontSize: 130,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        €
      </div>
    ),
    size,
  );
}
