const AuditLog = require('../models/AuditLog');

// Helper to safely extract IP address
const getIpAddress = (req) => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
         null;
};

// Helper to safely extract user agent
const getUserAgent = (req) => {
  return req.get('user-agent') || null;
};

// Helper to sanitize metadata - remove sensitive fields
const sanitizeMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const sensitiveKeys = [
    'password',
    'passwordHash',
    'token',
    'jwt',
    'secret',
    'apiKey',
    'apiKeySecret',
    'receipt',
    'file',
    'creditCard',
    'bankAccount',
    'ssn',
    'socialSecurity',
  ];

  const sanitized = { ...metadata };

  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      delete sanitized[key];
    }
  });

  return sanitized;
};

// Create audit log
const createAuditLog = async ({ actorId, action, entityType, entityId, description, metadata, req }) => {
  try {
    // Actor ID must come from authenticated user, not request body
    if (!actorId) {
      console.error('Audit log missing actorId');
      return;
    }

    const sanitizedMetadata = sanitizeMetadata(metadata);

    const auditLog = await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      description,
      metadata: sanitizedMetadata,
      ipAddress: req ? getIpAddress(req) : null,
      userAgent: req ? getUserAgent(req) : null,
    });

    return auditLog;
  } catch (error) {
    // Audit logging failure should NOT break the main business operation
    console.error('Failed to create audit log:', error);
    // Do not throw - allow the business operation to succeed
  }
};

module.exports = {
  createAuditLog,
};
