const axios = require('axios');

const handler = async (event) => {
  console.log('hi')

  
  if (!['POST', 'DELETE'].includes(event.httpMethod)) {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  data = JSON.parse(event.body)
  const { presetData, password, presetId } = data;
  console.log('incoming stuff: ', [presetData.Name, password, presetId])

  // Password check
  console.log('le passwords', [password, process.env.PRESET_CREATION_PASSWORD])
  if (password.trim() !== process.env.PRESET_CREATION_PASSWORD) {
    return { statusCode: 403, body: 'Forbidden' };
  }

  console.log(`Bearer ${process.env.PRESET_CREATION_TOKEN}`);

  // Function to create a preset
  const createPreset = async () => {
    try {
      // console.log('POSTING', presetData)
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
    console.log('deleting', process.env)
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
