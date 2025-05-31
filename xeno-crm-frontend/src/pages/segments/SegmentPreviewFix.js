// This is a temporary file to help with copying the fixed code
// Fix for the segment preview slice error

// For when using an existing segment ID:
if (response.data) {
  // Make sure customers array exists before using slice
  const customers = response.data.customers || [];
  console.log('Segment preview - received customers:', customers);
  
  setAudiencePreview({
    count: response.data.count || 0,
    sampleCustomers: customers.length > 0 ? 
      customers.slice(0, 3).map(customer => ({
        id: customer._id || 'unknown',
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer',
        email: customer.email || 'No email',
        totalSpend: parseFloat(customer.totalSpend || 0)
      })) : []
  });
}

// For when creating a new segment:
if (response.data) {
  // Make sure customers array exists before using slice
  const customers = response.data.customers || [];
  console.log('Segment preview - received customers for new segment:', customers);
  
  setAudiencePreview({
    count: response.data.count || 0,
    sampleCustomers: customers.length > 0 ? 
      customers.slice(0, 3).map(customer => ({
        id: customer._id || 'unknown',
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer',
        email: customer.email || 'No email',
        totalSpend: parseFloat(customer.totalSpend || 0)
      })) : []
  });
}
