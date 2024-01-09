const axios = require('axios');

const handler = async (event) => {
  console.log('hi')


  if (!['POST', 'DELETE'].includes(event.httpMethod)) {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  // Initialize variables
  let presetData, password, presetId;



  // Handling for POST method
  if (event.httpMethod === 'POST') {
    const data = JSON.parse(event.body);
    ({ presetData, password } = data);
  }

  // Handling for DELETE method
  if (event.httpMethod === 'DELETE') {
    const queryParams = event.queryStringParameters;
    presetId = queryParams.presetId;
    password = queryParams.password;
    console.log('Deleting preset with ID:', presetId);
  }

  console.log('incoming stuff: ', [presetData.Name, password])

  if (password.trim() !== process.env.PRESET_CREATION_PASSWORD) {
    return { statusCode: 403, body: 'Forbidden' };
  }

  // Function to create a preset
  const createPreset = async () => {
    try {
      const response = await axios.post(
        'https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api/color-presets',
        { data: presetData },
        {
          headers: {
            'Authorization': `Bearer ${process.env.PRESET_CREATION_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { statusCode: 200, body: JSON.stringify(response.data) };
      // return { statusCode: 200 }
    } catch (error) {
      console.error('Error creating preset:', error.message);
      return {
        statusCode: error.response?.status || 500,
        body: JSON.stringify({ message: error.message })
      };
    }
  };

  // Function to delete a preset
  const deletePreset = async () => {
    try {
      await axios.delete(
        `https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api/color-presets/${presetId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.PRESET_CREATION_TOKEN}`
          }
        }
      );
      return { statusCode: 200, body: 'Preset deleted successfully' };
      return { statusCode: 'mike' }
    } catch (error) {
      console.error('Error deleting preset:', error);
      return {
        statusCode: error.response?.status || 500,
        body: JSON.stringify({ message: error.message })
      };
    }
  };

  // Handling different HTTP methods
  switch (event.httpMethod) {
    case 'POST':
      return createPreset();
    case 'DELETE':
      return deletePreset();
    default:
      return { statusCode: 405, body: 'Method Not Allowed' };
  }
};

module.exports = { handler };
