import api from './api';

const travelService = {
  // Create travel request
  createTravelRequest: (travelData) => {
    return api.post('/travel-requests', travelData).then(res => res.data);
  },

  // Get travel requests
  getTravelRequests: (params = {}) => {
    return api.get('/travel-requests', { params }).then(res => res.data);
  },

  // Get single travel request
  getTravelRequestById: (id) => {
    return api.get(`/travel-requests/${id}`).then(res => res.data);
  },

  // Manager approve/reject request
  managerApproveRequest: (id, approvalData) => {
    return api.put(`/travel-requests/${id}/manager-approve`, approvalData).then(res => res.data);
  },

  // Cancel travel request
  cancelTravelRequest: (id) => {
    return api.put(`/travel-requests/${id}/cancel`).then(res => res.data);
  },
};

export default travelService;
