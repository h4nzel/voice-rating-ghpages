// ================= ORTAK LIDERLIK AYARLARI =================
// Leaderboard'un herkes tarafindan gorulmesi icin ucretsiz bir
// jsonbin.io bin'i olustur:
//   1) https://jsonbin.io -> uye ol -> "Create Bin" (bos JSON: {})
//   2) Bin ID'yi ve X-Master-Key'i (Settings -> API Keys) asagiya yapistir
//   3) GitHub Pages'e yukle; artik ayni siteden herkes puanlari/bir
//      oylamayi gorur. Bos birakirsan puanlar sadece bu tarayicida kalir.
window.APP_CONFIG = {
  jsonbinBinId: "",   // ornek: "65abc123def4567890abcd"
  jsonbinKey: "",     // X-Master-Key (ornek: "$2a$10$...")
  refreshMs: 10000    // liderlik yenileme araligi (ms)
};
