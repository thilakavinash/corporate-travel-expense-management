const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification for a user
 * @param {Object} options - Notification options
 * @param {String} options.recipientId - User ID to notify
 * @param {String} options.type - Notification type
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} options.relatedEntityType - Related entity type
 * @param {String} options.relatedEntityId - Related entity ID
 */
const createNotification = async (options) => {
  try {
    const { recipientId, type, title, message, relatedEntityType, relatedEntityId } = options;

    const notification = await Notification.create({
      recipientId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't throw - notification failure should not break the main operation
    return null;
  }
};

/**
 * Notify a specific user
 * @param {String} userId - User ID to notify
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} relatedEntityType - Related entity type
 * @param {String} relatedEntityId - Related entity ID
 */
const notifyUser = async (userId, type, title, message, relatedEntityType, relatedEntityId) => {
  return createNotification({
    recipientId: userId,
    type,
    title,
    message,
    relatedEntityType,
    relatedEntityId,
  });
};

/**
 * Notify all users with a specific role
 * @param {String} role - Role to notify (finance, manager, etc.)
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} relatedEntityType - Related entity type
 * @param {String} relatedEntityId - Related entity ID
 */
const notifyRole = async (role, type, title, message, relatedEntityType, relatedEntityId) => {
  try {
    const users = await User.find({ role }).select('_id');
    
    const notifications = users.map(user =>
      createNotification({
        recipientId: user._id,
        type,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Failed to notify role:', error);
  }
};

/**
 * Notify the manager of a specific employee
 * @param {String} employeeId - Employee ID
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} relatedEntityType - Related entity type
 * @param {String} relatedEntityId - Related entity ID
 */
const notifyManager = async (employeeId, type, title, message, relatedEntityType, relatedEntityId) => {
  try {
    const employee = await User.findById(employeeId).select('managerId');
    
    if (employee && employee.managerId) {
      return createNotification({
        recipientId: employee.managerId,
        type,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
      });
    }
  } catch (error) {
    console.error('Failed to notify manager:', error);
  }
};

/**
 * Notify an employee
 * @param {String} employeeId - Employee ID
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} relatedEntityType - Related entity type
 * @param {String} relatedEntityId - Related entity ID
 */
const notifyEmployee = async (employeeId, type, title, message, relatedEntityType, relatedEntityId) => {
  return createNotification({
    recipientId: employeeId,
    type,
    title,
    message,
    relatedEntityType,
    relatedEntityId,
  });
};

module.exports = {
  createNotification,
  notifyUser,
  notifyRole,
  notifyManager,
  notifyEmployee,
};
