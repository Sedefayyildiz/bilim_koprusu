  # Bilim Köprüsü (Science Bridge)

## Problem
Kırsal veya dezavantajlı bölgelerdeki çocukların; bilim, mekanik ve teknoloji alanlarındaki meraklarını giderecek uygulamalı, fiziksel eğitim materyallerine ve rehberliğe erişim eksikliği. Bu durum, sadece teorik bilgiye maruz kalan öğrenciler için eğitimde fırsat eşitsizliği yaratmaktadır.

## Çözüm
Bilim Köprüsü, karmaşık bilimsel teorileri anında uygulanabilir, eğlenceli ve fiziksel deneylere dönüştüren yapay zeka destekli bir web uygulamasıdır. Genel geçer ansiklopedik yanıtlar veren araçların aksine, Bilim Köprüsü teoriyi fiziksel üretime bağlar ve "kısıtlı malzemelerle anında deney kurgulama" yeteneği sunar.

Yapay zeka arka planda kullanıcının seçtiği role göre iki farklı persona ile çalışır:
* **Kâşif Modu (Öğrenciler):** Öğrencinin karmaşık mühendislik veya bilim sorularını yaşlarına uygun bir hikayeye dönüştürür. Çevredeki atık ve ucuz malzemelerle (pet şişe, karton vb.) yapılabilecek basit bir "kendin yap" (DIY) deneyi tasarlar.
* **Rehber Modu (Eğitmenler/Gönüllüler):** Sahada veya sınıfta kısıtlı bütçeyle çalışan eğitmenlerin girdiği konu başlıkları ve sınıf mevcudu için, adım adım atölye planları, malzeme listeleri ve güvenlik uyarıları üretir.

## Canlı Demo
* **Yayın Linki:** https://bilimkoprusu.netlify.app/
* **Demo Video:** https://youtu.be/2niAd9I92u4

## Kullanılan Teknolojiler
*  **HTML5:** Karşılama ekranı ve arayüz iskeletinin oluşturulması.
*  **CSS3:** Modlar arası geçiş, modern kart (card) tasarımları ve mobil uyumluluk (responsive tasarım).
*  **Vanilla JavaScript:** API'den yanıt beklenirken gösterilen animasyonların (roket/dişli çark) tetiklenmesi ve form işlemlerinin yönetimi.
*  **Python:** Arka plan (Backend) sunucu işlemleri ve veri işleme.
*  **Google Gemini API:** Metin analizi, hikayeleştirme ve kısıtlı imkan prensibine uygun adım adım deney üretimi.
*  **Netlify:** GitHub entegrasyonu ile projenin hızlıca canlıya alınması.

## Sistem Mimarisi
![Sistem Mimarisi Şeması](gorsel_yolu_buraya.png)
*(Kullanıcı -> Netlify -> Python Server -> Gemini API)*

## Öne Çıkan Özellikler & Kullanıcı Deneyimi
* **Dinamik Bekleme (Loading) Ekranları:** Kullanıcı "Oluştur" butonuna bastığında API yanıt verene kadar roket fırlatma veya dönen dişli çarklar gibi motive edici bilimsel animasyonlar gösterilir.
* **Gerçekçi Bilimsel Arayüz:** Enerjiyi ve bilimi yansıtan koyu mor, sarı ve turuncu renk paleti ile öğrencileri motive edecek arka plan görselleri kullanılır.
* **Çevrimdışı Kullanım:** Üretilen deney veya atölye planları, sayfanın altındaki "Kaydet/İndir" butonu sayesinde cihazlara PDF veya TXT olarak indirilebilir.

## Nasıl Çalıştırılır?
Projeyi yerel ortamında çalıştırmak ve Netlify üzerinde yayına almak için aşağıdaki adımları izleyebilirsin.

### 1. Kurulum ve Yerel Çalıştırma
1. Projeyi bilgisayarına klonla: `git clone [repo-linki]`
2. Kök dizinde bir `.env` dosyası oluştur ve Google AI Studio'dan aldığın Gemini API anahtarını ekle: `GEMINI_API_KEY=senin_api_anahtarin`
3. Python bağımlılıklarını kur (eğer bir requirements.txt varsa): `pip install -r requirements.txt`
4. Frontend dosyalarını (HTML/CSS/JS) tarayıcıda açarak arayüzü test et.

### 2. Netlify & Python Server Entegrasyonu (Özet)
Python dilinde yazılı backend dosyasının Netlify ortamında (serverless) sorunsuz çalışabilmesi için şu yapılandırma adımları uygulanmıştır:
* **netlify.toml Yapılandırması:** Netlify'a projenin nasıl derleneceğini ve yönlendirmelerin nasıl yapılacağını bildiren temel ayar dosyası oluşturulur. İstemciden gelen tüm API istekleri Python fonksiyonlarına yönlendirilir.
* **Serverless Fonksiyonlar:** Python kodu, Netlify Functions mimarisine uygun hale getirilir. Backend, bağımsız bir sunucu olarak sürekli çalışmak yerine, istek geldiğinde tetiklenen (trigger) ve işlemi bitince kapanan lambda fonksiyonları olarak ayarlanır. Bu sayede Netlify üzerinden frontend ve Python backend bir arada, sorunsuz bir şekilde barındırılır.
