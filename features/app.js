const state = {
  mode: null, // "kasif" | "rehber"
  lastResult: null,
};

function setMode(mode) {
  state.mode = mode;

  const buttons = document.querySelectorAll("[data-mode]");
  buttons.forEach((btn) => {
    btn.dataset.selected = btn.dataset.mode === mode ? "true" : "false";
  });

  const composer = document.getElementById("composer");
  const composerLabel = document.getElementById("composerLabel");
  const composerHint = document.getElementById("composerHint");
  const input = document.getElementById("promptInput");
  const submit = document.getElementById("composerSubmit");
  if (composer && input && submit) {
    composer.hidden = !mode;
    input.disabled = !mode;
    submit.disabled = !mode || !input.value.trim();
  }

  const modeNote = document.getElementById("modeNote");
  if (!modeNote) return;

  if (mode === "kasif") {
    modeNote.textContent = "Kâşif modu seçildi. Bir sonraki adımda sorunu yazacaksın.";
    if (composerLabel) composerLabel.textContent = "Merak ettiğin soruyu yaz";
    if (composerHint)
      composerHint.textContent =
        "Örn: “Uçaklar nasıl uçar?” — evdeki basit malzemelerle deney tasarlayalım.";
    if (input) input.placeholder = "Örn: Uçaklar nasıl uçar?";
    if (submit) submit.textContent = "Deney Tasarla";
  } else if (mode === "rehber") {
    modeNote.textContent = "Rehber modu seçildi. Bir sonraki adımda konu ve kişi sayısını yazacaksın.";
    if (composerLabel) composerLabel.textContent = "Konu ve kişi sayısını yaz";
    if (composerHint)
      composerHint.textContent =
        "Örn: “Basınç, 15 kişi” — bütçe dostu atölye planı çıkaralım.";
    if (input) input.placeholder = "Örn: Basınç, 15 kişi";
    if (submit) submit.textContent = "Atölye Planla";
  } else {
    modeNote.textContent = "Bir mod seçerek başlayın.";
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target?.closest?.("[data-mode]");
  if (!btn) return;
  setMode(btn.dataset.mode);
});

function getEls() {
  return {
    form: document.getElementById("composer"),
    input: document.getElementById("promptInput"),
    submit: document.getElementById("composerSubmit"),
    clear: document.getElementById("composerClear"),
    loading: document.getElementById("loading"),
    loadingTitle: document.getElementById("loadingTitle"),
    loadingText: document.getElementById("loadingText"),
    results: document.getElementById("results"),
    cards: document.getElementById("cards"),
    resultsTitle: document.getElementById("resultsTitle"),
    resultsReset: document.getElementById("resultsReset"),
    resultsDownload: document.getElementById("resultsDownload"),
    resultsCapture: document.getElementById("resultsCapture"),
  };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderCard({ title, bodyNode, full = false }) {
  const card = el("article", `card${full ? " card--full" : ""}`);
  card.appendChild(el("div", "card__title", title));
  const body = el("div", "card__body");
  if (bodyNode) body.appendChild(bodyNode);
  card.appendChild(body);
  return card;
}

function renderList(items, ordered = false) {
  const list = document.createElement(ordered ? "ol" : "ul");
  items.forEach((it) => {
    const li = document.createElement("li");
    li.textContent = String(it);
    list.appendChild(li);
  });
  return list;
}

function showResults(payload) {
  const { results, cards, resultsTitle } = getEls();
  if (!results || !cards) return;
  state.lastResult = payload || null;
  cards.innerHTML = "";

  const data = payload?.data;
  if (data && typeof data === "object") {
    const title = data.title || (data.mode === "rehber" ? "Atölye Planı" : "Deney");
    if (resultsTitle) resultsTitle.textContent = title;

    if (data.mode === "kasif") {
      if (data.story) cards.appendChild(renderCard({ title: "Hikaye", bodyNode: el("div", "", data.story), full: true }));
      if (Array.isArray(data.materials)) cards.appendChild(renderCard({ title: "Malzemeler", bodyNode: renderList(data.materials) }));
      if (Array.isArray(data.steps)) cards.appendChild(renderCard({ title: "Adım Adım Yapılış", bodyNode: renderList(data.steps, true), full: true }));
      if (data.learning) cards.appendChild(renderCard({ title: "Neyi Öğreniyoruz?", bodyNode: el("div", "", data.learning) }));
      if (Array.isArray(data.safety)) cards.appendChild(renderCard({ title: "Güvenlik Uyarıları", bodyNode: renderList(data.safety), full: true }));
    } else {
      if (data.objective) cards.appendChild(renderCard({ title: "Amaç ve Kazanımlar", bodyNode: el("div", "", data.objective), full: true }));
      if (Array.isArray(data.materials)) cards.appendChild(renderCard({ title: "Malzemeler", bodyNode: renderList(data.materials) }));
      if (Array.isArray(data.alternatives) && data.alternatives.length)
        cards.appendChild(renderCard({ title: "Bütçe Dostu Alternatifler", bodyNode: renderList(data.alternatives) }));
      if (Array.isArray(data.flow) && data.flow.length) {
        const lines = data.flow.map((x) => `${x.time}: ${x.activity}`);
        cards.appendChild(renderCard({ title: "Atölye Akışı", bodyNode: renderList(lines, true), full: true }));
      }
      if (Array.isArray(data.groupTips) && data.groupTips.length)
        cards.appendChild(renderCard({ title: "Grup Yönetimi İpuçları", bodyNode: renderList(data.groupTips), full: true }));
      if (Array.isArray(data.safety) && data.safety.length)
        cards.appendChild(renderCard({ title: "Güvenlik Notları", bodyNode: renderList(data.safety), full: true }));
    }
  } else {
    if (resultsTitle) resultsTitle.textContent = "Sonuç";
    const pre = document.createElement("pre");
    pre.textContent = String(payload?.text || "");
    cards.appendChild(renderCard({ title: "Çıktı", bodyNode: pre, full: true }));
  }

  results.hidden = false;
}

document.addEventListener("input", (e) => {
  const { input, submit } = getEls();
  if (!input || !submit) return;
  if (e.target !== input) return;
  submit.disabled = !state.mode || !input.value.trim();
});

document.addEventListener("click", (e) => {
  const { input, submit, clear } = getEls();
  if (!clear || e.target !== clear) return;
  if (!input) return;
  input.value = "";
  if (submit) submit.disabled = true;
  input.focus();
});

document.addEventListener("submit", (e) => {
  const { form, input, loading, loadingTitle, loadingText, results } = getEls();
  if (!form || e.target !== form) return;
  e.preventDefault();
  if (!state.mode) return;
  if (!input) return;
  const prompt = input.value.trim();
  if (!prompt) return;

  const modeNote = document.getElementById("modeNote");
  const composer = document.getElementById("composer");
  const cards = document.getElementById("cards");
  if (cards) cards.innerHTML = "";
  if (results) results.hidden = true;

  if (loadingTitle) {
    loadingTitle.textContent =
      state.mode === "kasif" ? "Deney tasarlanıyor…" : "Atölye planlanıyor…";
  }
  if (loadingText) {
    loadingText.textContent =
      state.mode === "kasif"
        ? "Evde bulunabilen malzemelerle adımları hazırlıyoruz."
        : "Kişi sayısına göre malzemeleri ve akışı optimize ediyoruz.";
  }

  if (composer) composer.hidden = true;
  if (loading) loading.hidden = false;

 fetch("/.netlify/functions/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: state.mode, prompt }),
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    })
    .then((data) => {
      if (modeNote) modeNote.textContent = "Yanıt geldi. Aşağıdaki kartlara göz at.";
      showResults(data);
    })
    .catch((err) => {
      if (modeNote) modeNote.textContent = `Hata: ${err?.message || "İstek başarısız"}`;
    })
    .finally(() => {
      if (loading) loading.hidden = true;
      if (composer) composer.hidden = false;
    });
});

document.addEventListener("click", (e) => {
  const { resultsReset, results, input, submit, resultsDownload, resultsCapture } = getEls();

  if (resultsReset && e.target === resultsReset) {
    if (results) results.hidden = true;
    if (input) input.focus();
    if (submit) submit.disabled = !state.mode || !input?.value?.trim();
    return;
  }

  if (resultsDownload && e.target === resultsDownload) {
    const payload = state.lastResult;
    if (!payload) return;

    const data = payload.data || null;
    const mode = data?.mode || state.mode || "bilim-koprusu";
    const baseTitle = (data && typeof data.title === "string" && data.title.trim()) || "bilim-koprusu";
    const safeTitle = baseTitle
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-çğıöşü]/g, "")
      .slice(0, 80);

    let lines = [];
    if (data && typeof data === "object") {
      if (data.title) lines.push(`# ${data.title}`);
      if (mode === "kasif") {
        if (data.story) {
          lines.push("", "== Hikaye ==", data.story);
        }
        if (Array.isArray(data.materials) && data.materials.length) {
          lines.push("", "== Malzemeler ==");
          data.materials.forEach((m) => lines.push(`- ${m}`));
        }
        if (Array.isArray(data.steps) && data.steps.length) {
          lines.push("", "== Adım Adım Yapılış ==");
          data.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
        }
        if (data.learning) {
          lines.push("", "== Neyi Öğreniyoruz? ==", data.learning);
        }
        if (Array.isArray(data.safety) && data.safety.length) {
          lines.push("", "== Güvenlik Uyarıları ==");
          data.safety.forEach((s) => lines.push(`- ${s}`));
        }
      } else {
        if (data.objective) {
          lines.push("", "== Amaç ve Kazanımlar ==", data.objective);
        }
        if (Array.isArray(data.materials) && data.materials.length) {
          lines.push("", "== Malzemeler ==");
          data.materials.forEach((m) => lines.push(`- ${m}`));
        }
        if (Array.isArray(data.alternatives) && data.alternatives.length) {
          lines.push("", "== Bütçe Dostu Alternatifler ==");
          data.alternatives.forEach((m) => lines.push(`- ${m}`));
        }
        if (Array.isArray(data.flow) && data.flow.length) {
          lines.push("", "== Atölye Akışı ==");
          data.flow.forEach((x) => lines.push(`${x.time}: ${x.activity}`));
        }
        if (Array.isArray(data.groupTips) && data.groupTips.length) {
          lines.push("", "== Grup Yönetimi İpuçları ==");
          data.groupTips.forEach((m) => lines.push(`- ${m}`));
        }
        if (Array.isArray(data.safety) && data.safety.length) {
          lines.push("", "== Güvenlik Notları ==");
          data.safety.forEach((m) => lines.push(`- ${m}`));
        }
      }
    } else {
      lines = ["# Bilim Köprüsü Çıktısı", "", String(payload.text || "")];
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}-${mode}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (resultsCapture && e.target === resultsCapture) {
    if (!results || results.hidden) return;
    if (typeof window.html2canvas !== "function") {
      alert("Görsel kaydetme için html2canvas yüklenemedi.");
      return;
    }

    const payload = state.lastResult;
    const data = payload?.data || null;
    const mode = data?.mode || state.mode || "bilim-koprusu";
    const baseTitle = (data && typeof data.title === "string" && data.title.trim()) || "bilim-koprusu";
    const safeTitle = baseTitle
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-çğıöşü]/g, "")
      .slice(0, 80);

    window.html2canvas(results, {
      backgroundColor: "#170427",
      scale: window.devicePixelRatio || 2,
    }).then((canvas) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${safeTitle}-${mode}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        },
        "image/png",
        0.95,
      );
    });
  }
});

// 1. METİN OLARAK KAYDETME FONKSİYONU
function downloadAsText() {
    // DİKKAT: 'sonuc-alani' yazan yeri kendi html'indeki asıl içeriğin ID'si ile değiştirmelisin
    const content = document.getElementById('sonuc-alani'); 
    
    if (!content) {
        alert("Kaydedilecek metin bulunamadı!");
        return;
    }

    // Div'in içindeki sadece metinleri alıyoruz
    const textData = content.innerText; 
    
    // txt dosyası oluşturup indiriyoruz
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Bilim-Koprusu-Deney.txt';
    link.click();
    URL.revokeObjectURL(link.href); // Hafızayı temizle
}

// 2. GÖRSEL OLARAK KAYDETME FONKSİYONU
function downloadAsImage() {
    // DİKKAT: 'sonuc-alani' yazan yeri resmini çekmek istediğin ana çerçevenin ID'si ile değiştir
    const content = document.getElementById('sonuc-alani');
    
    if (!content) {
        alert("Resmi çekilecek alan bulunamadı!");
        return;
    }

    // html2canvas ile div'in ekran görüntüsünü alıyoruz
    html2canvas(content, {
        scale: 2, // Görüntü kalitesini artırır (HD yapar)
        backgroundColor: "#1a113d" // Sayfanın mor arka plan rengi (şeffaf çıkmaması için)
    }).then(canvas => {
        // Görüntüyü png formatına çevirip indiriyoruz
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = 'Bilim-Koprusu-Gorsel.png';
        link.click();
    });
}
