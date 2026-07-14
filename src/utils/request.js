// Helpers to extract client metadata from a request for logging.

export function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

export function parseUserAgent(ua = "") {
  const s = String(ua);

  let browser = "Unknown";
  if (/Edg\//i.test(s)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(s)) browser = "Opera";
  else if (/Chrome\//i.test(s) && !/Chromium/i.test(s)) browser = "Chrome";
  else if (/Firefox\//i.test(s)) browser = "Firefox";
  else if (/Safari\//i.test(s) && !/Chrome/i.test(s)) browser = "Safari";
  else if (/MSIE|Trident/i.test(s)) browser = "Internet Explorer";

  let device = "Desktop";
  if (/iPad|Tablet/i.test(s)) device = "Tablet";
  else if (/Mobi|Android|iPhone|iPod/i.test(s)) device = "Mobile";

  return { browser, device };
}
