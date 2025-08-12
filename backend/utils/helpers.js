// utils/helpers.js - Phiên bản parseBody đã được tối ưu hoàn toàn

const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = "";
    let hasStartedReceiving = false;

    console.log("📦 Starting to parse request body...");
    console.log("📋 Request headers:", req.headers);
    console.log("📊 Content-Length:", req.headers["content-length"]);
    console.log("📝 Content-Type:", req.headers["content-type"]);

    // Kiểm tra Content-Length để xác định có body hay không
    const contentLength = parseInt(req.headers["content-length"]) || 0;
    if (contentLength === 0) {
      console.log("⚠️ No content-length or empty body, returning empty object");
      resolve({});
      return;
    }

    // Timeout chỉ áp dụng nếu chưa bắt đầu nhận data
    const initialTimeout = setTimeout(() => {
      if (!hasStartedReceiving) {
        console.error("❌ Initial timeout: No data received within 15 seconds");
        req.destroy();
        reject(new Error("Request timeout - no data received"));
      }
    }, 15000); // 15 giây timeout ban đầu

    req.on("data", (chunk) => {
      hasStartedReceiving = true;
      // Clear timeout ngay khi bắt đầu nhận data
      clearTimeout(initialTimeout);

      body += chunk.toString();
      console.log(
        `📦 Received chunk: ${chunk.length} bytes, total: ${body.length} bytes`
      );

      // Giới hạn kích thước body (5MB)
      if (body.length > 5 * 1024 * 1024) {
        console.error("❌ Request body too large:", body.length);
        req.destroy();
        reject(new Error("Request body too large"));
        return;
      }
    });

    req.on("end", () => {
      clearTimeout(initialTimeout);
      console.log("✅ Request body received completely");
      console.log("📊 Total body length:", body.length);
      console.log("📦 Raw body preview:", body.substring(0, 200));

      try {
        if (!body || body.trim() === "") {
          console.log("⚠️ Empty body received, returning empty object");
          resolve({});
          return;
        }

        const parsedBody = JSON.parse(body);
        console.log("✅ JSON parsed successfully");
        console.log("🔑 Parsed keys:", Object.keys(parsedBody));
        resolve(parsedBody);
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError.message);
        console.error("📦 Body that failed to parse:", body);
        reject(new Error(`Invalid JSON: ${parseError.message}`));
      }
    });

    req.on("error", (error) => {
      clearTimeout(initialTimeout);
      console.error("❌ Request error:", error.message);
      reject(new Error(`Request error: ${error.message}`));
    });

    req.on("close", () => {
      clearTimeout(initialTimeout);
      console.log("🔒 Request connection closed");
    });

    req.on("aborted", () => {
      clearTimeout(initialTimeout);
      console.log("🚫 Request aborted");
      reject(new Error("Request aborted"));
    });
  });
};

const parseUrl = (urlString) => {
  try {
    const url = new URL(urlString, "http://localhost");
    const pathname = url.pathname;
    const query = {};

    // Parse query parameters
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return { pathname, query };
  } catch (error) {
    console.error("URL parse error:", error);
    return { pathname: urlString, query: {} };
  }
};

const extractParams = (pattern, pathname) => {
  try {
    const patternParts = pattern.split("/");
    const pathnameParts = pathname.split("/");

    if (patternParts.length !== pathnameParts.length) {
      return null;
    }

    const params = {};
    let isMatch = true;

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathnamePart = pathnameParts[i];

      if (patternPart.startsWith(":")) {
        // This is a parameter
        const paramName = patternPart.slice(1);
        params[paramName] = pathnamePart;
      } else if (patternPart !== pathnamePart) {
        // Static part doesn't match
        isMatch = false;
        break;
      }
    }

    return isMatch ? params : null;
  } catch (error) {
    console.error("Extract params error:", error);
    return null;
  }
};

module.exports = {
  parseBody,
  parseUrl,
  extractParams,
};
