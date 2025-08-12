const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

const auditLogger = {
  /**
   * Log workflow actions
   */
  logWorkflowAction: (action) => {
    return async (req, res, next) => {
      const startTime = Date.now();
      const user = req.user;
      const { id } = req.params || {};

      // Override res.json để capture response
      const originalJson = res.json;
      let responseData = null;
      let responseStatus = res.statusCode;

      res.json = function (data) {
        responseData = data;
        responseStatus = this.statusCode || 200;
        return originalJson.call(this, data);
      };

      // Continue to next middleware
      res.on("finish", async () => {
        try {
          const duration = Date.now() - startTime;

          // Prepare audit log data
          const auditData = {
            action,
            user_id: user?.id,
            user_name: user?.ho_ten,
            user_role: user?.role,
            user_department: user?.phong_ban_id,
            resource_type: req.path.includes("yeu-cau-nhap")
              ? "yeu_cau_nhap_kho"
              : req.path.includes("yeu-cau-xuat")
              ? "yeu_cau_xuat_kho"
              : req.path.includes("workflow")
              ? "workflow"
              : "system",
            resource_id: id,
            method: req.method,
            endpoint: req.path,
            request_body:
              req.method !== "GET" ? JSON.stringify(req.body) : null,
            response_status: responseStatus,
            response_message: responseData?.message || null,
            success: responseStatus >= 200 && responseStatus < 300,
            duration_ms: duration,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get("User-Agent"),
            timestamp: new Date(),
          };

          // Save to audit log table (create if not exists)
          await pool
            .query(
              `INSERT INTO audit_logs (
              action, user_id, user_name, user_role, user_department,
              resource_type, resource_id, method, endpoint, 
              request_body, response_status, response_message, 
              success, duration_ms, ip_address, user_agent, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
              [
                auditData.action,
                auditData.user_id,
                auditData.user_name,
                auditData.user_role,
                auditData.user_department,
                auditData.resource_type,
                auditData.resource_id,
                auditData.method,
                auditData.endpoint,
                auditData.request_body,
                auditData.response_status,
                auditData.response_message,
                auditData.success,
                auditData.duration_ms,
                auditData.ip_address,
                auditData.user_agent,
                auditData.timestamp,
              ]
            )
            .catch((err) => {
              // Create audit_logs table if not exists
              if (err.code === "42P01") {
                // Table does not exist
                pool
                  .query(
                    `
                CREATE TABLE IF NOT EXISTS audit_logs (
                  id SERIAL PRIMARY KEY,
                  action VARCHAR(100) NOT NULL,
                  user_id INTEGER,
                  user_name VARCHAR(100),
                  user_role VARCHAR(20),
                  user_department INTEGER,
                  resource_type VARCHAR(50),
                  resource_id VARCHAR(50),
                  method VARCHAR(10),
                  endpoint VARCHAR(500),
                  request_body TEXT,
                  response_status INTEGER,
                  response_message TEXT,
                  success BOOLEAN,
                  duration_ms INTEGER,
                  ip_address INET,
                  user_agent TEXT,
                  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
              `
                  )
                  .then(() => {
                    // Retry insert after creating table
                    return pool.query(
                      `INSERT INTO audit_logs (
                    action, user_id, user_name, user_role, user_department,
                    resource_type, resource_id, method, endpoint,
                    request_body, response_status, response_message,
                    success, duration_ms, ip_address, user_agent, timestamp
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                      [
                        auditData.action,
                        auditData.user_id,
                        auditData.user_name,
                        auditData.user_role,
                        auditData.user_department,
                        auditData.resource_type,
                        auditData.resource_id,
                        auditData.method,
                        auditData.endpoint,
                        auditData.request_body,
                        auditData.response_status,
                        auditData.response_message,
                        auditData.success,
                        auditData.duration_ms,
                        auditData.ip_address,
                        auditData.user_agent,
                        auditData.timestamp,
                      ]
                    );
                  });
              } else {
                console.error("Audit log error:", err);
              }
            });

          // Console log for development
          console.log(
            `🔍 [AUDIT] ${action} by ${
              user?.ho_ten || "Unknown"
            } (${duration}ms) - ${responseStatus}`
          );
        } catch (error) {
          console.error("Audit logging error:", error);
          // Don't throw - audit errors shouldn't break the main flow
        }
      });

      next();
    };
  },

  /**
   * Log security events
   */
  logSecurityEvent: (event) => {
    return async (req, res, next) => {
      try {
        const user = req.user;

        await pool
          .query(
            `INSERT INTO security_logs (
            event_type, user_id, ip_address, user_agent, 
            endpoint, method, timestamp, details
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)`,
            [
              event,
              user?.id,
              req.ip || req.connection.remoteAddress,
              req.get("User-Agent"),
              req.path,
              req.method,
              JSON.stringify({
                headers: req.headers,
                body: req.method !== "GET" ? req.body : null,
              }),
            ]
          )
          .catch((err) => {
            if (err.code === "42P01") {
              // Create security_logs table if not exists
              pool.query(`
              CREATE TABLE IF NOT EXISTS security_logs (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                user_id INTEGER,
                ip_address INET,
                user_agent TEXT,
                endpoint VARCHAR(500),
                method VARCHAR(10),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                details JSONB
              )
            `);
            }
          });

        console.log(
          `🔒 [SECURITY] ${event} from ${req.ip} - ${
            user?.ho_ten || "Anonymous"
          }`
        );
      } catch (error) {
        console.error("Security logging error:", error);
      }

      next();
    };
  },

  /**
   * Log performance metrics
   */
  logPerformance: (threshold = 1000) => {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - startTime;

        if (duration > threshold) {
          console.warn(
            `⚠️  [PERFORMANCE] Slow request: ${req.method} ${req.path} took ${duration}ms`
          );

          // Could also log to database or monitoring service
          // monitoring.logSlowRequest(req.path, duration, req.user?.id);
        }
      });

      next();
    };
  },
};

module.exports = { auditLogger };
