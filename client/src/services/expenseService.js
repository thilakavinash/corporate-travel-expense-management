import api from './api';

const expenseService = {
  // Create expense with receipt upload
  createExpense: (formData) => {
    return api.post('/expenses', formData).then(res => res.data);
  },

  // Get expenses
  getExpenses: (params = {}) => {
    return api.get('/expenses', { params }).then(res => res.data);
  },

  // Get single expense
  getExpenseById: (id) => {
    return api.get(`/expenses/${id}`).then(res => res.data);
  },

  // Get expenses for a travel request
  getExpensesByTravelRequest: (travelId) => {
    return api.get(`/expenses/travel/${travelId}`).then(res => res.data);
  },

  // Approve expense
  approveExpense: (id, approvalData) => {
    return api.put(`/expenses/${id}/approve`, approvalData).then(res => res.data);
  },

  // Reject expense
  rejectExpense: (id, rejectionData) => {
    return api.put(`/expenses/${id}/reject`, rejectionData).then(res => res.data);
  },
};

export default expenseService;
