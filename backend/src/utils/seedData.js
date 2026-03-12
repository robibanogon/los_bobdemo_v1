const { v4: uuidv4 } = require('uuid');
const fileStorage = require('./fileStorage');

const industries = [
  'Retail Trade',
  'Food & Beverage',
  'Manufacturing',
  'Construction',
  'Transportation',
  'Wholesale Trade',
  'Services',
  'Agriculture',
  'Technology',
  'Healthcare'
];

const businessTypes = ['Sole Proprietorship', 'Partnership', 'Corporation'];
const collateralTypes = ['Real Estate', 'Equipment', 'Inventory', 'Receivables', 'Other'];
const repaymentTypes = ['Monthly', 'Quarterly', 'Bullet'];
const loanPurposes = [
  'Working Capital',
  'Equipment Purchase',
  'Business Expansion',
  'Inventory Financing',
  'Debt Consolidation',
  'Property Acquisition'
];

const sampleNames = [
  'ABC Trading Corp',
  'Golden Harvest Foods',
  'Metro Construction Inc',
  'Pacific Logistics',
  'Sunrise Manufacturing',
  'Elite Services Group',
  'Green Valley Farms',
  'Tech Solutions PH',
  'Prime Retail Store',
  'Quality Auto Parts',
  'Fresh Market Supplies',
  'Urban Development Co',
  'Express Delivery Services',
  'Modern Bakery Shop',
  'Industrial Equipment Corp',
  'Coastal Seafood Trading',
  'Mountain View Resort',
  'City Hardware Store',
  'Professional Cleaning Services',
  'Digital Marketing Agency'
];

const ownerNames = [
  'Juan Dela Cruz',
  'Maria Santos',
  'Pedro Reyes',
  'Ana Garcia',
  'Jose Mendoza',
  'Carmen Lopez',
  'Roberto Fernandez',
  'Teresa Ramos',
  'Miguel Torres',
  'Sofia Castillo'
];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateApplication(index, userId) {
  const year = new Date().getFullYear();
  const yearsInBusiness = randomNumber(1, 15);
  const monthlyRevenue = randomNumber(50000, 1000000);
  const monthlyExpenses = Math.floor(monthlyRevenue * (0.6 + Math.random() * 0.3)); // 60-90% of revenue
  const loanAmount = randomNumber(50000, 500000);
  const creditScore = randomNumber(550, 850);
  const collateralValue = Math.floor(loanAmount * (0.8 + Math.random() * 0.8)); // 80-160% of loan
  
  // Determine status based on index for variety
  let status;
  if (index < 5) {
    status = 'Draft';
  } else if (index < 10) {
    status = 'Submitted';
  } else if (index < 15) {
    status = 'In Review';
  } else if (index < 20) {
    status = 'Approved';
  } else if (index < 23) {
    status = 'Rejected';
  } else {
    status = 'Completed';
  }

  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - randomNumber(1, 60));
  
  const submittedDate = status !== 'Draft' ? new Date(createdDate.getTime() + randomNumber(1, 5) * 24 * 60 * 60 * 1000) : null;
  const completedDate = status === 'Completed' ? new Date(submittedDate.getTime() + randomNumber(7, 30) * 24 * 60 * 60 * 1000) : null;

  return {
    id: uuidv4(),
    application_number: `APP-${year}-${String(index + 1).padStart(4, '0')}`,
    status,
    owner_user_id: userId,
    
    applicant: {
      legal_name: sampleNames[index % sampleNames.length],
      business_type: randomElement(businessTypes),
      industry: randomElement(industries),
      years_in_business: yearsInBusiness
    },
    
    loan_request: {
      amount: loanAmount,
      tenor_months: randomElement([12, 18, 24, 36, 48, 60]),
      purpose: randomElement(loanPurposes),
      repayment_type: randomElement(repaymentTypes)
    },
    
    financial_snapshot: {
      monthly_revenue: monthlyRevenue,
      monthly_expenses: monthlyExpenses,
      existing_debt_payment: randomNumber(5000, 50000)
    },
    
    collateral: {
      type: randomElement(collateralTypes),
      estimated_value: collateralValue
    },
    
    owner_info: {
      name: randomElement(ownerNames),
      id_number: `ID-${randomNumber(100000, 999999)}`,
      credit_score: creditScore
    },
    
    created_at: createdDate.toISOString(),
    updated_at: new Date().toISOString(),
    submitted_at: submittedDate ? submittedDate.toISOString() : null,
    completed_at: completedDate ? completedDate.toISOString() : null
  };
}

function generateDocumentMetadata(applicationId, docType, index) {
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - randomNumber(1, 30));

  return {
    id: uuidv4(),
    application_id: applicationId,
    doc_type: docType,
    filename: `${docType.toLowerCase().replace(/\//g, '_')}_${index}.pdf`,
    original_filename: `${docType}_Document.pdf`,
    storage_path: `/data/uploads/${docType.toLowerCase().replace(/\//g, '_')}_${index}.pdf`,
    file_size: randomNumber(100000, 5000000),
    mime_type: 'application/pdf',
    uploaded_by: applicationId, // Simplified
    uploaded_at: createdDate.toISOString(),
    extracted_fields: generateExtractedFields(docType)
  };
}

function generateExtractedFields(docType) {
  switch (docType) {
    case 'Bank Statement':
      return {
        total_credits: randomNumber(100000, 500000),
        total_debits: randomNumber(80000, 400000),
        ending_balance: randomNumber(50000, 200000),
        statement_period: '3 months',
        average_monthly_balance: randomNumber(40000, 180000)
      };
    
    case 'Financial Statement':
      const revenue = randomNumber(200000, 1000000);
      const expenses = Math.floor(revenue * 0.75);
      return {
        total_revenue: revenue,
        total_expenses: expenses,
        net_income: revenue - expenses,
        total_assets: randomNumber(500000, 2000000),
        total_liabilities: randomNumber(200000, 1000000),
        period: 'Annual'
      };
    
    case 'ID/KYC':
      return {
        id_type: 'Government ID',
        id_number: `XXXX-XXXX-${randomNumber(1000, 9999)}`,
        name_on_id: 'Verified',
        expiry_date: '2028-12-31'
      };
    
    case 'Collateral Proof':
      return {
        property_type: randomElement(['Real Estate', 'Equipment', 'Vehicle']),
        assessed_value: randomNumber(1000000, 5000000),
        location: randomElement(['Metro Manila', 'Cebu', 'Davao', 'Quezon City']),
        title_number: `TCT-${randomNumber(10000, 99999)}`
      };
    
    default:
      return {
        extracted: true,
        notes: 'Document received and verified'
      };
  }
}

async function seedData() {
  try {
    console.log('Starting data seeding...');
    
    // Get users
    const users = await fileStorage.read('users');
    const rmUser = users.find(u => u.role === 'RM');
    
    if (!rmUser) {
      console.error('No RM user found. Please run the server first to initialize users.');
      return;
    }

    // Generate 30 applications
    const applications = [];
    for (let i = 0; i < 30; i++) {
      applications.push(generateApplication(i, rmUser.id));
    }
    
    await fileStorage.write('applications', applications);
    console.log(`✓ Generated ${applications.length} applications`);

    // Generate documents for applications that are not in Draft status
    const documents = [];
    const docTypes = ['Bank Statement', 'Financial Statement', 'ID/KYC', 'Collateral Proof'];
    
    applications.forEach((app, index) => {
      if (app.status !== 'Draft') {
        // Add 3-4 documents per application
        const numDocs = randomNumber(3, 4);
        for (let i = 0; i < numDocs; i++) {
          documents.push(generateDocumentMetadata(app.id, docTypes[i], index));
        }
      }
    });
    
    await fileStorage.write('documents', documents);
    console.log(`✓ Generated ${documents.length} document metadata entries`);

    // Generate analyses for applications in review or later
    const analyses = [];
    applications.forEach(app => {
      if (['In Review', 'Approved', 'Rejected', 'Completed'].includes(app.status)) {
        const dscr = (app.financial_snapshot.monthly_revenue - app.financial_snapshot.monthly_expenses) / 
                     (app.financial_snapshot.existing_debt_payment + (app.loan_request.amount / app.loan_request.tenor_months));
        
        const collateralCoverage = (app.collateral.estimated_value / app.loan_request.amount) * 100;
        const riskScore = Math.min(100, Math.max(0, 
          (dscr / 1.2 * 30) + 
          (app.owner_info.credit_score / 850 * 25) + 
          (app.applicant.years_in_business / 10 * 20) + 
          (collateralCoverage / 120 * 25)
        ));

        analyses.push({
          id: uuidv4(),
          application_id: app.id,
          dscr: parseFloat(dscr.toFixed(2)),
          net_cashflow: app.financial_snapshot.monthly_revenue - app.financial_snapshot.monthly_expenses,
          collateral_coverage: parseFloat(collateralCoverage.toFixed(2)),
          risk_score: Math.round(riskScore),
          flags: [],
          assumptions: {
            interest_rate: 0,
            default_rate: 2,
            recovery_rate: 70
          },
          notes: 'Auto-generated analysis',
          created_by: rmUser.id,
          created_at: app.submitted_at || app.created_at,
          updated_at: app.updated_at
        });
      }
    });
    
    await fileStorage.write('analyses', analyses);
    console.log(`✓ Generated ${analyses.length} analyses`);

    // Generate decisions for approved/rejected applications
    const decisions = [];
    const analystUser = users.find(u => u.role === 'Credit Analyst');
    const approverUser = users.find(u => u.role === 'Approver');
    
    applications.forEach(app => {
      if (['Approved', 'Rejected', 'Completed'].includes(app.status)) {
        const analysis = analyses.find(a => a.application_id === app.id);
        const isApproved = app.status === 'Approved' || app.status === 'Completed';
        
        decisions.push({
          id: uuidv4(),
          application_id: app.id,
          recommended_by: analystUser?.id || rmUser.id,
          recommended_decision: isApproved ? 'Approve' : 'Reject',
          recommendation_notes: isApproved ? 
            'Application meets all policy requirements' : 
            'Does not meet minimum credit criteria',
          recommended_at: app.submitted_at || app.created_at,
          approver_id: approverUser?.id || rmUser.id,
          final_decision: isApproved ? 'Approved' : 'Rejected',
          conditions: isApproved ? [
            { condition: 'Maintain minimum DSCR of 1.2', type: 'Post-disbursement' },
            { condition: 'Submit quarterly financial statements', type: 'Post-disbursement' },
            { condition: 'Insurance coverage on collateral', type: 'Pre-disbursement' }
          ] : [],
          rejection_reason: isApproved ? null : 'Insufficient credit score and collateral coverage',
          decided_at: app.updated_at,
          is_final: true
        });
      }
    });
    
    await fileStorage.write('decisions', decisions);
    console.log(`✓ Generated ${decisions.length} decisions`);

    console.log('\n✓ Seed data generation complete!');
    console.log(`  - ${applications.length} applications`);
    console.log(`  - ${documents.length} documents`);
    console.log(`  - ${analyses.length} analyses`);
    console.log(`  - ${decisions.length} decisions`);
    console.log('\nYou can now start the server and explore the demo data.');
    
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedData().then(() => process.exit(0));
}

module.exports = { seedData };

// Made with Bob
