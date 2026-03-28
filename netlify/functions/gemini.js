exports.handler = async function(event, context) {
  // Sadece POST (veri gönderme) isteklerini kabul ediyoruz
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Sadece POST metodu geçerlidir." };
  }

  try {
    const requestBody = JSON.parse(event.body);
    
    // Netlify'ın gizli kasasından API anahtarımızı çekiyoruz
    const apiKey = process.env.GEMINI_API_KEY; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Gemini'ye isteği atıyoruz
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody) // Ön yüzden gelen veriyi aynen iletiyoruz
    });

    const data = await response.json();

    // Gemini'den gelen cevabı ön yüze geri gönderiyoruz
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Sunucuda bir hata oluştu." })
    };
  }
};
