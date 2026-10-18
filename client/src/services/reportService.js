import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get travel report
export const getTravelReport = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await axios.get(`${API_URL}/reports/travel?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching travel report:', error);
    throw error;
  }
};

// Get expense report
export const getExpenseReport = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await axios.get(`${API_URL}/reports/expenses?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching expense report:', error);
    throw error;
  }
};

// Get reimbursement report
export const getReimbursementReport = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await axios.get(`${API_URL}/reports/reimbursements?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching reimbursement report:', error);
    throw error;
  }
};

// Get department report
export const getDepartmentReport = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await axios.get(`${API_URL}/reports/departments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching department report:', error);
    throw error;
  }
};

// Get employee spending report
export const getEmployeeReport = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await axios.get(`${API_URL}/reports/employees?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching employee report:', error);
    throw error;
  }
};

// Export CSV
export const exportCSV = async (reportType, filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await axios.get(`${API_URL}/reports/${reportType}/csv?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw error;
  }
};

// Export PDF
export const exportPDF = async (reportType, filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await axios.get(`${API_URL}/reports/${reportType}/pdf?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};
