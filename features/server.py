import json
import os
import pathlib
import time
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


ROOT = pathlib.Path(__file__).resolve().parent


def load_dotenv(path: pathlib.Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        os.environ[k] = v


load_dotenv(ROOT / ".env")


def gemini_generate_text(
    prompt: str,
    model: str,
    *,
    response_mime_type: str | None = "application/json",
    max_output_tokens: int | None = None,
) -> tuple[str, str | None]:
    """Returns (text, finish_reason) where finish_reason may be STOP, MAX_TOKENS, etc."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set (create a .env file).")

    model_name = model.strip()
    if model_name.startswith("models/"):
        model_name = model_name[len("models/") :]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

    if max_output_tokens is None:
        # Uzun Markdown atölye planları için yüksek limit; JSON için daha düşük varsayılan
        if response_mime_type:
            max_output_tokens = int(os.environ.get("GEMINI_MAX_OUTPUT_TOKENS_JSON", "4096"))
        else:
            max_output_tokens = int(os.environ.get("GEMINI_MAX_OUTPUT_TOKENS_MARKDOWN", "8192"))

    generation_config: dict = {"temperature": 0.7, "maxOutputTokens": max_output_tokens}
    if response_mime_type:
        generation_config["responseMimeType"] = response_mime_type

    payload = {"contents": [{"role": "user", "parts": [{"text": prompt}]}], "generationConfig": generation_config}

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini HTTP {e.code}: {body}") from e

    candidates = data.get("candidates") or []
    if not candidates:
        raise RuntimeError("Gemini returned no candidates.")
    cand0 = candidates[0]
    parts = (cand0.get("content") or {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts).strip()
    finish_reason = cand0.get("finishReason")
    if not text:
        raise RuntimeError("Gemini returned empty text.")
    return text, finish_reason


def build_prompt(mode: str, user_input: str, *, format: str = "json") -> str:
    common_rules = """\
Kurallar (kesin):
- Kısıtlı İmkan Prensibi: Sadece evde bulunabilen, çok ucuz, geri dönüştürülebilir/atık malzemeler öner. (pet şişe, balon, karton, ip vb.)
- Pahalı/lab ekipmanı önerme.
- Güvenlik: Mutlaka "Güvenlik Uyarıları" bölümü ekle (çocuklar için).
- Dil ve Üslup: Deney adımlarını ve sonuçlarını açıklarken kesinlikle karmaşık akademik terimler kullanma. Açıklamaları ortaokul seviyesindeki birinin bile rahatça anlayabileceği kadar sade, anlaşılır ve günlük bir dille yap.
- Türkçe yaz.

"""

    if mode == "kasif":
        if format == "markdown":
            return f"""\
Sen "Bilim Köprüsü" uygulamasında Kâşifler için çalışan, hikayeci bir deney uzmanısın.
{common_rules}

Mutlaka aşağıdaki 5 bölümün TAMAMINI üret. Hiçbir bölümü atlama.
Markdown başlıkları kullan ve her bölümün altında en az 3 madde/öğe olacak şekilde detay ver.

## 1) Hikaye
(10-15 yaş için kısa ve heyecanlı)

## 2) Malzemeler
- ...

## 3) Adım Adım Yapılış
1. ...

## 4) Beklenen Sonuç / Neyi Öğreniyoruz?
- ...

## 5) Güvenlik Uyarıları
- ...

Kullanıcının sorusu:
{user_input}
"""
        return f"""\
Sen "Bilim Köprüsü" uygulamasında Kâşifler için çalışan, hikayeci bir deney uzmanısın.
{common_rules}

Sadece GEÇERLİ JSON döndür. Markdown veya düz metin ekleme.
Şema:
{{
  "mode": "kasif",
  "title": string,
  "story": string,
  "materials": [string],
  "steps": [string],
  "learning": string,
  "safety": [string]
}}

Kullanıcının sorusu:
{user_input}
"""

    # rehber
    if format == "markdown":
        return f"""\
Sen "Bilim Köprüsü" uygulamasında Rehberler için çalışan bir eğitmen asistanısın.
{common_rules}

Mutlaka aşağıdaki 5 bölümün TAMAMINI üret. Hiçbir bölümü atlama.
Markdown başlıkları kullan, kişi sayısına göre ölçekle ve uygulanabilir zaman planı ver.

## 1) Amaç ve kazanımlar
- ...

## 2) Malzemeler (ölçekli) + Bütçe dostu alternatifler
- ...

## 3) Atölye Akışı (zaman planı)
1. 0-5 dk: ...

## 4) Grup yönetimi ipuçları
- ...

## 5) Güvenlik notları
- ...

Eğitmenin girdisi (konu + kişi sayısı gibi):
{user_input}
"""
    return f"""\
Sen "Bilim Köprüsü" uygulamasında Rehberler için çalışan bir eğitmen asistanısın.
{common_rules}

Sadece GEÇERLİ JSON döndür. Markdown veya düz metin ekleme.
Şema:
{{
  "mode": "rehber",
  "title": string,
  "objective": string,
  "materials": [string],
  "alternatives": [string],
  "flow": [{{"time": string, "activity": string}}],
  "groupTips": [string],
  "safety": [string]
}}

Eğitmenin girdisi (konu + kişi sayısı gibi):
{user_input}
"""


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Dev CORS convenience (same-origin when served by this server).
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/generate":
            self.send_response(404)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode("utf-8"))
            return

        length = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(length).decode("utf-8", errors="replace")
        try:
            body = json.loads(raw or "{}")
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid JSON"}).encode("utf-8"))
            return

        prompt = (body.get("prompt") or "").strip()
        mode = (body.get("mode") or "").strip()
        out_format = (body.get("format") or "json").strip().lower()
        if out_format not in ("json", "markdown"):
            out_format = "json"
        if not prompt or mode not in ("kasif", "rehber"):
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(
                json.dumps({"error": "mode must be kasif|rehber and prompt is required"}).encode("utf-8")
            )
            return

        model = (os.environ.get("GEMINI_MODEL") or "gemini-2.5-flash").strip()
        started = time.time()
        try:
            full_prompt = build_prompt(mode=mode, user_input=prompt, format=out_format)
            if out_format == "markdown":
                text, finish_reason = gemini_generate_text(prompt=full_prompt, model=model, response_mime_type=None)
                payload = {
                    "text": text,
                    "ms": int((time.time() - started) * 1000),
                    "finishReason": finish_reason,
                }
                if finish_reason == "MAX_TOKENS":
                    payload["truncated"] = True
            else:
                text, finish_reason = gemini_generate_text(
                    prompt=full_prompt, model=model, response_mime_type="application/json"
                )
                try:
                    data = json.loads(text)
                    payload = {"data": data, "ms": int((time.time() - started) * 1000), "finishReason": finish_reason}
                except Exception:
                    payload = {"text": text, "ms": int((time.time() - started) * 1000), "finishReason": finish_reason}
                if finish_reason == "MAX_TOKENS":
                    payload["truncated"] = True
            self.send_response(200)
        except Exception as e:
            payload = {"error": str(e)}
            self.send_response(500)
            print(f"[api] error: {e}", flush=True)

        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))


def main():
    port = int(os.environ.get("PORT") or "5173")
    os.chdir(str(ROOT))
    ThreadingHTTPServer.allow_reuse_address = True
    try:
        httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    except OSError as e:
        print(
            f"Port {port} kullanılamıyor (başka bir sunucu açık olabilir): {e}",
            flush=True,
        )
        print(
            f"Çözüm: netstat -ano | findstr :{port}  →  taskkill /F /PID <PID>",
            flush=True,
        )
        raise SystemExit(1) from e
    print(f"Bilim Köprüsü dev server: http://127.0.0.1:{port}", flush=True)
    print("API proxy: POST /api/generate", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()

