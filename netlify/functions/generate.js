exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Sadece POST metodu geçerlidir." };
  }

  try {
    console.log("ADIM 1: İstek geldi!");
    const requestBody = JSON.parse(event.body);
    
    // ÇÖZÜM: frontend'den gönderdiğimiz systemPrompt'u da artık alıyoruz
    const { mode, prompt, systemPrompt } = requestBody; 
    console.log("ADIM 2: Gelen veri okundu. Prompt:", prompt);

    const apiKey = process.env.GEMINI_API_KEY; 
    if (!apiKey) {
      console.error("KRİTİK HATA: Netlify'da GEMINI_API_KEY bulunamadı!");
      throw new Error("API Anahtarı bulunamadı!");
    }
    console.log("ADIM 3: Gizli kasa açıldı, API anahtarı mevcut.");

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Gemini API'sine gidecek temel veri paketini hazırlıyoruz
    const requestPayload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    // ÇÖZÜM: Kurallarımız varsa, bunu Gemini'ın kuralları okuduğu özel "system_instruction" alanına ekliyoruz
    if (systemPrompt) {
      requestPayload.system_instruction = {
        parts: [{ text: systemPrompt }]
      };
    }

    console.log("ADIM 4: Gemini yapay zekasına bağlanılıyor...");
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });

    const data = await response.json();

    if (data.error) {
        console.error("ADIM 5'TE PATLADI (GEMINI İTİRAZ ETTİ):", data.error);
        return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    }

    console.log("ADIM 6: Gemini'den muhteşem cevap başarıyla alındı!");
    const generatedText = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: generatedText, truncated: false })
    };

  } catch (error) {
    console.error("BEKLENMEYEN SİSTEM HATASI:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
