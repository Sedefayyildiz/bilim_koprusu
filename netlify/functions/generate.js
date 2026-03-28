exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Sadece POST metodu geçerlidir." };
  }

  try {
    // 1. Ön yüzden gelen veriyi al
    const requestBody = JSON.parse(event.body);
    const { mode, prompt } = requestBody; 
    
    // 2. Netlify kasasından şifreyi al
    const apiKey = process.env.GEMINI_API_KEY; 
    
    if (!apiKey) {
      throw new Error("API Anahtarı bulunamadı! Lütfen Netlify Environment Variables ayarlarını kontrol edin.");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // 3. Gemini'ye isteği at
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    // 4. Gemini'den hata gelirse çökmesini engelle ve hatayı ekrana bas
    if (data.error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: data.error.message })
        };
    }

    // 5. Başarılı cevabı ön yüze gönder
    const generatedText = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: generatedText, truncated: false })
    };

  } catch (error) {
    // Eğer kodda bir şey ters giderse bize tam olarak ne olduğunu söylesin
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
