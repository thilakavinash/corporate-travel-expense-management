import api from './api';

const reimbursementService = {
  // Create reimbursement claim
  createReimbursement: (data) => {
    return api.post('/reimbursements', data).then(res => res.data);
  },

  // Get reimbursements (role-based)
  getReimbursements: (params = {}) => {
    return api.get('/reimbursements', { params }).then(res => res.data);
  },

  // Get single reimbursement
  getReimbursementById: (id) => {
    return api.get(`/reimbursements/${id}`).then(res => res.data);
  },

  // Get employee's own claims
  getMyReimbursements: () => {
    return api.get('/reimbursements/my-claims').then(res => res.data);
  },

  // Approve reimbursement
  approveReimbursement: (id, approvalData) => {
    return api.put(`/reimbursements/${id}/approve`, approvalData).then(res => res.data);
  },

  // Reject reimbursement
  rejectReimbursement: (id, rejectionData) => {
    return api.put(`/reimbursements/${id}/reject`, rejectionData).then(res => res.data);
  },

  // Mark reimbursement as paid
  markReimbursementPaid: (id, paymentData) => {
    return api.put(`/reimbursements/${id}/mark-paid`, paymentData).then(res => res.data);
  },
};

export default reimbursementService;
