exports.handler = async function(event, context) {
  // Sadece POST isteklerini kabul et
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const requestBody = JSON.parse(event.body);
    const { prompt, systemPrompt } = requestBody;
    
    // Netlify ayarlarından gizli API anahtarımızı alıyoruz
    const apiKey = process.env.GEMINI_API_KEY; 

    // Gemini API'sine isteği hazırlıyoruz
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await geminiResponse.json();
    
    // Gemini'den gelen cevabı alıyoruz
    const generatedText = data.candidates[0].content.parts[0].text;

    // Ön yüze (index.html'e) cevabı gönderiyoruz
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: generatedText, truncated: false })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Arka yüz sunucusunda bir hata oluştu." })
    };
  }
};
