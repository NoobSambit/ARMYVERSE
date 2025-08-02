export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Allow both GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('✅ Test API route hit!');
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);
    
    res.json({
      message: 'ArmyVerse API is working! 💜',
      status: 'success',
      timestamp: new Date().toISOString(),
      method: req.method,
      body: req.body
    });
    
  } catch (error) {
    console.error('❌ Test API error:', error);
    res.status(500).json({ 
      error: 'Test API failed', 
      details: error.message 
    });
  }
} 