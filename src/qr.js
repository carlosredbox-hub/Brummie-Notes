import QRCode from "qrcode";
export function wifiPayload(wifi) {
  if (!wifi?.ssid?.trim()) return null;
  const escape = (s) => String(s || "").replace(/[\\;,:\"]/g, "\\$&");
  const type = ["WPA", "WEP", "nopass"].includes(wifi.encryption)
    ? wifi.encryption
    : "WPA";
  return `WIFI:T:${type};S:${escape(wifi.ssid)};${type === "nopass" ? "" : `P:${escape(wifi.password)};`}H:false;;`;
}
export async function wifiQr(wifi) {
  const payload = wifiPayload(wifi);
  return payload
    ? QRCode.toDataURL(payload, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 300,
        color: { dark: "#18382e", light: "#ffffff" },
      })
    : null;
}
