import apper from 'https://cdn.apper.io/actions/apper-actions.js';

apper.serve(async (req) => {
  try {
    // Parse request body
    const body = await req.json();
    
    if (!body || !body.contact) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Contact data is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contactData = body.contact;

    // Validate required fields
    if (!contactData.name_c && !contactData.email_c) {
      return new Response(JSON.stringify({
        success: false,
        message: 'At least contact name or email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Retrieve CompanyHub API key from secrets
    const apiKey = await apper.getSecret('COMPANYHUB_API_KEY');
    
    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        message: 'CompanyHub API key not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Map contact data to CompanyHub format
    const companyHubContact = {
      name: contactData.name_c || '',
      email: contactData.email_c || '',
      phone: contactData.phone_c || '',
      company: contactData.company_c || '',
      tags: contactData.tags_c || '',
      notes: contactData.notes_c || '',
      photo_url: contactData.photo_url_c || ''
    };

    // Make request to CompanyHub API
    const companyHubResponse = await fetch('https://api.companyhub.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(companyHubContact)
    });

    if (!companyHubResponse.ok) {
      const errorText = await companyHubResponse.text();
      let errorMessage = 'Failed to create contact in CompanyHub';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      return new Response(JSON.stringify({
        success: false,
        message: errorMessage,
        statusCode: companyHubResponse.status
      }), {
        status: companyHubResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const companyHubData = await companyHubResponse.json();

    return new Response(JSON.stringify({
      success: true,
      message: 'Contact synced to CompanyHub successfully',
      data: companyHubData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Internal server error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});