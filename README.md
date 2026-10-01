# Ses Puanlama — GitHub Pages

Türkçe konuşabilen 7.728 sesi 1–10 arasında puanlama, canlı liderlik.

## Yayınlama (GitHub Pages)

1. Bu klasörü bir GitHub reposuna push et (repo ayarlarında **Pages → Branch: main, / (root)** seç).
2. Adres: `https://<kullanici>.github.io/<repo>/`

Python sunucusuna gerek yok — tamamen statik.

## Ortak liderlik (herkesin görmesi için)

Varsayılan: puanlar sadece tarayıcıda (localStorage) saklanır.
Ortak depo için `config.js` içine ücretsiz [jsonbin.io](https://jsonbin.io) bilgilerini gir:

1. jsonbin.io'ya üye ol → **Create Bin** (boş: `{}`)
2. Bin ID + **X-Master-Key** (Settings → API Keys) → `config.js`'e yapıştır
3. Deploy et → artık aynı siteden herkes aynı liderliği ve toplam ortalamaları görür
4. Boş bırakılırsa site yine çalışır (sadece tarayıcı-özel)

## Liderlik

- Sıralama: ses ortalaması (tüm kullanıcılar) — sıradaki satıra tıklayınca önizleme çalar
- Açıkken otomatik yenilenir (config.js `refreshMs`)

## Notlar

- Sesler uzak önizleme URL'leriyle oynatılır; URL'ler arayüzde metin olarak gösterilmez
- `data.js` = 7.728 sesin meta + önizleme linkleri (4 MB)
