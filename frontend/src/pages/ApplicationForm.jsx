import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ApplicationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Applicant Information
    applicantName: '',
    businessType: '',
    industry: '',
    yearsInBusiness: '',
    
    // Loan Request
    loanAmount: '',
    tenor: '',
    purpose: '',
    repaymentType: 'monthly',
    
    // Financial Snapshot
    monthlyRevenue: '',
    monthlyExpenses: '',
    existingDebtPayment: '',
    
    // Collateral
    collateralType: '',
    collateralValue: '',
    
    // Owner Information
    ownerName: '',
    ownerIdNumber: '',
    creditScore: ''
  });

  const businessTypes = ['Sole Proprietorship', 'Partnership', 'Corporation', 'Cooperative'];
  const industries = [
    'Retail',
    'Manufacturing',
    'Services',
    'Food & Beverage',
    'Technology',
    'Agriculture',
    'Construction',
    'Transportation',
    'Healthcare',
    'Education',
    'Other'
  ];
  const collateralTypes = [
    'Real Estate',
    'Vehicle',
    'Equipment',
    'Inventory',
    'Accounts Receivable',
    'Securities',
    'Other'
  ];
  const repaymentTypes = ['monthly', 'quarterly', 'bullet'];

  useEffect(() => {
    if (id) {
      loadApplication();
    }
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/applications/${id}`);
      const app = response.data;
      
      // Map API data to form data
      setFormData({
        applicantName: app.applicant?.legalName || '',
        businessType: app.applicant?.businessType || '',
        industry: app.applicant?.industry || '',
        yearsInBusiness: app.applicant?.yearsInBusiness || '',
        loanAmount: app.loan?.amount || '',
        tenor: app.loan?.tenor || '',
        purpose: app.loan?.purpose || '',
        repaymentType: app.loan?.repaymentType || 'monthly',
        monthlyRevenue: app.financial?.monthlyRevenue || '',
        monthlyExpenses: app.financial?.monthlyExpenses || '',
        existingDebtPayment: app.financial?.existingDebtPayment || '',
        collateralType: app.collateral?.type || '',
        collateralValue: app.collateral?.estimatedValue || '',
        ownerName: app.owner?.name || '',
        ownerIdNumber: app.owner?.idNumber || '',
        creditScore: app.owner?.creditScore || ''
      });
    } catch (err) {
      showError('Failed to load application');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.applicantName || !formData.loanAmount || !formData.tenor) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Transform form data to API format
      const applicationData = {
        applicant: {
          legalName: formData.applicantName,
          businessType: formData.businessType,
          industry: formData.industry,
          yearsInBusiness: parseInt(formData.yearsInBusiness) || 0
        },
        loan: {
          amount: parseFloat(formData.loanAmount) || 0,
          tenor: parseInt(formData.tenor) || 0,
          purpose: formData.purpose,
          repaymentType: formData.repaymentType
        },
        financial: {
          monthlyRevenue: parseFloat(formData.monthlyRevenue) || 0,
          monthlyExpenses: parseFloat(formData.monthlyExpenses) || 0,
          existingDebtPayment: parseFloat(formData.existingDebtPayment) || 0
        },
        collateral: {
          type: formData.collateralType,
          estimatedValue: parseFloat(formData.collateralValue) || 0
        },
        owner: {
          name: formData.ownerName,
          idNumber: formData.ownerIdNumber,
          creditScore: parseInt(formData.creditScore) || 0
        }
      };

      if (id) {
        // Update existing application
        await api.put(`/applications/${id}`, applicationData);
        success('Application updated successfully');
      } else {
        // Create new application
        const response = await api.post('/applications', applicationData);
        success('Application created successfully');
        navigate(`/applications/${response.data.id}`);
        return;
      }
      
      navigate(`/applications/${id}`);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save application');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        <h1 style={{ margin: 0 }}>
          {id ? 'Edit Application' : 'Create New Application'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Applicant Information */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '20px', color: '#2563eb' }}>Applicant Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Legal Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Business Type <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select...</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Industry <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select...</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Years in Business <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="yearsInBusiness"
                value={formData.yearsInBusiness}
                onChange={handleChange}
                required
                min="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Loan Request */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '20px', color: '#2563eb' }}>Loan Request</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Loan Amount (₱) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="loanAmount"
                value={formData.loanAmount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Tenor (months) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="tenor"
                value={formData.tenor}
                onChange={handleChange}
                required
                min="1"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Repayment Type <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="repaymentType"
                value={formData.repaymentType}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              >
                {repaymentTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Purpose <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '20px', color: '#2563eb' }}>Financial Snapshot</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Monthly Revenue (₱) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="monthlyRevenue"
                value={formData.monthlyRevenue}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Monthly Expenses (₱) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="monthlyExpenses"
                value={formData.monthlyExpenses}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Existing Debt Payment (₱) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="existingDebtPayment"
                value={formData.existingDebtPayment}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Collateral */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '20px', color: '#2563eb' }}>Collateral</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Collateral Type <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="collateralType"
                value={formData.collateralType}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select...</option>
                {collateralTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Estimated Value (₱) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="collateralValue"
                value={formData.collateralValue}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '20px', color: '#2563eb' }}>Owner Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Owner Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                ID Number <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="ownerIdNumber"
                value={formData.ownerIdNumber}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Credit Score <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="creditScore"
                value={formData.creditScore}
                onChange={handleChange}
                required
                min="300"
                max="850"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#ccc' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Saving...' : (id ? 'Update Application' : 'Create Application')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;

// Made with Bob
