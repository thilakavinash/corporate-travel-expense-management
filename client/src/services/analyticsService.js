import api from './api';

const analyticsService = {
  // Get overview analytics
  getOverview: () => {
    return api.get('/analytics/overview').then(res => res.data);
  },

  // Get monthly spending analytics
  getMonthlySpending: () => {
    return api.get('/analytics/monthly-spending').then(res => res.data);
  },

  // Get department spending analytics
  getDepartmentSpending: () => {
    return api.get('/analytics/department-spending').then(res => res.data);
  },

  // Get expense category analytics
  getExpenseCategories: () => {
    return api.get('/analytics/expense-categories').then(res => res.data);
  },

  // Get travel type analytics
  getTravelTypes: () => {
    return api.get('/analytics/travel-types').then(res => res.data);
  },
};

export default analyticsService;
