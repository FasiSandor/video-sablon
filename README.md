# VIDEO SABLON

CapCut ihletésű, saját böngészős sablonklip-készítő. Next.js App Router, helyben futó Canvas + MediaRecorder export. **Nem használ CapCut-sablonokat.**

## Funkciók (v0.1)
- Képek és rövid videók feltöltése, rendezése/törlése
- 8 sabloncsalád, mindegyikhez több eltérő képi variáció
- 9:16, 1:1, 16:9; 10/15/30 másodperces videók
- Saját zene és zenekezdőpont eltolása; BPM-alapú (kézzel beállított) ritmusra vágás
- Helyi preview és böngészős WebM/választható MP4 export, csak ahol a MediaRecorder támogatja
- Konfigurációs projektmentés JSON-ba, betöltés (a nagy médiafájlok nem ágyazódnak be)

## Fejlesztés
`npm install && npm run dev`

## Technikai korlátok
Az MP4, a hanggal történő rögzítés és a Canvas video capture támogatása eszköz- és böngészőfüggő. A program a támogatott mime típust választja, elutasítja a nem támogatott exportot; nem tölt fel fájlokat a szerverre. A BPM jelenleg manuális, **nincs automatikus beat-detekció**. Felhős projekttár és Neon integráció későbbi kör. A videókból a képkockák natív HTMLVideoElement használatával készülnek, egyes mobil eszközökön export közbeni háttérbe helyezés hibát okozhat.
