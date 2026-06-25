(function () {
  "use strict";

  var DB_NAME = "flowerInventoryDb";
  var DB_VERSION = 2;
  var STORE_NAME = "flowers";
  var SETTINGS_STORE_NAME = "settings";
  var DEMO_SEEDED_KEY = "demoSeeded";
  var EXPORT_DIRECTORY_KEY = "exportDirectoryHandle";
  var ONLINE_SEARCH_HISTORY_KEY = "flowerInventoryOnlineSearchHistory";
  var PENDING_REPAIR_IMPORT_KEY = "flowerInventoryPendingRepairImport";
  var ACTIVE_DB_NAME_KEY = "flowerInventoryActiveDatabaseName";
  var state = {
    db: null,
    flowers: [],
    selectedId: null,
    editingId: null,
    pendingImageData: "",
    pendingImages: [],
    pendingImageSources: [],
    pendingImageNames: [],
    pendingImageInfos: [],
    pendingImageIndex: 0,
    pendingFavoriteImageIndex: 0,
    thumbnailPasteContext: null,
    imageIndexes: {},
    autoFillTimer: null,
    lastLookupLatinName: "",
    descriptionLanguage: localStorage.getItem("flowerInventoryLanguage") || "de",
    descriptionDrafts: { hu: "", de: "", en: "" },
    editorRange: null,
    activeInfoTab: "description",
    language: localStorage.getItem("flowerInventoryLanguage") || "de",
    searchMode: "names",
    detailHistory: [],
    detailHistoryIndex: -1,
    currentLocationName: "",
    currentLocationStatus: "idle",
    currentInfoTimer: null,
    imageMetadataCache: {},
    imageLocationNameCache: {},
    sortDirections: loadSortDirections()
  };

  var EDITOR_FONT_FAMILIES = {
    "Segoe UI": '"Segoe UI", Arial, sans-serif',
    Arial: "Arial, sans-serif",
    Georgia: "Georgia, serif",
    "Times New Roman": '"Times New Roman", Times, serif',
    "Courier New": '"Courier New", monospace',
    Verdana: "Verdana, Geneva, sans-serif"
  };

  var EDITOR_FONT_SIZES = {
    1: "12px",
    2: "14px",
    3: "16px",
    4: "20px",
    5: "24px",
    6: "32px",
    7: "40px"
  };

  var translations = {
    hu: {
      appTitle: "Virág leltár",
      inventory: "Leltár",
      flowers: "Virágok",
      flowerListLabel: "Viráglista",
      newFlower: "Új virág",
      createOnlineFlower: "Virág létrehozása az internetről",
      createOnlineFlowerPrompt: "Add meg a magyar vagy latin virágnevet:",
      createOnlineFlowerPromptHu: "Add meg a magyar vagy latin virágnevet:",
      createOnlineFlowerPromptDe: "Add meg a német vagy latin virágnevet:",
      createOnlineFlowerPromptEn: "Add meg az angol vagy latin virágnevet:",
      createOnlineFlowerSearching: "Online adatok keresése…",
      createOnlineFlowerDone: "A virág létrejött {count} képpel.",
      createOnlineFlowerNoImage: "Nem sikerült megfelelő képet találni. A virág nem jött létre.",
      createOnlineFlowerFailed: "A virágot nem sikerült online létrehozni.",
      createOnlineFlowerNoMatch: "Nem található megfelelő online találat.",
      export: "Exportálás",
      exportAllFlowers: "Összes virág exportálása",
      exportFilteredFlowers: "Szűrt virágok exportálása",
      exportSingleFlower: "Aktuális virág exportálása",
      import: "Importálás",
      sortAz: "Rendezés A-Z",
      sortZa: "Rendezés Z-A",
      filterFlower: "Virág szűrése",
      filterPlaceholder: "Virág szűrése",
      clearFilter: "Szűrés törlése",
      previousFilterMatch: "Előző szűrt virág",
      nextFilterMatch: "Következő szűrt virág",
      searchFlower: "Virág keresése",
      searchPlaceholder: "Virág keresése",
      searchEverywhere: "Keresés mindenhol",
      searchModeNames: "Keresési mód: virágnevek. Váltás mindenhol keresésre.",
      searchModeEverywhere: "Keresési mód: minden adat. Váltás virágnév szerinti keresésre.",
      searchMatchNames: "A(z) „{query}” keresőkifejezés a nevek között található.",
      searchMatchDescriptions: "A(z) „{query}” keresőkifejezés a leírásban található.",
      searchMatchImageInfos: "A(z) „{query}” keresőkifejezés a képinformációk között található.",
      searchMatchLinks: "A(z) „{query}” keresőkifejezés a linkek között található.",
      previousSearchMatch: "Előző találat (Ctrl+↑ mindenhol keresésnél)",
      nextSearchMatch: "Következő találat (Ctrl+↓ mindenhol keresésnél)",
      search: "Keresés",
      clearSearch: "Keresés törlése",
      savedFlowers: "Mentett virágok",
      chooseLanguage: "Nyelv kiválasztása",
      chooseDescriptionLanguage: "Leírás nyelvének kiválasztása",
      flowerData: "Virág adatai",
      cancel: "Mégse",
      save: "Mentés",
      image: "Kép",
      imageNote: "Kötelező mező. A kép helyben, IndexedDB-ben lesz mentve.",
      names: "Nevek",
      magyarName: "Magyar név",
      latinName: "Latin név",
      germanName: "Német név",
      englishName: "Angol név",
      labelHu: "Magyar",
      labelLa: "Latin",
      labelDe: "Német",
      labelEn: "Angol",
      descriptionTitle: "Leírás",
      linksTitle: "Links",
      addLink: "Link hozzáadása",
      moveLinkUp: "Link feljebb",
      moveLinkDown: "Link lejjebb",
      removeLink: "Link törlése",
      linkNameHu: "Magyar linknév",
      linkNameDe: "Német linknév",
      linkNameEn: "Angol linknév",
      linkUrl: "Link címe",
      noLinks: "Nincsenek linkek.",
      formatDescription: "Leírás formázása",
      bold: "Félkövér",
      italic: "Dőlt",
      underline: "Aláhúzott",
      list: "Lista",
      clearFormat: "Formázás törlése",
      color: "Szín",
      textColor: "Szövegszín",
      backgroundColor: "Háttérszín",
      fontFamily: "Betűtípus",
      fontFamilyDefault: "Alapértelmezett",
      fontSize: "Betűméret",
      fontSizeDefault: "Normál",
      noMoreNames: "Nincs további név",
      noFlowersTitle: "Még nincsenek virágok",
      noFlowersText: "Adj hozzá új virágot, vagy importálj egy biztonsági mentést.",
      historyBack: "Előzmények vissza (Ctrl+←)",
      historyForward: "Előzmények előre (Ctrl+→)",
      edit: "Szerkesztés",
      delete: "Törlés",
      previousFlower: "Előző virág (↑, Pos1 = első)",
      nextFlower: "Következő virág (↓, End = utolsó)",
      downloadPdf: "PDF letöltése",
      searchFlowerOnline: "Virág keresése az interneten",
      appInfo: "Információ az alkalmazásról",
      viewOriginalImage: "Eredeti kép megnyitása (Enter)",
      pdfCreating: "PDF készül…",
      missingDescription: "Nincs Leírás.",
      imagePreview: "Kép előnézete",
      addImage: "Kép hozzáadása",
      deleteImage: "Kép törlése",
      favoriteImage: "Kedvenc kép",
      setFavoriteImage: "Beállítás kedvenc képként",
      showThumbnails: "Miniatűrök megjelenítése (T)",
      imageSource: "Kép forrásának megnyitása",
      manageImageSource: "Kép forrásának kezelése",
      imageSourcePrompt: "Kép forráslinkje:",
      noImageSource: "Ehhez a képhez nincs online forrás mentve.",
      imageInfo: "Kép információ",
      editImageInfo: "Kép információ megadása vagy módosítása",
      imageInfoPrompt: "Egysoros információ ehhez a képhez ({language}):",
      onlineSearchTitle: "Virág létrehozása az internetről",
      onlineSearchInputLabel: "Virágnév",
      onlineSearchSelect: "Válassz egy találatot",
      onlineSearchUse: "Kiválasztás",
      onlineSearchCancel: "Mégse",
      onlineSearchHistory: "Korábbi keresések",
      onlineSearchClearHistory: "Előzmények törlése",
      keepOneImage: "Legalább egy képnek meg kell maradnia.",
      imagePrevious: "Előző kép (←)",
      imageNext: "Következő kép (→)",
      imageFirst: "Első kép (Pos1)",
      imageLast: "Utolsó kép (End)",
      selectImageDrop: "Kép kiválasztása / Drag & Drop",
      selectImage: "Kép kiválasztása",
      descriptionPlaceholder: "Leírás megfogalmazása...",
      noSearchMatch: "Nem található megfelelő virág.",
      huRequired: "A magyar név kötelező mező.",
      imageRequired: "Kérlek, válassz ki egy képet.",
      saveFailed: "A virágot nem sikerült menteni.",
      readImageFailed: "A képet nem sikerült beolvasni.",
      dragImageOnly: "Kérlek, képfájlt húzz erre a területre.",
      pasteImageUnavailable: "A vágólapon nincs beilleszthető kép.",
      confirmDelete: "Biztosan törlöd ezt a virágot: \"{name}\"?",
      deleteFailed: "A virágot nem sikerült törölni.",
      dbUnavailableTitle: "Az IndexedDB nem érhető el",
      dbUnavailableText: "Kérlek, nyisd meg az alkalmazást egy aktuális böngészőben, például Microsoft Edge-ben, Google Chrome-ban vagy Firefoxban.",
      dbUnavailableDetails: "Részletek: {details}",
      currentAddress: "Aktuális cím: {address}",
      resetDatabase: "Helyi adatbázis visszaállítása",
      resetDatabaseNote: "Ha az adatbázis sérült, a helyi adatok csak törléssel állíthatók helyre. Exportált mentésfájl később újra importálható.",
      resetDatabaseConfirm: "Töröljük a sérült helyi IndexedDB-adatbázist? A böngészőben tárolt virágadatok elvesznek.",
      resetDatabaseFailed: "A helyi adatbázist nem sikerült törölni.",
      repairDatabaseImport: "Mentés importálása és javítás",
      repairDatabaseNote: "Ha van exportált mentésed, válaszd ki itt. Az alkalmazás új helyi adatbázist hoz létre, és abba importálja a mentést.",
      repairDatabaseConfirm: "Hozzunk létre egy új helyi IndexedDB-adatbázist, és importáljuk ezt a mentést?",
      repairDatabaseDone: "A helyi adatbázis helyreállítása befejeződött. Az alkalmazás újratöltődik.",
      repairDatabaseFailed: "A helyi adatbázist nem sikerült a mentésből helyreállítani.",
      repairDatabaseStorageBroken: "A Chrome jelenleg új IndexedDB-adatbázist sem tud létrehozni ehhez a helyi alkalmazáshoz. Ez általában a Chrome helyi tárolójának sérülését jelenti. Zárd be a Chrome-ot, töröld a webhelyadatokat ehhez a helyi file:// alkalmazáshoz, majd nyisd meg újra az index.html fájlt és importáld a mentést. Microsoft Edge-ben az import továbbra is használható.",
      repairDatabaseReloadImport: "A sérült adatbázis törölve lett. Az alkalmazás újratöltődik; kérlek, válaszd ki újra ugyanazt a mentést az importáláshoz.",
      autoFillUnavailable: "Az automatikus keresés ebben a böngészőben nem érhető el.",
      offline: "Nincs internetkapcsolat. Az adatok kézzel is kitölthetők.",
      lookupSearching: "Nevek online keresése…",
      lookupNoMatch: "Nem találhatók megfelelő online nevek.",
      lookupFoundNoOverwrite: "Online nevek találhatók, a meglévő beírások változatlanok maradnak.",
      lookupAdded: "Automatikusan kiegészítve: {fields}.",
      lookupFailed: "Az online keresés nem lehetséges. Az adatok kézzel is kitölthetők.",
      importQuestion: "Lecseréljük a meglévő adatokat?\n\nOK = csere\nMégse = hozzáadás",
      importReplaceQuestion: "Lecseréljük a meglévő adatokat, vagy hozzáadjuk az importált virágokat?",
      replaceImportData: "Csere",
      addImportData: "Hozzáadás",
      exportFormatQuestion: "Milyen formátumban készüljön az export? A ZIP az alapértelmezett.",
      exportStatus: "Exportálandó virágok száma: {count}.",
      importStatus: "Importálandó virágok száma: {count}.",
      currentLocationSearching: "Hely meghatározása...",
      currentLocationUnavailable: "Hely nem elérhető",
      imageMetadataReading: "Képadatok olvasása...",
      imageMetadataUnavailable: "Nincs dátum, idő vagy hely a kép metaadataiban",
      imageLocationResolving: "Helynév keresése...",
      exportZip: "ZIP",
      exportJson: "JSON",
      importDone: "Importálás befejezve.",
      importFailed: "A mentésfájlt nem sikerült importálni.",
      pdfFailed: "A PDF-fájlt nem sikerült létrehozni.",
      appNamePdf: "Virág leltár"
    },
    de: {
      appTitle: "Blumen-Inventar",
      inventory: "Inventar",
      flowers: "Blumen",
      flowerListLabel: "Blumenliste",
      newFlower: "Neue Blume",
      createOnlineFlower: "Blume aus dem Internet erstellen",
      createOnlineFlowerPrompt: "Bitte gib den Blumen- oder lateinischen Namen ein:",
      createOnlineFlowerPromptHu: "Bitte gib den ungarischen oder lateinischen Blumennamen ein:",
      createOnlineFlowerPromptDe: "Bitte gib den deutschen oder lateinischen Blumennamen ein:",
      createOnlineFlowerPromptEn: "Bitte gib den englischen oder lateinischen Blumennamen ein:",
      createOnlineFlowerSearching: "Online-Daten werden gesucht…",
      createOnlineFlowerDone: "Die Blume wurde mit {count} Bildern angelegt.",
      createOnlineFlowerNoImage: "Es konnte kein geeignetes Bild gefunden werden. Die Blume wurde nicht angelegt.",
      createOnlineFlowerFailed: "Die Blume konnte nicht online erstellt werden.",
      createOnlineFlowerNoMatch: "Es wurde kein passender Online-Treffer gefunden.",
      export: "Exportieren",
      exportAllFlowers: "Alle Blumen exportieren",
      exportFilteredFlowers: "Gefilterte Blumen Exportieren",
      exportSingleFlower: "Aktuelle Blume exportieren",
      import: "Importieren",
      sortAz: "Sortieren A-Z",
      sortZa: "Sortieren Z-A",
      filterFlower: "Blume filtern",
      filterPlaceholder: "Blume filtern",
      clearFilter: "Filter löschen",
      previousFilterMatch: "Vorherige gefilterte Blume",
      nextFilterMatch: "Nächste gefilterte Blume",
      searchFlower: "Blume suchen",
      searchPlaceholder: "Blume suchen",
      searchEverywhere: "Überall suchen",
      searchModeNames: "Suchmodus: Blumennamen. Zu überall suchen wechseln.",
      searchModeEverywhere: "Suchmodus: alle Daten. Zur Suche in Blumennamen wechseln.",
      searchMatchNames: "Suchstring „{query}“ wurde in den Namen gefunden.",
      searchMatchDescriptions: "Suchstring „{query}“ wurde in der Beschreibung gefunden.",
      searchMatchImageInfos: "Suchstring „{query}“ wurde in den Bild-Infos gefunden.",
      searchMatchLinks: "Suchstring „{query}“ wurde in den Links gefunden.",
      previousSearchMatch: "Vorheriger Treffer (Strg+↑ bei Überall suchen)",
      nextSearchMatch: "Nächster Treffer (Strg+↓ bei Überall suchen)",
      search: "Suchen",
      clearSearch: "Suche löschen",
      savedFlowers: "Gespeicherte Blumen",
      chooseLanguage: "Sprache wählen",
      chooseDescriptionLanguage: "Beschreibungssprache wählen",
      flowerData: "Blumendaten",
      cancel: "Abbrechen",
      save: "Speichern",
      image: "Bild",
      imageNote: "Pflichtfeld. Das Bild wird lokal in IndexedDB gespeichert.",
      names: "Namen",
      magyarName: "Ungarischer Name",
      latinName: "Latein Name",
      germanName: "Deutscher Name",
      englishName: "English Name",
      labelHu: "Magyar",
      labelLa: "Latein",
      labelDe: "Deutsch",
      labelEn: "English",
      descriptionTitle: "Beschreibung",
      linksTitle: "Links",
      addLink: "Link hinzufügen",
      moveLinkUp: "Link nach oben",
      moveLinkDown: "Link nach unten",
      removeLink: "Link entfernen",
      linkNameHu: "Ungarischer Linkname",
      linkNameDe: "Deutscher Linkname",
      linkNameEn: "Englischer Linkname",
      linkUrl: "Link-Adresse",
      noLinks: "Keine Links vorhanden.",
      formatDescription: "Beschreibung formatieren",
      bold: "Fett",
      italic: "Kursiv",
      underline: "Unterstrichen",
      list: "Liste",
      clearFormat: "Format löschen",
      color: "Farbe",
      textColor: "Textfarbe",
      backgroundColor: "Hintergrundfarbe",
      fontFamily: "Schriftart",
      fontFamilyDefault: "Standard",
      fontSize: "Schriftgröße",
      fontSizeDefault: "Normal",
      noMoreNames: "Keine weiteren Namen",
      noFlowersTitle: "Noch keine Blumen",
      noFlowersText: "Füge eine neue Blume hinzu oder importiere eine Sicherungsdatei.",
      historyBack: "Historie zurück (Strg+←)",
      historyForward: "Historie vor (Strg+→)",
      edit: "Bearbeiten",
      delete: "Löschen",
      previousFlower: "Vorherige Blume (↑, Pos1 = erste)",
      nextFlower: "Nächste Blume (↓, Ende = letzte)",
      downloadPdf: "PDF herunterladen",
      searchFlowerOnline: "Blume im Internet suchen",
      appInfo: "Informationen über diese App",
      viewOriginalImage: "Originalbild anzeigen (Enter)",
      pdfCreating: "PDF wird erstellt…",
      missingDescription: "Keine Beschreibung vorhanden.",
      imagePreview: "Bildvorschau",
      addImage: "Bild hinzufügen",
      deleteImage: "Bild löschen",
      favoriteImage: "Lieblingsbild",
      setFavoriteImage: "Als Lieblingsbild markieren",
      showThumbnails: "Thumbnails anzeigen (T)",
      imageSource: "Bildquelle öffnen",
      manageImageSource: "Bildquelle verwalten",
      imageSourcePrompt: "Link zur Bildquelle:",
      noImageSource: "Für dieses Bild ist keine Online-Quelle gespeichert.",
      imageInfo: "Bild-Info",
      editImageInfo: "Bild-Info eingeben oder ändern",
      imageInfoPrompt: "Einzeilige Info zu diesem Bild ({language}):",
      onlineSearchTitle: "Blume aus dem Internet erstellen",
      onlineSearchInputLabel: "Blumenname",
      onlineSearchSelect: "Wähle einen Treffer",
      onlineSearchUse: "Auswählen",
      onlineSearchCancel: "Abbrechen",
      onlineSearchHistory: "Bisherige Eingaben",
      onlineSearchClearHistory: "Historie löschen",
      keepOneImage: "Mindestens ein Bild muss erhalten bleiben.",
      imagePrevious: "Vorheriges Bild (←)",
      imageNext: "Nächstes Bild (→)",
      imageFirst: "Erstes Bild (Pos1)",
      imageLast: "Letztes Bild (Ende)",
      selectImageDrop: "Bild auswählen / Drag & Drop",
      selectImage: "Bild auswählen",
      descriptionPlaceholder: "Beschreibung formulieren...",
      noSearchMatch: "Keine passende Blume gefunden.",
      huRequired: "Der ungarische Name ist ein Pflichtfeld.",
      imageRequired: "Bitte wähle ein Bild aus.",
      saveFailed: "Die Blume konnte nicht gespeichert werden.",
      readImageFailed: "Das Bild konnte nicht gelesen werden.",
      dragImageOnly: "Bitte ziehe eine Bilddatei in diesen Bereich.",
      pasteImageUnavailable: "In der Zwischenablage ist kein einfügbares Bild.",
      confirmDelete: "Soll die Blume \"{name}\" wirklich gelöscht werden?",
      deleteFailed: "Die Blume konnte nicht gelöscht werden.",
      dbUnavailableTitle: "IndexedDB ist nicht verfügbar",
      dbUnavailableText: "Bitte öffne die Anwendung in einem aktuellen Browser wie Microsoft Edge, Google Chrome oder Firefox.",
      dbUnavailableDetails: "Details: {details}",
      currentAddress: "Aktuelle Adresse: {address}",
      resetDatabase: "Lokale Datenbank zurücksetzen",
      resetDatabaseNote: "Wenn die Datenbank beschädigt ist, kann sie nur durch Löschen der lokalen Daten wiederhergestellt werden. Eine exportierte Sicherungsdatei kann danach wieder importiert werden.",
      resetDatabaseConfirm: "Soll die beschädigte lokale IndexedDB-Datenbank gelöscht werden? Die im Browser gespeicherten Blumendaten gehen verloren.",
      resetDatabaseFailed: "Die lokale Datenbank konnte nicht gelöscht werden.",
      repairDatabaseImport: "Sicherung importieren und reparieren",
      repairDatabaseNote: "Wenn du eine exportierte Sicherung hast, wähle sie hier aus. Die Anwendung erstellt eine neue lokale Datenbank und importiert die Sicherung dorthin.",
      repairDatabaseConfirm: "Soll eine neue lokale IndexedDB-Datenbank erstellt und diese Sicherung importiert werden?",
      repairDatabaseDone: "Die lokale Datenbank wurde aus der Sicherung wiederhergestellt. Die Anwendung wird neu geladen.",
      repairDatabaseFailed: "Die lokale Datenbank konnte nicht aus der Sicherung wiederhergestellt werden.",
      repairDatabaseStorageBroken: "Chrome kann für diese lokale Anwendung derzeit auch keine neue IndexedDB-Datenbank erstellen. Das bedeutet meistens, dass Chromes lokaler Speicher für file://-Seiten beschädigt ist. Bitte Chrome schließen, die Websitedaten für diese lokale file://-Anwendung löschen, danach index.html erneut öffnen und die Sicherung importieren. In Microsoft Edge kann der Import weiterhin verwendet werden.",
      repairDatabaseReloadImport: "Die beschädigte Datenbank wurde gelöscht. Die Anwendung wird neu geladen; bitte wähle danach dieselbe Sicherung erneut zum Import aus.",
      autoFillUnavailable: "Automatische Ermittlung ist in diesem Browser nicht verfügbar.",
      offline: "Keine Internetverbindung. Eingaben können manuell ergänzt werden.",
      lookupSearching: "Namen werden online gesucht…",
      lookupNoMatch: "Keine passenden Online-Namen gefunden.",
      lookupFoundNoOverwrite: "Online-Namen gefunden, vorhandene Eingaben bleiben unverändert.",
      lookupAdded: "Automatisch ergänzt: {fields}.",
      lookupFailed: "Online-Ermittlung nicht möglich. Eingaben können manuell ergänzt werden.",
      importQuestion: "Sollen die bestehenden Daten ersetzt werden?\n\nOK = ersetzen\nAbbrechen = ergänzen",
      importReplaceQuestion: "Sollen die bestehenden Daten ersetzt oder die importierten Blumen ergänzt werden?",
      replaceImportData: "Ersetzen",
      addImportData: "Ergänzen",
      exportFormatQuestion: "In welchem Format soll exportiert werden? ZIP ist voreingestellt.",
      exportStatus: "Zu exportierende Blumen: {count}.",
      importStatus: "Zu importierende Blumen: {count}.",
      currentLocationSearching: "Ort wird ermittelt...",
      currentLocationUnavailable: "Ort nicht verfügbar",
      imageMetadataReading: "Bild-Metadaten werden gelesen...",
      imageMetadataUnavailable: "Kein Datum, keine Uhrzeit oder kein Ort in den Bild-Metadaten",
      imageLocationResolving: "Ortsname wird ermittelt...",
      exportZip: "ZIP",
      exportJson: "JSON",
      importDone: "Import abgeschlossen.",
      importFailed: "Die Sicherungsdatei konnte nicht importiert werden.",
      pdfFailed: "Die PDF-Datei konnte nicht erstellt werden.",
      appNamePdf: "Blumen-Inventar"
    },
    en: {
      appTitle: "Flower Inventory",
      inventory: "Inventory",
      flowers: "Flowers",
      flowerListLabel: "Flower list",
      newFlower: "New flower",
      createOnlineFlower: "Create flower from the internet",
      createOnlineFlowerPrompt: "Enter the flower or Latin name:",
      createOnlineFlowerPromptHu: "Enter the Hungarian or Latin flower name:",
      createOnlineFlowerPromptDe: "Enter the German or Latin flower name:",
      createOnlineFlowerPromptEn: "Enter the English or Latin flower name:",
      createOnlineFlowerSearching: "Searching online data…",
      createOnlineFlowerDone: "The flower was created with {count} images.",
      createOnlineFlowerNoImage: "No suitable image could be found. The flower was not created.",
      createOnlineFlowerFailed: "The flower could not be created online.",
      createOnlineFlowerNoMatch: "No matching online result was found.",
      export: "Export",
      exportAllFlowers: "Export all flowers",
      exportFilteredFlowers: "Export filtered flowers",
      exportSingleFlower: "Export current flower",
      import: "Import",
      sortAz: "Sort A-Z",
      sortZa: "Sort Z-A",
      filterFlower: "Filter flower",
      filterPlaceholder: "Filter flower",
      clearFilter: "Clear filter",
      previousFilterMatch: "Previous filtered flower",
      nextFilterMatch: "Next filtered flower",
      searchFlower: "Search flower",
      searchPlaceholder: "Search flower",
      searchEverywhere: "Search everywhere",
      searchModeNames: "Search mode: flower names. Switch to search everywhere.",
      searchModeEverywhere: "Search mode: all data. Switch to flower-name search.",
      searchMatchNames: "Search string “{query}” was found in the names.",
      searchMatchDescriptions: "Search string “{query}” was found in the description.",
      searchMatchImageInfos: "Search string “{query}” was found in the image information.",
      searchMatchLinks: "Search string “{query}” was found in the links.",
      previousSearchMatch: "Previous match (Ctrl+↑ in search everywhere)",
      nextSearchMatch: "Next match (Ctrl+↓ in search everywhere)",
      search: "Search",
      clearSearch: "Clear search",
      savedFlowers: "Saved flowers",
      chooseLanguage: "Choose language",
      chooseDescriptionLanguage: "Choose description language",
      flowerData: "Flower data",
      cancel: "Cancel",
      save: "Save",
      image: "Image",
      imageNote: "Required field. The image is stored locally in IndexedDB.",
      names: "Names",
      magyarName: "Hungarian name",
      latinName: "Latin name",
      germanName: "German name",
      englishName: "English name",
      labelHu: "Hungarian",
      labelLa: "Latin",
      labelDe: "German",
      labelEn: "English",
      descriptionTitle: "Description",
      linksTitle: "Links",
      addLink: "Add link",
      moveLinkUp: "Move link up",
      moveLinkDown: "Move link down",
      removeLink: "Remove link",
      linkNameHu: "Hungarian link name",
      linkNameDe: "German link name",
      linkNameEn: "English link name",
      linkUrl: "Link address",
      noLinks: "No links available.",
      formatDescription: "Format description",
      bold: "Bold",
      italic: "Italic",
      underline: "Underline",
      list: "List",
      clearFormat: "Clear format",
      color: "Color",
      textColor: "Text color",
      backgroundColor: "Background color",
      fontFamily: "Font",
      fontFamilyDefault: "Default",
      fontSize: "Font size",
      fontSizeDefault: "Normal",
      noMoreNames: "No other names",
      noFlowersTitle: "No flowers yet",
      noFlowersText: "Add a new flower or import a backup file.",
      historyBack: "History back (Ctrl+←)",
      historyForward: "History forward (Ctrl+→)",
      edit: "Edit",
      delete: "Delete",
      previousFlower: "Previous flower (↑, Home = first)",
      nextFlower: "Next flower (↓, End = last)",
      downloadPdf: "Download PDF",
      searchFlowerOnline: "Search flower online",
      appInfo: "Information about this app",
      viewOriginalImage: "Show original image (Enter)",
      pdfCreating: "Creating PDF…",
      missingDescription: "No description available.",
      imagePreview: "Image preview",
      addImage: "Add image",
      deleteImage: "Delete image",
      favoriteImage: "Favorite image",
      setFavoriteImage: "Mark as favorite image",
      showThumbnails: "Show thumbnails (T)",
      imageSource: "Open image source",
      manageImageSource: "Manage image source",
      imageSourcePrompt: "Image source link:",
      noImageSource: "No online source is stored for this image.",
      imageInfo: "Image info",
      editImageInfo: "Enter or edit image info",
      imageInfoPrompt: "One-line info for this image ({language}):",
      onlineSearchTitle: "Create flower from the internet",
      onlineSearchInputLabel: "Flower name",
      onlineSearchSelect: "Choose a result",
      onlineSearchUse: "Choose",
      onlineSearchCancel: "Cancel",
      onlineSearchHistory: "Previous entries",
      onlineSearchClearHistory: "Clear history",
      keepOneImage: "At least one image must remain.",
      imagePrevious: "Previous image (←)",
      imageNext: "Next image (→)",
      imageFirst: "First image (Home)",
      imageLast: "Last image (End)",
      selectImageDrop: "Choose image / Drag & Drop",
      selectImage: "Choose image",
      descriptionPlaceholder: "Write description...",
      noSearchMatch: "No matching flower found.",
      huRequired: "The Hungarian name is required.",
      imageRequired: "Please choose an image.",
      saveFailed: "The flower could not be saved.",
      readImageFailed: "The image could not be read.",
      dragImageOnly: "Please drop an image file into this area.",
      pasteImageUnavailable: "The clipboard does not contain an image that can be pasted.",
      confirmDelete: "Really delete the flower \"{name}\"?",
      deleteFailed: "The flower could not be deleted.",
      dbUnavailableTitle: "IndexedDB is not available",
      dbUnavailableText: "Please open the app in a current browser such as Microsoft Edge, Google Chrome, or Firefox.",
      dbUnavailableDetails: "Details: {details}",
      currentAddress: "Current address: {address}",
      resetDatabase: "Reset local database",
      resetDatabaseNote: "If the database is corrupted, it can only be recovered by deleting the local data. An exported backup file can be imported afterwards.",
      resetDatabaseConfirm: "Delete the corrupted local IndexedDB database? Flower data stored in the browser will be lost.",
      resetDatabaseFailed: "The local database could not be deleted.",
      repairDatabaseImport: "Import backup and repair",
      repairDatabaseNote: "If you have an exported backup, select it here. The app will create a new local database and import the backup there.",
      repairDatabaseConfirm: "Create a new local IndexedDB database and import this backup?",
      repairDatabaseDone: "The local database was restored from the backup. The app will reload.",
      repairDatabaseFailed: "The local database could not be restored from the backup.",
      repairDatabaseStorageBroken: "Chrome currently cannot create a new IndexedDB database for this local app either. This usually means Chrome's local storage for file:// pages is corrupted. Close Chrome, clear the site data for this local file:// app, then reopen index.html and import the backup. Microsoft Edge can still be used for importing.",
      repairDatabaseReloadImport: "The corrupted database was deleted. The app will reload; please select the same backup again for import.",
      autoFillUnavailable: "Automatic lookup is not available in this browser.",
      offline: "No internet connection. Entries can be completed manually.",
      lookupSearching: "Searching names online…",
      lookupNoMatch: "No matching online names found.",
      lookupFoundNoOverwrite: "Online names found; existing entries remain unchanged.",
      lookupAdded: "Automatically added: {fields}.",
      lookupFailed: "Online lookup is not possible. Entries can be completed manually.",
      importQuestion: "Replace existing data?\n\nOK = replace\nCancel = add",
      importReplaceQuestion: "Replace the existing data or add the imported flowers?",
      replaceImportData: "Replace",
      addImportData: "Add",
      exportFormatQuestion: "Which format should be used for export? ZIP is the default.",
      exportStatus: "Flowers to export: {count}.",
      importStatus: "Flowers to import: {count}.",
      currentLocationSearching: "Finding location...",
      currentLocationUnavailable: "Location unavailable",
      imageMetadataReading: "Reading image metadata...",
      imageMetadataUnavailable: "No date, time, or location in image metadata",
      imageLocationResolving: "Resolving place name...",
      exportZip: "ZIP",
      exportJson: "JSON",
      importDone: "Import completed.",
      importFailed: "The backup file could not be imported.",
      pdfFailed: "The PDF file could not be created.",
      appNamePdf: "Flower Inventory"
    }
  };

  var elements = {
    addFlowerButton: document.getElementById("addFlowerButton"),
    createOnlineFlowerButton: document.getElementById("createOnlineFlowerButton"),
    sortFlowersButton: document.getElementById("sortFlowersButton"),
    sortFlowersIcon: document.getElementById("sortFlowersIcon"),
    sortFlowersLabel: document.getElementById("sortFlowersLabel"),
    exportButton: document.getElementById("exportButton"),
    importButton: document.getElementById("importButton"),
    importFileInput: document.getElementById("importFileInput"),
    searchForm: document.getElementById("searchForm"),
    filterInput: document.getElementById("filterInput"),
    clearFilterButton: document.getElementById("clearFilterButton"),
    filterPreviousButton: document.getElementById("filterPreviousButton"),
    filterNextButton: document.getElementById("filterNextButton"),
    searchInput: document.getElementById("searchInput"),
    searchModeButton: document.getElementById("searchModeButton"),
    searchModeIcon: document.getElementById("searchModeIcon"),
    clearSearchButton: document.getElementById("clearSearchButton"),
    searchPreviousButton: document.getElementById("searchPreviousButton"),
    searchNextButton: document.getElementById("searchNextButton"),
    searchMessage: document.getElementById("searchMessage"),
    flowerList: document.getElementById("flowerList"),
    detailView: document.getElementById("detailView"),
    topDetailActions: document.getElementById("topDetailActions"),
    flowerForm: document.getElementById("flowerForm"),
    formModeLabel: document.getElementById("formModeLabel"),
    imagePreview: document.getElementById("imagePreview"),
    imageInput: document.getElementById("imageInput"),
    nameHu: document.getElementById("nameHu"),
    nameLa: document.getElementById("nameLa"),
    nameDe: document.getElementById("nameDe"),
    nameEn: document.getElementById("nameEn"),
    descriptionEditor: document.getElementById("descriptionEditor"),
    descriptionColorInput: document.getElementById("descriptionColorInput"),
    descriptionBackgroundColorInput: document.getElementById("descriptionBackgroundColorInput"),
    descriptionFontFamilySelect: document.getElementById("descriptionFontFamilySelect"),
    descriptionFontSizeSelect: document.getElementById("descriptionFontSizeSelect"),
    descriptionLanguageTabs: document.querySelector(".description-language-tabs"),
    addLinkButton: document.getElementById("addLinkButton"),
    linksEditorList: document.getElementById("linksEditorList"),
    editorToolbar: document.querySelector(".editor-toolbar"),
    languageSwitcher: document.querySelector(".language-switcher"),
    autoFillStatus: document.getElementById("autoFillStatus"),
    formError: document.getElementById("formError"),
    cancelButton: document.getElementById("cancelButton")
  };

  var demoFlowers = [
    {
      id: "demo-levendula",
      names: {
        hu: "Levendula",
        la: "Lavandula angustifolia",
        de: "Lavendel",
        en: "Lavender"
      },
      description: {
        hu: "Illatos kerti növény lila virágokkal és intenzív aromával.",
        de: "Eine aromatische Gartenpflanze mit violetten Blüten und intensivem Duft.",
        en: "An aromatic garden plant with purple flowers and an intense fragrance."
      },
      links: [
        {
          id: "demo-link-levendula",
          names: { hu: "Wikipédia", de: "Wikipedia", en: "Wikipedia" },
          url: "https://de.wikipedia.org/wiki/Echter_Lavendel"
        }
      ],
      imageData: svgImage("#7b5db7", "#d9cff6", "Levendula")
    },
    {
      id: "demo-rozsa",
      names: {
        hu: "Rózsa",
        la: "Rosa",
        de: "Rose",
        en: "Rose"
      },
      description: {
        hu: "Klasszikus dísznövény sok fajtával, színnel és virágformával.",
        de: "Klassische Zierpflanze mit vielen Sorten, Farben und Blütenformen.",
        en: "A classic ornamental plant with many varieties, colors, and flower shapes."
      },
      links: [],
      imageData: svgImage("#c93f5d", "#ffe0e7", "Rózsa")
    },
    {
      id: "demo-tulipan",
      names: {
        hu: "Tulipán",
        la: "Tulipa",
        de: "Tulpe",
        en: "Tulip"
      },
      description: {
        hu: "Tavaszi virág jellegzetes kehelyformával, ágyásokban és vágott virágként is kedvelt.",
        de: "Frühlingsblume mit markanter Kelchform, beliebt in Beeten und Schnittblumensträußen.",
        en: "A spring flower with a distinctive cup shape, popular in beds and bouquets."
      },
      links: [],
      imageData: svgImage("#e05f2f", "#ffe8d6", "Tulipán")
    }
  ];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    applyLanguage();
    openDatabase()
      .then(function (db) {
        state.db = db;
        bindEvents();
        return loadFlowers();
      })
      .then(function () {
        return seedDemoFlowersIfNeeded();
      })
      .then(function () {
        setSelectedFlower(state.flowers[0] ? state.flowers[0].id : null, {
          replaceHistory: true
        });
        render();
        resumePendingRepairImport();
      })
      .catch(function (error) {
        showFatalError(error);
      });
  }

  function bindEvents() {
    elements.addFlowerButton.addEventListener("click", function () {
      openForm();
    });
    elements.createOnlineFlowerButton.addEventListener("click", createFlowerFromInternet);

    elements.sortFlowersButton.addEventListener("click", function () {
      toggleSortDirection();
    });

    elements.languageSwitcher.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-lang]");
      if (!button) {
        return;
      }

      setLanguage(button.dataset.lang, { syncDescriptionLanguage: true });
    });

    elements.descriptionLanguageTabs.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-description-lang]");
      if (!button) {
        return;
      }

      setDescriptionLanguage(button.dataset.descriptionLang);
    });
    elements.addLinkButton.addEventListener("click", function () {
      addLinkEditorRow();
    });

    elements.cancelButton.addEventListener("click", function () {
      closeForm();
      render();
    });

    elements.flowerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      saveFlowerFromForm();
    });

    elements.nameLa.addEventListener("input", scheduleAutoFillFromLatin);
    elements.nameLa.addEventListener("blur", function () {
      autoFillNamesFromLatin(false);
    });
    elements.editorToolbar.addEventListener("mousedown", function (event) {
      if (event.target.closest("button")) {
        event.preventDefault();
      }
    });
    elements.descriptionLanguageTabs.addEventListener("mousedown", function (event) {
      if (event.target.closest("button[data-description-lang]")) {
        event.preventDefault();
      }
    });
    elements.editorToolbar.addEventListener("click", handleEditorToolbarClick);
    ["keyup", "mouseup", "input", "focus"].forEach(function (eventName) {
      elements.descriptionEditor.addEventListener(eventName, saveEditorSelection);
    });
    elements.descriptionFontFamilySelect.addEventListener("change", function () {
      if (elements.descriptionFontFamilySelect.value) {
        formatDescription("fontName", elements.descriptionFontFamilySelect.value);
        elements.descriptionFontFamilySelect.value = "";
      }
    });
    elements.descriptionFontSizeSelect.addEventListener("change", function () {
      if (elements.descriptionFontSizeSelect.value) {
        formatDescription("fontSize", elements.descriptionFontSizeSelect.value);
        elements.descriptionFontSizeSelect.value = "";
      }
    });
    elements.descriptionColorInput.addEventListener("input", function () {
      formatDescription("foreColor", elements.descriptionColorInput.value);
    });
    elements.descriptionBackgroundColorInput.addEventListener("input", function () {
      formatDescription("hiliteColor", elements.descriptionBackgroundColorInput.value);
    });

    elements.imageInput.addEventListener("change", function (event) {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      useImageFiles(event.target.files);
    });
    elements.imagePreview.addEventListener("dragenter", handleImageDrag);
    elements.imagePreview.addEventListener("dragover", handleImageDrag);
    elements.imagePreview.addEventListener("dragleave", function () {
      elements.imagePreview.classList.remove("drag-over");
    });
    elements.imagePreview.addEventListener("drop", handleImageDrop);

    elements.exportButton.addEventListener("click", exportFlowers);
    elements.importButton.addEventListener("click", chooseImportFile);
    elements.importFileInput.addEventListener("change", importFlowers);

    elements.searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      applyFilterAndSearch(0);
    });

    elements.filterInput.addEventListener("input", function () {
      updateFilterClearButton();
      applyFilterAndSearch(0);
    });

    elements.searchInput.addEventListener("input", function () {
      updateSearchClearButton();
      applyFilterAndSearch(0);
    });

    elements.searchModeButton.addEventListener("click", function () {
      state.searchMode = state.searchMode === "names" ? "everywhere" : "names";
      updateSearchModeButton();
      applyFilterAndSearch(0);
      elements.searchInput.focus();
    });

    elements.clearSearchButton.addEventListener("click", function () {
      elements.searchInput.value = "";
      elements.searchMessage.textContent = "";
      updateSearchClearButton();
      applyFilterAndSearch(0);
      elements.searchInput.focus();
    });

    elements.clearFilterButton.addEventListener("click", function () {
      elements.filterInput.value = "";
      elements.searchMessage.textContent = "";
      updateFilterClearButton();
      applyFilterAndSearch(0);
      elements.filterInput.focus();
    });

    elements.filterPreviousButton.addEventListener("click", function () {
      applyFilterNavigation(-1);
    });

    elements.filterNextButton.addEventListener("click", function () {
      applyFilterNavigation(1);
    });

    elements.searchPreviousButton.addEventListener("click", function () {
      applyFilterAndSearch(-1);
    });

    elements.searchNextButton.addEventListener("click", function () {
      applyFilterAndSearch(1);
    });

    window.addEventListener("resize", function () {
      var heading = elements.detailView.querySelector(".detail-content h2");
      if (heading) {
        heading.style.fontSize = getTitleFontSize(heading.textContent);
        fitHeadingToOneLine(heading);
      }
    });

    document.addEventListener("keydown", handleGlobalEscapeKey);
    document.addEventListener("keydown", handleLanguageShortcutKeys);
    document.addEventListener("keydown", handleDetailArrowKeys);
    document.addEventListener("paste", handleClipboardPaste);
  }

  function handleGlobalEscapeKey(event) {
    if (event.key !== "Escape") {
      return;
    }
    if (document.querySelector(".online-search-overlay") || document.querySelector(".thumbnail-overlay") || document.querySelector(".choice-dialog")) {
      return;
    }
    if (document.querySelector(".original-image-overlay")) {
      event.preventDefault();
      closeOriginalImageOverlay();
      return;
    }
    if (state.editingId !== null) {
      event.preventDefault();
      closeForm();
      render();
    }
  }

  function handleLanguageShortcutKeys(event) {
    if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
      return;
    }
    var languageByKey = {
      m: "hu",
      d: "de",
      e: "en"
    };
    var language = languageByKey[String(event.key || "").toLowerCase()];
    if (!language) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    setLanguage(language, { syncDescriptionLanguage: true });
  }

  function handleDetailArrowKeys(event) {
    if (shouldIgnoreDetailArrowKey(event)) {
      return;
    }
    if (event.ctrlKey && event.key === "ArrowLeft") {
      event.preventDefault();
      navigateDetailHistory(-1);
      return;
    }
    if (event.ctrlKey && event.key === "ArrowRight") {
      event.preventDefault();
      navigateDetailHistory(1);
      return;
    }
    if (event.ctrlKey && event.key === "ArrowUp") {
      event.preventDefault();
      applyFilterAndSearch(-1);
      return;
    }
    if (event.ctrlKey && event.key === "ArrowDown") {
      event.preventDefault();
      applyFilterAndSearch(1);
      return;
    }
    if (event.ctrlKey && event.key === "Home") {
      event.preventDefault();
      selectFlowerEdge("first");
      return;
    }
    if (event.ctrlKey && event.key === "End") {
      event.preventDefault();
      selectFlowerEdge("last");
      return;
    }
    if (!event.ctrlKey && event.key.toLowerCase() === "t") {
      event.preventDefault();
      openThumbnailChooserForSelectedFlower();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      openOriginalImageForSelectedFlower();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectCurrentFlowerImageByOffset(-1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectCurrentFlowerImageByOffset(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      selectFlowerByOffset(-1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectFlowerByOffset(1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      selectCurrentFlowerImageEdge("first");
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      selectCurrentFlowerImageEdge("last");
    }
  }

  function shouldIgnoreDetailArrowKey(event) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter"].includes(event.key) && event.key.toLowerCase() !== "t") {
      return true;
    }
    var isHistoryShortcut = event.ctrlKey && (event.key === "ArrowLeft" || event.key === "ArrowRight");
    var isFlowerEdgeShortcut = event.ctrlKey && (event.key === "Home" || event.key === "End");
    var isThumbnailShortcut = !event.ctrlKey && event.key.toLowerCase() === "t";
    var isEverywhereSearchShortcut = event.ctrlKey && (event.key === "ArrowUp" || event.key === "ArrowDown") && state.searchMode === "everywhere" && normalizeSearchText(elements.searchInput.value);
    if (event.altKey || event.metaKey || event.shiftKey || (event.ctrlKey && !isHistoryShortcut && !isFlowerEdgeShortcut && !isThumbnailShortcut && !isEverywhereSearchShortcut)) {
      return true;
    }
    if (!state.selectedId || state.editingId || elements.detailView.classList.contains("hidden")) {
      return true;
    }
    if (document.querySelector(".online-search-overlay") || document.querySelector(".thumbnail-overlay")) {
      return true;
    }
    return isTextEditingTarget(event.target);
  }

  function isTextEditingTarget(target) {
    if (!target || target === document.body) {
      return false;
    }
    var tagName = target.tagName ? target.tagName.toLowerCase() : "";
    return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
  }

  function setLanguage(language, options) {
    if (!translations[language]) {
      return;
    }

    state.language = language;
    localStorage.setItem("flowerInventoryLanguage", language);
    if (options && options.syncDescriptionLanguage && state.editingId !== null) {
      setDescriptionLanguage(language, { keepFocus: true });
    }
    sortFlowers();
    applyLanguage();
    render();
  }

  function applyLanguage() {
    document.documentElement.lang = state.language;
    document.title = t("appTitle");

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      node.textContent = t(node.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (node) {
      node.dataset.i18nAttr.split(";").forEach(function (entry) {
        var parts = entry.split(":");
        if (parts.length === 2) {
          node.setAttribute(parts[0], t(parts[1]));
        }
      });
    });

    elements.languageSwitcher.querySelectorAll("button[data-lang]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.lang === state.language);
    });
    updateDescriptionLanguageTabs();
    elements.descriptionEditor.setAttribute("data-placeholder", t("descriptionPlaceholder"));
    if (state.editingId !== null) {
      elements.formModeLabel.textContent = state.editingId ? t("edit") : t("newFlower");
    }
    if (!state.pendingImageData && elements.imagePreview.classList.contains("empty")) {
      renderImagePreview([]);
    }
    updateLinkEditorLabels();
    updateSortButton();
    updateExportButton();
    elements.filterPreviousButton.title = t("previousFilterMatch");
    elements.filterPreviousButton.setAttribute("aria-label", t("previousFilterMatch"));
    elements.filterNextButton.title = t("nextFilterMatch");
    elements.filterNextButton.setAttribute("aria-label", t("nextFilterMatch"));
    elements.searchPreviousButton.title = t("previousSearchMatch");
    elements.searchPreviousButton.setAttribute("aria-label", t("previousSearchMatch"));
    elements.searchNextButton.title = t("nextSearchMatch");
    elements.searchNextButton.setAttribute("aria-label", t("nextSearchMatch"));
    updateSearchModeButton();

    elements.searchMessage.textContent = "";
    updateFilterClearButton();
    updateSearchClearButton();
    updateFilterStepButtons();
    updateSearchStepButtons();
    setAutoFillStatus("");
  }

  function updateFilterClearButton() {
    elements.clearFilterButton.classList.toggle("hidden", !elements.filterInput.value);
    updateExportButton();
  }

  function updateExportButton() {
    var label = t(normalizeSearchText(elements.filterInput.value) ? "exportFilteredFlowers" : "exportAllFlowers");
    elements.exportButton.title = label;
    elements.exportButton.setAttribute("aria-label", label);
    var text = elements.exportButton.querySelector("span");
    if (text) {
      text.textContent = label;
    }
  }

  function updateSearchClearButton() {
    elements.clearSearchButton.classList.toggle("hidden", !elements.searchInput.value);
  }

  function updateSearchModeButton() {
    var searchesEverywhere = state.searchMode === "everywhere";
    var label = t(searchesEverywhere ? "searchModeEverywhere" : "searchModeNames");
    elements.searchModeIcon.src = searchesEverywhere ? "icon-search-everywhere-upload.png" : "icon-search-flower-upload.png";
    elements.searchInput.placeholder = t(searchesEverywhere ? "searchEverywhere" : "searchPlaceholder");
    elements.searchModeButton.title = label;
    elements.searchModeButton.setAttribute("aria-label", label);
    elements.searchModeButton.setAttribute("aria-pressed", searchesEverywhere ? "true" : "false");
  }

  function setDescriptionLanguage(language, options) {
    if (!translations[language] || language === state.descriptionLanguage) {
      return;
    }

    saveCurrentDescriptionDraft();
    state.descriptionLanguage = language;
    elements.descriptionEditor.innerHTML = state.descriptionDrafts[language] || "";
    state.editorRange = null;
    updateDescriptionLanguageTabs();
    if (!options || !options.keepFocus) {
      elements.descriptionEditor.focus();
    }
  }

  function updateDescriptionLanguageTabs() {
    elements.descriptionLanguageTabs.querySelectorAll("button[data-description-lang]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.descriptionLang === state.descriptionLanguage);
    });
  }

  function saveCurrentDescriptionDraft() {
    state.descriptionDrafts[state.descriptionLanguage] = sanitizeDescriptionHtml(elements.descriptionEditor.innerHTML);
  }

  function renderLinksEditor(links) {
    elements.linksEditorList.innerHTML = "";
    normalizeLinks(links).forEach(function (link) {
      addLinkEditorRow(link);
    });
    updateLinkEditorLabels();
  }

  function addLinkEditorRow(link) {
    var normalizedLink = link || {
      id: createId(),
      names: { hu: "", de: "", en: "" },
      url: ""
    };
    var row = document.createElement("div");
    row.className = "link-editor-row";
    row.dataset.linkId = normalizedLink.id || createId();

    row.appendChild(createLinkInput("hu", t("linkNameHu"), normalizedLink.names.hu));
    row.appendChild(createLinkInput("de", t("linkNameDe"), normalizedLink.names.de));
    row.appendChild(createLinkInput("en", t("linkNameEn"), normalizedLink.names.en));
    row.appendChild(createLinkInput("url", t("linkUrl"), normalizedLink.url));

    var actions = document.createElement("div");
    actions.className = "link-editor-actions";

    var moveUpButton = document.createElement("button");
    moveUpButton.type = "button";
    moveUpButton.className = "link-move-button";
    moveUpButton.dataset.linkMove = "up";
    moveUpButton.appendChild(createIconImage("icon-prev.png"));
    moveUpButton.title = t("moveLinkUp");
    moveUpButton.setAttribute("aria-label", t("moveLinkUp"));
    moveUpButton.addEventListener("click", function () {
      moveLinkRow(row, -1);
    });

    var moveDownButton = document.createElement("button");
    moveDownButton.type = "button";
    moveDownButton.className = "link-move-button";
    moveDownButton.dataset.linkMove = "down";
    moveDownButton.appendChild(createIconImage("icon-next.png"));
    moveDownButton.title = t("moveLinkDown");
    moveDownButton.setAttribute("aria-label", t("moveLinkDown"));
    moveDownButton.addEventListener("click", function () {
      moveLinkRow(row, 1);
    });

    var removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "danger";
    removeButton.dataset.linkRemove = "true";
    removeButton.textContent = t("removeLink");
    removeButton.addEventListener("click", function () {
      row.remove();
      updateLinkMoveButtons();
    });
    actions.appendChild(moveUpButton);
    actions.appendChild(moveDownButton);
    actions.appendChild(removeButton);
    row.appendChild(actions);
    elements.linksEditorList.appendChild(row);
    updateLinkMoveButtons();
  }

  function createLinkInput(field, labelText, value) {
    var label = document.createElement("label");
    label.className = "link-input-field link-input-" + field;
    var labelSpan = document.createElement("span");
    labelSpan.dataset.linkLabel = field;
    labelSpan.title = labelText;
    labelSpan.setAttribute("aria-label", labelText);
    labelSpan.appendChild(createLinkLabelIcon(field));
    var input = document.createElement("input");
    input.dataset.linkField = field;
    input.type = field === "url" ? "url" : "text";
    input.value = value || "";
    label.appendChild(labelSpan);
    label.appendChild(input);
    return label;
  }

  function createLinkLabelIcon(field) {
    var src = {
      hu: "flag-hu.png",
      de: "flag-de.png",
      en: "flag-en.png",
      url: "icon-link.png"
    }[field] || "icon-link.png";
    return createIconImage(src);
  }

  function createIconImage(src) {
    var image = document.createElement("img");
    image.src = src;
    image.alt = "";
    return image;
  }

  function configureDialogIconButton(button, label, iconSrc) {
    var hiddenLabel = document.createElement("span");
    button.classList.add("dialog-icon-button");
    button.title = label;
    button.setAttribute("aria-label", label);
    button.textContent = "";
    button.appendChild(createIconImage(iconSrc));
    hiddenLabel.className = "visually-hidden";
    hiddenLabel.textContent = label;
    button.appendChild(hiddenLabel);
  }

  function updateLinkEditorLabels() {
    if (!elements.linksEditorList) {
      return;
    }

    elements.linksEditorList.querySelectorAll("[data-link-label]").forEach(function (label) {
      var field = label.dataset.linkLabel;
      if (field === "hu") {
        updateIconLabel(label, t("linkNameHu"));
      } else if (field === "de") {
        updateIconLabel(label, t("linkNameDe"));
      } else if (field === "en") {
        updateIconLabel(label, t("linkNameEn"));
      } else if (field === "url") {
        updateIconLabel(label, t("linkUrl"));
      }
    });

    elements.linksEditorList.querySelectorAll("[data-link-remove]").forEach(function (button) {
      button.textContent = t("removeLink");
    });

    elements.linksEditorList.querySelectorAll("[data-link-move=\"up\"]").forEach(function (button) {
      button.title = t("moveLinkUp");
      button.setAttribute("aria-label", t("moveLinkUp"));
    });

    elements.linksEditorList.querySelectorAll("[data-link-move=\"down\"]").forEach(function (button) {
      button.title = t("moveLinkDown");
      button.setAttribute("aria-label", t("moveLinkDown"));
    });
    updateLinkMoveButtons();
  }

  function updateIconLabel(label, title) {
    label.title = title;
    label.setAttribute("aria-label", title);
  }

  function moveLinkRow(row, direction) {
    if (direction < 0 && row.previousElementSibling) {
      elements.linksEditorList.insertBefore(row, row.previousElementSibling);
    } else if (direction > 0 && row.nextElementSibling) {
      elements.linksEditorList.insertBefore(row.nextElementSibling, row);
    }
    updateLinkMoveButtons();
  }

  function updateLinkMoveButtons() {
    var rows = Array.prototype.slice.call(elements.linksEditorList.querySelectorAll(".link-editor-row"));
    rows.forEach(function (row, index) {
      var upButton = row.querySelector("[data-link-move=\"up\"]");
      var downButton = row.querySelector("[data-link-move=\"down\"]");
      if (upButton) {
        upButton.disabled = index === 0;
      }
      if (downButton) {
        downButton.disabled = index === rows.length - 1;
      }
    });
  }

  function collectLinksFromForm() {
    var links = Array.prototype.slice.call(elements.linksEditorList.querySelectorAll(".link-editor-row")).map(function (row) {
      var names = {
        hu: getLinkInputValue(row, "hu"),
        de: getLinkInputValue(row, "de"),
        en: getLinkInputValue(row, "en")
      };
      return {
        id: row.dataset.linkId || createId(),
        names: names,
        url: getLinkInputValue(row, "url")
      };
    }).filter(function (link) {
      return link.url && (link.names.hu || link.names.de || link.names.en);
    });
    return normalizeLinks(links);
  }

  function getLinkInputValue(row, field) {
    var input = row.querySelector("[data-link-field=\"" + field + "\"]");
    return input ? input.value.trim() : "";
  }

  function t(key, values) {
    var dictionary = translations[state.language] || translations.de;
    var text = dictionary[key] || translations.de[key] || key;
    Object.keys(values || {}).forEach(function (name) {
      text = text.replace("{" + name + "}", values[name]);
    });
    return text;
  }

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      var indexedDbApi = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      var request = null;
      var databaseName = getActiveDatabaseName();

      if (!indexedDbApi) {
        reject(new Error("window.indexedDB is missing"));
        return;
      }

      try {
        request = indexedDbApi.open(databaseName, DB_VERSION);
      } catch (error) {
        reject(error);
        return;
      }

      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
          db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: "key" });
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error || new Error("indexedDB.open failed"));
      };
    });
  }

  function getActiveDatabaseName() {
    return localStorage.getItem(ACTIVE_DB_NAME_KEY) || DB_NAME;
  }

  function switchToFreshDatabaseName() {
    var newName = DB_NAME + "-recovered-" + new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    localStorage.setItem(ACTIVE_DB_NAME_KEY, newName);
    return newName;
  }

  function transaction(mode, storeName) {
    var selectedStoreName = storeName || STORE_NAME;
    return state.db.transaction(selectedStoreName, mode).objectStore(selectedStoreName);
  }

  function loadFlowers() {
    return new Promise(function (resolve, reject) {
      var request = transaction("readonly").getAll();
      request.onsuccess = function () {
        state.flowers = request.result.map(normalizeFlowerRecord);
        sortFlowers();
        resolve();
      };
      request.onerror = function () {
        loadFlowersIndividually(request.error).then(resolve).catch(reject);
      };
    });
  }

  function loadFlowersIndividually(originalError) {
    return getAllFlowerKeys().then(function (keys) {
      var recovered = [];
      var failedKeys = [];
      var chain = Promise.resolve();

      keys.forEach(function (key) {
        chain = chain.then(function () {
          return getFlowerByKey(key).then(function (flower) {
            if (flower) {
              recovered.push(normalizeFlowerRecord(flower));
            }
          }).catch(function (error) {
            failedKeys.push(key);
            window.console.warn("A flower record could not be read from IndexedDB.", key, error);
          });
        });
      });

      return chain.then(function () {
        if (!recovered.length && failedKeys.length) {
          throw originalError;
        }
        state.flowers = recovered;
        sortFlowers();
        if (failedKeys.length) {
          window.alert("Einige beschädigte Blumendatensätze konnten nicht gelesen werden. Die lesbaren Blumen wurden geladen. Bitte exportiere die Daten jetzt als Sicherung.");
        }
      });
    });
  }

  function getAllFlowerKeys() {
    return new Promise(function (resolve, reject) {
      var request = transaction("readonly").getAllKeys();
      request.onsuccess = function () {
        resolve(request.result || []);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function getFlowerByKey(key) {
    return new Promise(function (resolve, reject) {
      var request = transaction("readonly").get(key);
      request.onsuccess = function () {
        resolve(request.result || null);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function saveFlower(flower) {
    return new Promise(function (resolve, reject) {
      var request = transaction("readwrite").put(flower);
      request.onsuccess = resolve;
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function normalizeFlowerRecord(flower) {
    var images = getFlowerImages(flower);
    var imageSources = normalizeImageSources(flower.imageSources, images.length);
    var imageNames = normalizeImageNames(flower.imageNames, images.length, getFirstNamePart((flower.names && (flower.names.hu || flower.names.de || flower.names.en)) || "blume"));
    var imageInfos = normalizeImageInfos(flower.imageInfos, images.length);
    var promoted = promoteImageToFirst(images, imageSources, normalizeFavoriteImageIndex(flower.favoriteImageIndex, images), imageNames, imageInfos);
    return {
      id: flower.id,
      names: {
        hu: flower.names && flower.names.hu ? String(flower.names.hu).trim() : "",
        la: flower.names && flower.names.la ? String(flower.names.la).trim() : "",
        de: flower.names && flower.names.de ? String(flower.names.de).trim() : "",
        en: flower.names && flower.names.en ? String(flower.names.en).trim() : ""
      },
      description: normalizeDescription(flower.description),
      links: normalizeLinks(flower.links),
      imageData: promoted.images[0] || flower.imageData || "",
      images: promoted.images,
      imageSources: promoted.sources,
      imageNames: promoted.names,
      imageInfos: promoted.infos,
      favoriteImageIndex: 0,
      updatedAt: flower.updatedAt || ""
    };
  }

  function deleteFlower(id) {
    return new Promise(function (resolve, reject) {
      var request = transaction("readwrite").delete(id);
      request.onsuccess = resolve;
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function clearFlowers() {
    return new Promise(function (resolve, reject) {
      var request = transaction("readwrite").clear();
      request.onsuccess = resolve;
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function seedDemoFlowersIfNeeded() {
    return getSetting(DEMO_SEEDED_KEY).then(function (seeded) {
      if (state.flowers.length > 0 || seeded) {
        return null;
      }

      return Promise.all(demoFlowers.map(function (flower) {
        return saveFlower(flower);
      }))
        .then(function () {
          return setSetting(DEMO_SEEDED_KEY, true);
        })
        .then(loadFlowers);
    });
  }

  function getSetting(key) {
    return new Promise(function (resolve, reject) {
      var request = transaction("readonly", SETTINGS_STORE_NAME).get(key);
      request.onsuccess = function () {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function setSetting(key, value) {
    return new Promise(function (resolve, reject) {
      var request = transaction("readwrite", SETTINGS_STORE_NAME).put({
        key: key,
        value: value
      });
      request.onsuccess = resolve;
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function render() {
    renderFlowerList();

    if (state.editingId !== null) {
      renderStickyDetailActions(null);
      elements.detailView.classList.add("hidden");
      elements.flowerForm.classList.remove("hidden");
      return;
    }

    elements.flowerForm.classList.add("hidden");
    elements.detailView.classList.remove("hidden");
    renderDetailView();
  }

  function renderFlowerList() {
    elements.flowerList.innerHTML = "";
    var rawSearchQuery = elements.searchInput.value.trim();
    var normalizedSearchQuery = normalizeSearchText(rawSearchQuery);

    getVisibleFlowers().forEach(function (flower) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "flower-item";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", flower.id === state.selectedId ? "true" : "false");
      if (flower.id === state.selectedId) {
        item.classList.add("active");
      }
      item.dataset.flowerId = flower.id;
      if (state.searchMode === "everywhere" && normalizedSearchQuery) {
        var matchDetails = getFlowerSearchMatchDetails(flower, normalizedSearchQuery);
        if (matchDetails) {
          item.title = t(matchDetails.messageKey, { query: rawSearchQuery });
        }
      }

      var img = document.createElement("img");
      img.className = "flower-thumb";
      img.src = getFlowerImages(flower)[0] || flower.imageData;
      img.alt = "";

      var text = document.createElement("span");
      var title = document.createElement("span");
      title.className = "flower-title";
      title.textContent = getFlowerTitle(flower);
      var subtitle = document.createElement("span");
      subtitle.className = "flower-subtitle";
      subtitle.textContent = flower.names.la || t("noMoreNames");

      text.appendChild(title);
      text.appendChild(subtitle);
      item.appendChild(img);
      item.appendChild(text);
      item.addEventListener("click", function () {
        setSelectedFlower(flower.id);
        selectFilterMatchLanguage(flower, normalizeSearchText(elements.filterInput.value));
        selectSearchMatchImage(flower, normalizedSearchQuery);
        closeForm();
        render();
      });

      elements.flowerList.appendChild(item);
    });
    updateFilterStepButtons();
    updateSearchStepButtons();
  }

  function applyFilterNavigation(direction) {
    var visibleFlowers = getVisibleFlowers();
    var target = getSearchNavigationTarget(visibleFlowers, direction);
    var filterQuery = normalizeSearchText(elements.filterInput.value);
    if (!target) {
      return;
    }

    setSelectedFlower(target.id);
    selectFilterMatchLanguage(target, filterQuery);
    selectSearchMatchImage(target, normalizeSearchText(elements.searchInput.value));
    closeForm();
    render();
    scrollToFlower(target.id);
  }

  function applyFilterAndSearch(direction) {
    elements.searchMessage.textContent = "";
    var visibleFlowers = getVisibleFlowers();
    var searchMatches = getSearchMatches();
    var searchQuery = normalizeSearchText(elements.searchInput.value);
    var target = null;

    if (searchQuery) {
      if (searchMatches.length === 0) {
        elements.searchMessage.textContent = t("noSearchMatch");
      } else {
        target = getSearchNavigationTarget(searchMatches, direction === undefined ? 1 : direction);
      }
    } else if (visibleFlowers.length) {
      target = direction
        ? getSearchNavigationTarget(visibleFlowers, direction)
        : visibleFlowers.find(function (flower) {
          return flower.id === state.selectedId;
        }) || visibleFlowers[0];
    }

    if (target) {
      setSelectedFlower(target.id);
      selectFilterMatchLanguage(target, normalizeSearchText(elements.filterInput.value));
      selectSearchMatchImage(target, searchQuery);
    }
    closeForm();
    render();
    if (target) {
      scrollToFlower(target.id);
    }
  }

  function getVisibleFlowers() {
    var filterQuery = normalizeSearchText(elements.filterInput.value);
    return state.flowers.filter(function (flower) {
      return flowerMatchesFilter(flower, filterQuery);
    });
  }

  function getSearchMatches() {
    var filterQuery = normalizeSearchText(elements.filterInput.value);
    var searchQuery = normalizeSearchText(elements.searchInput.value);
    if (!searchQuery) {
      return [];
    }
    return state.flowers.filter(function (flower) {
      return flowerMatchesFilter(flower, filterQuery) && flowerMatchesSearch(flower, searchQuery);
    });
  }

  function getSearchNavigationTarget(matches, direction) {
    if (!matches.length) {
      return null;
    }
    var currentIndex = matches.findIndex(function (flower) {
      return flower.id === state.selectedId;
    });
    if (currentIndex === -1) {
      return direction < 0 ? matches[matches.length - 1] : matches[0];
    }
    if (direction === 0) {
      return matches[0];
    }
    var nextIndex = (currentIndex + direction + matches.length) % matches.length;
    return matches[nextIndex];
  }

  function flowerMatchesFilter(flower, query) {
    if (!query) {
      return true;
    }
    return getFlowerNameValues(flower).some(function (name) {
      return normalizeSearchText(name).indexOf(query) !== -1;
    });
  }

  function flowerMatchesSearch(flower, query) {
    var values = state.searchMode === "everywhere"
      ? getFlowerEverywhereSearchGroups(flower).reduce(function (allValues, group) {
        return allValues.concat(group.values);
      }, [])
      : getFlowerNameValues(flower);
    return values.some(function (value) {
      return normalizeSearchText(value).indexOf(query) !== -1;
    });
  }

  function getFlowerNameValues(flower) {
    return [flower.names.hu, flower.names.la, flower.names.de, flower.names.en];
  }

  function getFilterMatchDetails(flower, query) {
    if (!query) {
      return null;
    }
    var languages = getSearchLanguageOrder();
    var languageMatch = findSearchEntryMatch(languages.map(function (language) {
      return {
        language: language,
        value: flower.names[language]
      };
    }), query);
    if (languageMatch) {
      return languageMatch;
    }
    if (normalizeSearchText(flower.names.la).indexOf(query) !== -1) {
      return {
        language: null,
        value: flower.names.la
      };
    }
    return null;
  }

  function selectFilterMatchLanguage(flower, query) {
    var matchDetails = getFilterMatchDetails(flower, query);
    if (!matchDetails || !matchDetails.language || matchDetails.language === state.language) {
      return;
    }
    state.language = matchDetails.language;
    localStorage.setItem("flowerInventoryLanguage", matchDetails.language);
    sortFlowers();
    applyLanguage();
  }

  function updateFilterStepButtons() {
    var visibleFlowers = getVisibleFlowers();
    var hasFilter = Boolean(normalizeSearchText(elements.filterInput.value));
    var disabled = !hasFilter || visibleFlowers.length === 0;
    elements.filterPreviousButton.disabled = disabled;
    elements.filterNextButton.disabled = disabled;
  }

  function getFlowerEverywhereSearchGroups(flower) {
    var descriptions = normalizeDescription(flower.description);
    var imageInfoValues = getFlowerImageInfos(flower).reduce(function (values, info) {
      values.push(info.hu, info.de, info.en);
      return values;
    }, []);
    return [
      {
        messageKey: "searchMatchNames",
        values: getFlowerNameValues(flower)
      },
      {
        messageKey: "searchMatchDescriptions",
        values: [
          htmlToPlainText(descriptions.hu),
          htmlToPlainText(descriptions.de),
          htmlToPlainText(descriptions.en)
        ]
      },
      {
        messageKey: "searchMatchImageInfos",
        values: imageInfoValues
      },
      {
        messageKey: "searchMatchLinks",
        values: getSearchableLinks(flower)
      }
    ];
  }

  function getFlowerSearchMatchDetails(flower, query) {
    var languages = getSearchLanguageOrder();
    var nameEntries = languages.map(function (language) {
      return {
        language: language,
        value: flower.names[language]
      };
    }).concat([{
      language: null,
      value: flower.names.la
    }]);
    var nameMatch = findSearchEntryMatch(nameEntries, query);
    if (nameMatch) {
      return {
        messageKey: "searchMatchNames",
        imageIndex: null,
        language: nameMatch.language
      };
    }

    var descriptions = normalizeDescription(flower.description);
    var descriptionMatch = findSearchEntryMatch(languages.map(function (language) {
      return {
        language: language,
        value: htmlToPlainText(descriptions[language])
      };
    }), query);
    if (descriptionMatch) {
      return {
        messageKey: "searchMatchDescriptions",
        imageIndex: null,
        language: descriptionMatch.language
      };
    }

    var imageInfos = getFlowerImageInfos(flower);
    for (var imageIndex = 0; imageIndex < imageInfos.length; imageIndex += 1) {
      var imageInfoMatch = findSearchEntryMatch(languages.map(function (language) {
        return {
          language: language,
          value: imageInfos[imageIndex][language]
        };
      }), query);
      if (imageInfoMatch) {
        return {
          messageKey: "searchMatchImageInfos",
          imageIndex: imageIndex,
          language: imageInfoMatch.language
        };
      }
    }

    var links = normalizeLinks(flower.links);
    for (var linkIndex = 0; linkIndex < links.length; linkIndex += 1) {
      var linkNameMatch = findSearchEntryMatch(languages.map(function (language) {
        return {
          language: language,
          value: links[linkIndex].names[language]
        };
      }), query);
      if (linkNameMatch) {
        return {
          messageKey: "searchMatchLinks",
          imageIndex: null,
          language: linkNameMatch.language
        };
      }
      if (normalizeSearchText(links[linkIndex].url).indexOf(query) !== -1) {
        return {
          messageKey: "searchMatchLinks",
          imageIndex: null,
          language: null
        };
      }
    }
    return null;
  }

  function getSearchLanguageOrder() {
    return [state.language].concat(["hu", "de", "en"].filter(function (language) {
      return language !== state.language;
    }));
  }

  function findSearchEntryMatch(entries, query) {
    for (var index = 0; index < entries.length; index += 1) {
      if (normalizeSearchText(entries[index].value).indexOf(query) !== -1) {
        return entries[index];
      }
    }
    return null;
  }

  function selectSearchMatchImage(flower, query) {
    if (state.searchMode !== "everywhere" || !query) {
      return;
    }
    var matchDetails = getFlowerSearchMatchDetails(flower, query);
    if (!matchDetails) {
      return;
    }
    if (matchDetails.language && matchDetails.language !== state.language) {
      state.language = matchDetails.language;
      localStorage.setItem("flowerInventoryLanguage", matchDetails.language);
      sortFlowers();
      applyLanguage();
    }
    if (matchDetails.imageIndex !== null) {
      setFlowerImageIndex(flower.id, matchDetails.imageIndex, {
        updateHistory: flower.id === state.selectedId,
        replaceCurrentHistory: true
      });
    }
    if (matchDetails.messageKey === "searchMatchDescriptions") {
      state.activeInfoTab = "description";
    } else if (matchDetails.messageKey === "searchMatchLinks") {
      state.activeInfoTab = "links";
    }
  }

  function highlightVisibleSearchText(root) {
    var query = normalizeSearchText(elements.searchInput.value);
    if (state.searchMode !== "everywhere" || !query || !root) {
      return;
    }

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var textNodes = [];
    var node = walker.nextNode();
    while (node) {
      if (node.nodeValue.trim() && node.parentElement && !node.parentElement.closest("button, .search-highlight")) {
        textNodes.push(node);
      }
      node = walker.nextNode();
    }
    textNodes.forEach(function (textNode) {
      highlightSearchTextNode(textNode, query);
    });
  }

  function highlightSearchTextNode(textNode, query) {
    var mappedText = normalizeSearchTextWithMap(textNode.nodeValue);
    var start = mappedText.text.indexOf(query);
    if (start === -1) {
      return;
    }

    var fragment = document.createDocumentFragment();
    var originalStart = 0;
    while (start !== -1) {
      var originalMatchStart = mappedText.map[start];
      var normalizedEnd = start + query.length - 1;
      var originalMatchEnd = mappedText.map[normalizedEnd] + 1;
      fragment.appendChild(document.createTextNode(textNode.nodeValue.slice(originalStart, originalMatchStart)));
      var mark = document.createElement("mark");
      mark.className = "search-highlight";
      mark.textContent = textNode.nodeValue.slice(originalMatchStart, originalMatchEnd);
      fragment.appendChild(mark);
      originalStart = originalMatchEnd;
      start = mappedText.text.indexOf(query, normalizedEnd + 1);
    }
    fragment.appendChild(document.createTextNode(textNode.nodeValue.slice(originalStart)));
    textNode.replaceWith(fragment);
  }

  function normalizeSearchTextWithMap(value) {
    var normalized = "";
    var map = [];
    var originalIndex = 0;
    Array.from(String(value || "")).forEach(function (character) {
      var chunk = character.toLocaleLowerCase();
      if (chunk.normalize) {
        chunk = chunk.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }
      chunk = chunk
        .replace(/ő/g, "o")
        .replace(/ű/g, "u")
        .replace(/đ/g, "d")
        .replace(/ł/g, "l")
        .replace(/ø/g, "o")
        .replace(/æ/g, "ae")
        .replace(/œ/g, "oe")
        .replace(/ß/g, "ss");
      normalized += chunk;
      for (var index = 0; index < chunk.length; index += 1) {
        map.push(originalIndex);
      }
      originalIndex += character.length;
    });
    return {
      text: normalized,
      map: map
    };
  }

  function updateSearchStepButtons() {
    var matches = getSearchMatches();
    var searchQuery = normalizeSearchText(elements.searchInput.value);
    var disabled = searchQuery ? matches.length === 0 : getVisibleFlowers().length === 0;
    elements.searchPreviousButton.disabled = disabled;
    elements.searchNextButton.disabled = disabled;
  }

  function scrollToFlower(id) {
    window.requestAnimationFrame(function () {
      var item = elements.flowerList.querySelector("[data-flower-id=\"" + cssEscape(id) + "\"]");
      if (!item) {
        return;
      }

      item.classList.add("search-hit");
      item.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
      window.setTimeout(function () {
        item.classList.remove("search-hit");
      }, 900);
    });
  }

  function renderDetailView() {
    var flower = getSelectedFlower();

    if (!flower) {
      renderStickyDetailActions(null);
      elements.detailView.innerHTML = "";
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = [
        "<div class=\"empty-state-inner\">",
        "<h2>" + t("noFlowersTitle") + "</h2>",
        "<p>" + t("noFlowersText") + "</p>",
        "<button class=\"primary\" type=\"button\">" + t("newFlower") + "</button>",
        "</div>"
      ].join("");
      empty.querySelector("button").addEventListener("click", function () {
        openForm();
      });
      elements.detailView.appendChild(empty);
      return;
    }

    renderStickyDetailActions(flower);
    elements.detailView.innerHTML = "";
    var card = document.createElement("article");
    card.className = "detail-card";

    var imageFrame = createHeroImageFrame(flower);

    var content = document.createElement("div");
    content.className = "detail-content";
    var heading = createHeading(getFlowerTitle(flower));
    content.appendChild(heading);
    content.appendChild(createNameGrid(flower));

    card.appendChild(imageFrame);
    card.appendChild(content);
    card.appendChild(createDescriptionSection(flower));
    elements.detailView.appendChild(card);
    highlightVisibleSearchText(card);
    window.requestAnimationFrame(function () {
      fitHeadingToOneLine(heading);
    });
  }

  function createHeroImageFrame(flower) {
    var frame = document.createElement("div");
    frame.className = "hero-image-frame";

    var images = getFlowerImages(flower);
    var imageSources = getFlowerImageSources(flower);
    var imageInfos = getFlowerImageInfos(flower);
    var imageNames = getFlowerImageNames(flower);
    var imageIndex = getFlowerImageIndex(flower);
    var image = document.createElement("img");
    image.className = "hero-image";
    image.src = images[imageIndex] || "";
    image.alt = getLocalizedFlowerName(flower);
    image.title = getImageInfoTooltip(imageInfos[imageIndex], imageNames[imageIndex]);
    image.addEventListener("click", function () {
      openOriginalImageForFlower(flower);
    });

    var imageShell = document.createElement("div");
    imageShell.className = "hero-image-shell";
    imageShell.addEventListener("wheel", function (event) {
      handleFlowerImageWheel(event, flower);
    }, { passive: false });

    var addInput = document.createElement("input");
    addInput.type = "file";
    addInput.accept = "image/*";
    addInput.multiple = true;
    addInput.className = "hero-image-add-input";
    addInput.addEventListener("change", function (event) {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      appendImagesToFlower(flower, event.target.files);
      addInput.value = "";
    });

    var addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "hero-image-add";
    addButton.title = t("addImage");
    addButton.setAttribute("aria-label", t("addImage"));
    addButton.appendChild(createIconImage("icon-add.png"));
    addButton.addEventListener("click", function () {
      addInput.click();
    });

    var deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "hero-image-delete";
    deleteButton.title = t("deleteImage");
    deleteButton.setAttribute("aria-label", t("deleteImage"));
    deleteButton.disabled = images.length <= 1;
    deleteButton.appendChild(createIconImage("icon-delete.png"));
    deleteButton.addEventListener("click", function () {
      deleteCurrentFlowerImage(flower);
    });

    var favoriteButton = document.createElement("button");
    var isFavoriteImage = imageIndex === getFavoriteImageIndex(flower);
    favoriteButton.type = "button";
    favoriteButton.className = "hero-image-favorite" + (isFavoriteImage ? " active" : "");
    favoriteButton.title = isFavoriteImage ? t("favoriteImage") : t("setFavoriteImage");
    favoriteButton.setAttribute("aria-label", favoriteButton.title);
    favoriteButton.appendChild(createIconImage("icon-favorite.png"));
    favoriteButton.addEventListener("click", function () {
      if (!isFavoriteImage) {
        setFavoriteImage(flower, imageIndex);
      }
    });

    var thumbnailsButton = document.createElement("button");
    thumbnailsButton.type = "button";
    thumbnailsButton.className = "hero-image-thumbnails";
    thumbnailsButton.title = t("showThumbnails");
    thumbnailsButton.setAttribute("aria-label", t("showThumbnails"));
    thumbnailsButton.appendChild(createIconImage("icon-thumbnails.png"));
    thumbnailsButton.addEventListener("click", function () {
      openThumbnailChooser({
        images: images,
        imageSources: imageSources,
        imageNames: imageNames,
        imageInfos: imageInfos,
        currentIndex: imageIndex,
        favoriteIndex: getFavoriteImageIndex(flower),
        onSelect: function (index) {
          selectFlowerImageByIndex(flower, index);
        },
        onFavorite: function (index) {
          setFavoriteImage(flower, index);
        },
        onDelete: function (index) {
          deleteFlowerImageByIndex(flower, index, {
            reopenThumbnails: true
          });
        },
        onAddFiles: function (files, insertIndex) {
          appendImagesToFlower(flower, files, {
            reopenThumbnails: true,
            insertIndex: insertIndex
          });
        },
        onInfo: function (index) {
          editFlowerImageInfo(flower, index, {
            reopenThumbnails: true
          });
        },
        onSource: function (index) {
          editFlowerImageSource(flower, index, {
            reopenThumbnails: true
          });
        }
      });
    });

    var sourceButton = document.createElement("button");
    sourceButton.type = "button";
    sourceButton.className = "hero-image-source";
    sourceButton.title = t("imageSource");
    sourceButton.setAttribute("aria-label", t("imageSource"));
    sourceButton.disabled = !imageSources[imageIndex];
    sourceButton.appendChild(createIconImage("icon-link.png"));
    sourceButton.addEventListener("click", function () {
      if (imageSources[imageIndex]) {
        openImageSource(imageSources[imageIndex]);
      }
    });

    var infoButton = createImageInfoButton(imageInfos[imageIndex], imageNames[imageIndex], function () {
      editFlowerImageInfo(flower, imageIndex);
    });

    imageShell.addEventListener("dragenter", function (event) {
      event.preventDefault();
      imageShell.classList.add("drag-over");
    });
    imageShell.addEventListener("dragover", function (event) {
      event.preventDefault();
      imageShell.classList.add("drag-over");
    });
    imageShell.addEventListener("dragleave", function () {
      imageShell.classList.remove("drag-over");
    });
    imageShell.addEventListener("drop", function (event) {
      event.preventDefault();
      imageShell.classList.remove("drag-over");
      var files = event.dataTransfer && event.dataTransfer.files;
      if (!files || files.length === 0) {
        return;
      }
      appendImagesToFlower(flower, files);
    });

    imageShell.appendChild(image);
    imageShell.appendChild(addInput);
    imageShell.appendChild(addButton);
    imageShell.appendChild(deleteButton);
    imageShell.appendChild(favoriteButton);
    imageShell.appendChild(thumbnailsButton);
    imageShell.appendChild(sourceButton);
    imageShell.appendChild(infoButton);
    frame.appendChild(imageShell);
    if (images.length > 1) {
      frame.appendChild(createImageNavigation(flower, images.length, imageIndex));
    }
    return frame;
  }

  function createImageNavigation(flower, imageCount, imageIndex) {
    return createImageNavigationControls(imageCount, imageIndex, {
      first: function () {
        selectFlowerImageByIndex(flower, 0);
      },
      previous: function () {
        selectFlowerImageByOffset(flower, -1);
      },
      next: function () {
        selectFlowerImageByOffset(flower, 1);
      },
      last: function () {
        selectFlowerImageByIndex(flower, imageCount - 1);
      }
    });
  }

  function createImageNavigationControls(imageCount, imageIndex, handlers) {
    var navigation = document.createElement("div");
    var firstButton = createImageNavButton(t("imageFirst"), "first");
    var previousButton = createImageNavButton(t("imagePrevious"), "previous");
    var status = document.createElement("span");
    var nextButton = createImageNavButton(t("imageNext"), "next");
    var lastButton = createImageNavButton(t("imageLast"), "last");

    navigation.className = "hero-image-navigation";
    firstButton.disabled = imageIndex <= 0;
    previousButton.disabled = imageIndex <= 0;
    nextButton.disabled = imageIndex >= imageCount - 1;
    lastButton.disabled = imageIndex >= imageCount - 1;
    firstButton.addEventListener("click", handlers.first);
    previousButton.addEventListener("click", handlers.previous);
    nextButton.addEventListener("click", handlers.next);
    lastButton.addEventListener("click", handlers.last);

    status.className = "hero-image-status";
    status.textContent = (imageIndex + 1) + " / " + imageCount;

    navigation.appendChild(firstButton);
    navigation.appendChild(previousButton);
    navigation.appendChild(status);
    navigation.appendChild(nextButton);
    navigation.appendChild(lastButton);
    return navigation;
  }

  function createImageNavButton(label, direction) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "hero-image-nav hero-image-nav-" + direction;
    button.title = label;
    button.setAttribute("aria-label", label);
    button.textContent = {
      first: "‹‹",
      previous: "‹",
      next: "›",
      last: "››"
    }[direction] || "›";
    return button;
  }

  function openOriginalImageForSelectedFlower() {
    var flower = getSelectedFlower();
    if (!flower) {
      return;
    }
    openOriginalImageForFlower(flower);
  }

  function openOriginalImageForFlower(flower) {
    var images = getFlowerImages(flower);
    if (!images.length) {
      return;
    }
    openOriginalImageOverlay(images, getFlowerImageIndex(flower), getLocalizedFlowerName(flower), function (index) {
      setFlowerImageIndex(flower.id, index, { updateHistory: true });
      render();
    }, {
      imageInfos: getFlowerImageInfos(flower),
      imageNames: getFlowerImageNames(flower),
      imageSources: getFlowerImageSources(flower),
      favoriteIndex: getFavoriteImageIndex(flower),
      onFavorite: function (index) {
        setFavoriteImage(flower, index);
      },
      onDelete: function (index) {
        deleteFlowerImageByIndex(flower, index);
      },
      onInfo: function (index) {
        return editFlowerImageInfo(flower, index);
      },
      onSource: function (index) {
        return editFlowerImageSource(flower, index);
      },
      manageSources: true
    });
  }

  function selectFlowerImageByIndex(flower, index) {
    var images = getFlowerImages(flower);
    if (index < 0 || index >= images.length) {
      return;
    }
    setFlowerImageIndex(flower.id, index, { updateHistory: flower.id === state.selectedId });
    render();
  }

  function selectFlowerImageByOffset(flower, offset) {
    var images = getFlowerImages(flower);
    var nextIndex = getFlowerImageIndex(flower) + offset;
    if (nextIndex < 0 || nextIndex >= images.length) {
      return;
    }
    setFlowerImageIndex(flower.id, nextIndex, { updateHistory: flower.id === state.selectedId });
    render();
  }

  function selectCurrentFlowerImageByOffset(offset) {
    var flower = getSelectedFlower();
    if (!flower) {
      return;
    }
    selectFlowerImageByOffset(flower, offset);
  }

  function selectCurrentFlowerImageEdge(edge) {
    var flower = getSelectedFlower();
    var images = getFlowerImages(flower);
    if (!flower || !images.length) {
      return;
    }
    selectFlowerImageByIndex(flower, edge === "first" ? 0 : images.length - 1);
  }

  function handleFlowerImageWheel(event, flower) {
    var images = getFlowerImages(flower);
    if (images.length <= 1 || event.deltaY === 0) {
      return;
    }
    event.preventDefault();
    selectFlowerImageByOffset(flower, event.deltaY > 0 ? 1 : -1);
  }

  function appendImagesToFlower(flower, fileList, options) {
    var files = Array.prototype.slice.call(fileList || []);
    if (files.length === 0) {
      return;
    }
    if (files.some(function (file) {
      return !file.type || file.type.indexOf("image/") !== 0;
    })) {
      window.alert(t("dragImageOnly"));
      return;
    }

    var existingImages = getFlowerImages(flower);
    var existingSources = getFlowerImageSources(flower);
    var existingNames = getFlowerImageNames(flower);
    var existingInfos = getFlowerImageInfos(flower);
    Promise.all(files.map(readFileAsDataUrl))
      .then(function (dataUrls) {
        var insertIndex = getImageInsertIndex(options && options.insertIndex, existingImages.length);
        var emptySources = dataUrls.map(function () {
          return "";
        });
        var emptyInfos = dataUrls.map(function () {
          return createEmptyImageInfo();
        });
        var newNames = getImageNamesForFiles(files, flower, existingNames);
        var images = insertItemsAt(existingImages, dataUrls, insertIndex);
        var imageSources = insertItemsAt(existingSources, emptySources, insertIndex);
        var imageNames = insertItemsAt(existingNames, newNames, insertIndex);
        var imageInfos = insertItemsAt(existingInfos, emptyInfos, insertIndex);
        var favoriteIndex = getFavoriteImageIndex(flower);
        var nextFavoriteIndex = insertIndex <= favoriteIndex ? favoriteIndex + dataUrls.length : favoriteIndex;
        var selectedImageIndex = insertIndex <= favoriteIndex ? insertIndex + 1 : insertIndex;
        var updatedFlower = Object.assign({}, flower, {
          imageData: images[0],
          images: images,
          imageSources: imageSources,
          imageNames: imageNames,
          imageInfos: imageInfos,
          favoriteImageIndex: nextFavoriteIndex,
          updatedAt: new Date().toISOString()
        });
        setFlowerImageIndex(flower.id, getImageInsertIndex(selectedImageIndex, images.length), { updateHistory: flower.id === state.selectedId });
        return saveFlower(updatedFlower);
      })
      .then(loadFlowers)
      .then(function () {
        setSelectedFlower(flower.id);
        render();
        if (options && options.reopenThumbnails) {
          var updatedFlower = getSelectedFlower();
          if (updatedFlower) {
            openThumbnailChooserForFlower(updatedFlower);
          }
        }
      })
      .catch(function () {
        window.alert(t("readImageFailed"));
      });
  }

  function deleteCurrentFlowerImage(flower) {
    deleteFlowerImageByIndex(flower, getFlowerImageIndex(flower));
  }

  function deleteFlowerImageByIndex(flower, imageIndex, options) {
    var images = getFlowerImages(flower);
    var imageSources = getFlowerImageSources(flower);
    var imageNames = getFlowerImageNames(flower);
    var imageInfos = getFlowerImageInfos(flower);
    if (images.length <= 1) {
      window.alert(t("keepOneImage"));
      return;
    }

    if (imageIndex < 0 || imageIndex >= images.length) {
      return;
    }

    var favoriteImageIndex = getFavoriteImageIndex(flower);
    var updatedImages = images.filter(function (_, index) {
      return index !== imageIndex;
    });
    var updatedSources = imageSources.filter(function (_, index) {
      return index !== imageIndex;
    });
    var updatedNames = imageNames.filter(function (_, index) {
      return index !== imageIndex;
    });
    var updatedInfos = imageInfos.filter(function (_, index) {
      return index !== imageIndex;
    });
    var nextIndex = Math.min(imageIndex, updatedImages.length - 1);
    var nextFavoriteIndex = getFavoriteIndexAfterImageDelete(favoriteImageIndex, imageIndex, nextIndex);
    var updatedFlower = Object.assign({}, flower, {
      imageData: updatedImages[0],
      images: updatedImages,
      imageSources: updatedSources,
      imageNames: updatedNames,
      imageInfos: updatedInfos,
      favoriteImageIndex: nextFavoriteIndex,
      updatedAt: new Date().toISOString()
    });

    setFlowerImageIndex(flower.id, nextIndex, { updateHistory: flower.id === state.selectedId });
    saveFlower(updatedFlower)
      .then(loadFlowers)
      .then(function () {
        setSelectedFlower(flower.id);
        render();
        if (options && options.reopenThumbnails) {
          var updatedFlower = getSelectedFlower();
          if (updatedFlower) {
            openThumbnailChooserForFlower(updatedFlower);
          }
        }
      })
      .catch(function () {
        window.alert(t("deleteFailed"));
      });
  }

  function setFavoriteImage(flower, imageIndex) {
    var images = getFlowerImages(flower);
    if (imageIndex < 0 || imageIndex >= images.length) {
      return;
    }
    var promoted = promoteImageToFirst(images, getFlowerImageSources(flower), imageIndex, getFlowerImageNames(flower), getFlowerImageInfos(flower));

    var updatedFlower = Object.assign({}, flower, {
      imageData: promoted.images[0] || "",
      images: promoted.images,
      imageSources: promoted.sources,
      imageNames: promoted.names,
      imageInfos: promoted.infos,
      favoriteImageIndex: 0,
      updatedAt: new Date().toISOString()
    });
    setFlowerImageIndex(flower.id, 0, { updateHistory: flower.id === state.selectedId });
    saveFlower(updatedFlower)
      .then(loadFlowers)
      .then(function () {
        setSelectedFlower(flower.id);
        render();
      })
      .catch(function () {
        window.alert(t("saveFailed"));
      });
  }

  function openThumbnailChooserForFlower(flower) {
    openThumbnailChooser({
      images: getFlowerImages(flower),
      imageSources: getFlowerImageSources(flower),
      imageNames: getFlowerImageNames(flower),
      imageInfos: getFlowerImageInfos(flower),
      currentIndex: getFlowerImageIndex(flower),
      favoriteIndex: getFavoriteImageIndex(flower),
      onSelect: function (index) {
        selectFlowerImageByIndex(flower, index);
      },
      onFavorite: function (index) {
        setFavoriteImage(flower, index);
      },
      onDelete: function (index) {
        deleteFlowerImageByIndex(flower, index, {
          reopenThumbnails: true
        });
      },
      onAddFiles: function (files, insertIndex) {
        appendImagesToFlower(flower, files, {
          reopenThumbnails: true,
          insertIndex: insertIndex
        });
      },
      onInfo: function (index) {
        editFlowerImageInfo(flower, index, {
          reopenThumbnails: true
        });
      },
      onSource: function (index) {
        editFlowerImageSource(flower, index, {
          reopenThumbnails: true
        });
      }
    });
  }

  function openThumbnailChooserForSelectedFlower() {
    var flower = getSelectedFlower();
    if (!flower) {
      return;
    }
    openThumbnailChooserForFlower(flower);
  }

  function openThumbnailChooserForPendingImages() {
    openThumbnailChooser({
      images: state.pendingImages,
      imageSources: state.pendingImageSources,
      imageNames: state.pendingImageNames,
      imageInfos: state.pendingImageInfos,
      currentIndex: state.pendingImageIndex,
      favoriteIndex: state.pendingFavoriteImageIndex,
      onSelect: selectPendingImageByIndex,
      onFavorite: setPendingFavoriteImage,
      onDelete: function (index) {
        deletePendingImageByIndex(index, {
          reopenThumbnails: true
        });
      },
      onAddFiles: function (files, insertIndex) {
        useImageFiles(files, {
          reopenThumbnails: true,
          insertIndex: insertIndex
        });
      },
      onInfo: function (index) {
        editPendingImageInfo(index, {
          reopenThumbnails: true
        });
      },
      onSource: function (index) {
        editPendingImageSource(index, {
          reopenThumbnails: true
        });
      },
      manageSources: true
    });
  }

  function openThumbnailChooser(options) {
    closeThumbnailChooser();
    var images = normalizeImages(options.images);
    if (images.length === 0) {
      return;
    }

    var overlay = document.createElement("div");
    var panel = document.createElement("div");
    var grid = document.createElement("div");
    var favoriteIndex = normalizeFavoriteImageIndex(options.favoriteIndex, images);
    var currentIndex = Math.min(Math.max(options.currentIndex || 0, 0), images.length - 1);
    var imageSources = normalizeImageSources(options.imageSources, images.length);
    var imageNames = normalizeImageNames(options.imageNames, images.length, "blume");
    var imageInfos = normalizeImageInfos(options.imageInfos, images.length);

    overlay.className = "thumbnail-overlay";
    overlay._thumbnailKeydownHandler = handleThumbnailKeydown;
    panel.className = "thumbnail-panel";
    grid.className = "thumbnail-grid";
    grid.style.setProperty("--thumbnail-columns", Math.min(images.length, 5));

    function handleThumbnailKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeThumbnailChooser();
      }
    }

    images.forEach(function (src, index) {
      var item = document.createElement("button");
      var image = document.createElement("img");
      var favoriteButton = document.createElement("button");
      var sourceButton = document.createElement("button");
      var deleteButton = document.createElement("button");
      var infoButton = document.createElement("button");
      var isFavorite = index === favoriteIndex;
      var thumbnailTitle = getImageInfoTooltip(imageInfos[index], imageNames[index]) + " · " + (index + 1) + " / " + images.length;

      item.type = "button";
      item.className = "thumbnail-item" + (index === currentIndex ? " selected" : "");
      item.title = thumbnailTitle;
      image.src = src;
      image.alt = imageNames[index];
      item.appendChild(image);
      item.addEventListener("click", function () {
        closeThumbnailChooser();
        if (typeof options.onSelect === "function") {
          options.onSelect(index);
        }
      });

      favoriteButton.type = "button";
      favoriteButton.className = "thumbnail-favorite" + (isFavorite ? " active" : "");
      favoriteButton.title = isFavorite ? t("favoriteImage") : t("setFavoriteImage");
      favoriteButton.setAttribute("aria-label", favoriteButton.title);
      favoriteButton.appendChild(createIconImage("icon-favorite.png"));
      favoriteButton.addEventListener("click", function (event) {
        event.stopPropagation();
        closeThumbnailChooser();
        if (typeof options.onFavorite === "function") {
          options.onFavorite(index);
        }
      });

      var hasImageSource = Boolean(imageSources[index]);
      sourceButton.type = "button";
      sourceButton.className = "thumbnail-source";
      sourceButton.classList.toggle("active", hasImageSource);
      sourceButton.title = options.manageSources ? t("manageImageSource") : t("imageSource");
      sourceButton.setAttribute("aria-label", sourceButton.title);
      sourceButton.disabled = !options.manageSources && !hasImageSource;
      sourceButton.classList.toggle("looks-disabled", options.manageSources && !hasImageSource);
      sourceButton.setAttribute("aria-disabled", options.manageSources && !hasImageSource ? "true" : "false");
      sourceButton.appendChild(createIconImage("icon-link.png"));
      sourceButton.addEventListener("click", function (event) {
        event.stopPropagation();
        if (options.manageSources && typeof options.onSource === "function") {
          options.onSource(index);
        } else if (hasImageSource) {
          openImageSource(imageSources[index]);
        }
      });

      deleteButton.type = "button";
      deleteButton.className = "thumbnail-delete";
      deleteButton.title = t("deleteImage");
      deleteButton.setAttribute("aria-label", t("deleteImage"));
      deleteButton.disabled = images.length <= 1;
      deleteButton.appendChild(createIconImage("icon-delete.png"));
      deleteButton.addEventListener("click", function (event) {
        event.stopPropagation();
        if (typeof options.onDelete === "function") {
          options.onDelete(index);
        }
      });

      infoButton.type = "button";
      var hasCurrentLanguageInfo = hasImageInfoForCurrentLanguage(imageInfos[index]);
      infoButton.className = "thumbnail-info" + (hasCurrentLanguageInfo ? " active" : "");
      infoButton.title = getImageInfoTooltip(imageInfos[index], imageNames[index]);
      infoButton.setAttribute("aria-label", hasCurrentLanguageInfo ? infoButton.title : t("editImageInfo"));
      infoButton.appendChild(createIconImage("icon-info.png"));
      infoButton.addEventListener("click", function (event) {
        event.stopPropagation();
        if (typeof options.onInfo === "function") {
          options.onInfo(index);
        }
      });

      item.appendChild(favoriteButton);
      item.appendChild(sourceButton);
      item.appendChild(deleteButton);
      item.appendChild(infoButton);
      grid.appendChild(item);
    });

    panel.appendChild(grid);
    overlay.appendChild(panel);
    overlay.addEventListener("click", closeThumbnailChooser);
    panel.addEventListener("click", function (event) {
      event.stopPropagation();
    });
    if (typeof options.onAddFiles === "function") {
      state.thumbnailPasteContext = {
        grid: grid,
        onAddFiles: options.onAddFiles,
        pointer: null
      };
      panel.addEventListener("mousemove", function (event) {
        state.thumbnailPasteContext = {
          grid: grid,
          onAddFiles: options.onAddFiles,
          pointer: {
            clientX: event.clientX,
            clientY: event.clientY,
            target: event.target
          }
        };
      });
      panel.addEventListener("dragenter", function (event) {
        event.preventDefault();
        event.stopPropagation();
        panel.classList.add("drag-over");
      });
      panel.addEventListener("dragover", function (event) {
        event.preventDefault();
        event.stopPropagation();
        panel.classList.add("drag-over");
      });
      panel.addEventListener("dragleave", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (!panel.contains(event.relatedTarget)) {
          panel.classList.remove("drag-over");
        }
      });
      panel.addEventListener("drop", function (event) {
        event.preventDefault();
        event.stopPropagation();
        panel.classList.remove("drag-over");
        var files = event.dataTransfer && event.dataTransfer.files;
        if (files && files.length) {
          options.onAddFiles(files, getThumbnailDropInsertIndex(event, grid, images.length));
        }
      });
    }
    document.body.appendChild(overlay);
    document.addEventListener("keydown", handleThumbnailKeydown);
  }

  function closeThumbnailChooser() {
    var overlay = document.querySelector(".thumbnail-overlay");
    if (overlay) {
      if (overlay._thumbnailKeydownHandler) {
        document.removeEventListener("keydown", overlay._thumbnailKeydownHandler);
      }
      overlay.remove();
    }
    state.thumbnailPasteContext = null;
  }

  function getThumbnailPasteInsertIndex() {
    var context = state.thumbnailPasteContext;
    if (!context || !context.grid) {
      return undefined;
    }

    var imageCount = context.grid.querySelectorAll(".thumbnail-item").length;
    if (!context.pointer) {
      return imageCount;
    }
    return getThumbnailDropInsertIndex(context.pointer, context.grid, imageCount);
  }

  function getThumbnailDropInsertIndex(event, grid, imageCount) {
    var item = event.target.closest ? event.target.closest(".thumbnail-item") : null;
    if (!item || !grid.contains(item)) {
      return getThumbnailDropInsertIndexFromPosition(event, grid, imageCount);
    }

    var items = Array.prototype.slice.call(grid.querySelectorAll(".thumbnail-item"));
    var index = items.indexOf(item);
    if (index === -1) {
      return imageCount;
    }

    var rect = item.getBoundingClientRect();
    var isRightHalf = event.clientX > rect.left + rect.width / 2;
    return index + (isRightHalf ? 1 : 0);
  }

  function getThumbnailDropInsertIndexFromPosition(event, grid, imageCount) {
    var items = Array.prototype.slice.call(grid.querySelectorAll(".thumbnail-item"));
    if (items.length === 0) {
      return imageCount;
    }

    var pointerX = event.clientX;
    var pointerY = event.clientY;
    var bestIndex = imageCount;
    var bestDistance = Infinity;
    items.forEach(function (thumbnail, index) {
      var rect = thumbnail.getBoundingClientRect();
      var centerY = rect.top + rect.height / 2;
      var beforeX = rect.left;
      var afterX = rect.right;
      [
        { index: index, x: beforeX, y: centerY },
        { index: index + 1, x: afterX, y: centerY }
      ].forEach(function (candidate) {
        var distanceX = pointerX - candidate.x;
        var distanceY = pointerY - candidate.y;
        var distance = distanceX * distanceX + distanceY * distanceY;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = candidate.index;
        }
      });
    });
    return getImageInsertIndex(bestIndex, imageCount);
  }

  function getImageInsertIndex(index, length) {
    var parsedIndex = Number(index);
    if (!Number.isFinite(parsedIndex)) {
      return length;
    }
    return Math.min(Math.max(Math.floor(parsedIndex), 0), length);
  }

  function insertItemsAt(items, newItems, index) {
    var safeIndex = getImageInsertIndex(index, items.length);
    return items.slice(0, safeIndex).concat(newItems, items.slice(safeIndex));
  }

  function getFavoriteIndexAfterImageDelete(favoriteIndex, deletedIndex, replacementIndex) {
    if (favoriteIndex === deletedIndex) {
      return replacementIndex;
    }
    if (favoriteIndex > deletedIndex) {
      return favoriteIndex - 1;
    }
    return favoriteIndex;
  }

  function openOriginalImageOverlay(imagesOrSrc, imageIndex, alt, onSelect, options) {
    closeOriginalImageOverlay();
    var images = Array.isArray(imagesOrSrc) ? normalizeImages(imagesOrSrc) : normalizeImages(imagesOrSrc);
    var currentIndex = Math.min(Math.max(Number(imageIndex) || 0, 0), Math.max(images.length - 1, 0));
    var imageInfos = normalizeImageInfos(options && options.imageInfos, images.length);
    var imageNames = normalizeImageNames(options && options.imageNames, images.length, alt || "bild");
    var imageSources = normalizeImageSources(options && options.imageSources, images.length);
    var favoriteIndex = normalizeFavoriteImageIndex(options && options.favoriteIndex, images);
    var overlay = document.createElement("div");
    var content = document.createElement("div");
    var imageStage = document.createElement("div");
    var actionBar = document.createElement("div");
    overlay.className = "original-image-overlay";
    content.className = "original-image-content";
    imageStage.className = "original-image-stage";
    actionBar.className = "original-image-actions";
    overlay.tabIndex = -1;

    var image = document.createElement("img");
    image.className = "img-fit";
    image.src = images[currentIndex] || "";
    image.alt = alt || "";
    image.title = getImageInfoTooltip(imageInfos[currentIndex], imageNames[currentIndex]);

    var deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "hero-image-delete original-image-delete";
    deleteButton.appendChild(createIconImage("icon-delete.png"));
    deleteButton.addEventListener("click", function (event) {
      event.stopPropagation();
      if (deleteButton.disabled || !options || typeof options.onDelete !== "function") {
        return;
      }
      options.onDelete(currentIndex);
      closeOriginalImageOverlay();
    });

    var favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className = "hero-image-favorite original-image-favorite";
    favoriteButton.appendChild(createIconImage("icon-favorite.png"));
    favoriteButton.addEventListener("click", function (event) {
      event.stopPropagation();
      if (favoriteButton.disabled || currentIndex === favoriteIndex || !options || typeof options.onFavorite !== "function") {
        return;
      }
      options.onFavorite(currentIndex);
      closeOriginalImageOverlay();
    });

    var sourceButton = document.createElement("button");
    sourceButton.type = "button";
    sourceButton.className = "hero-image-source original-image-source";
    sourceButton.appendChild(createIconImage("icon-link.png"));
    sourceButton.addEventListener("click", function (event) {
      event.stopPropagation();
      if (options && options.manageSources && typeof options.onSource === "function") {
        var managedResult = options.onSource(currentIndex);
        if (managedResult && typeof managedResult.then === "function") {
          managedResult.then(function (value) {
            if (value !== null && value !== undefined) {
              imageSources[currentIndex] = value;
              updateOriginalImageActions();
            }
          });
        }
        return;
      }
      if (imageSources[currentIndex]) {
        openImageSource(imageSources[currentIndex]);
      }
    });

    var infoButton = createImageInfoButton(imageInfos[currentIndex], imageNames[currentIndex], function (event) {
      event.stopPropagation();
      if (!options || typeof options.onInfo !== "function") {
        return;
      }
      var result = options.onInfo(currentIndex);
      if (result && typeof result.then === "function") {
        result.then(function (value) {
          if (value !== null && value !== undefined) {
            imageInfos[currentIndex] = value;
            updateOriginalImageInfo();
          }
        });
      } else if (result !== null && result !== undefined) {
        imageInfos[currentIndex] = result;
        updateOriginalImageInfo();
      }
    });
    infoButton.classList.add("original-image-info");

    function updateOriginalImageActions() {
      var isFavorite = currentIndex === favoriteIndex;
      deleteButton.title = t("deleteImage");
      deleteButton.setAttribute("aria-label", t("deleteImage"));
      deleteButton.disabled = images.length <= 1 || !options || typeof options.onDelete !== "function";
      favoriteButton.classList.toggle("active", isFavorite);
      favoriteButton.title = isFavorite ? t("favoriteImage") : t("setFavoriteImage");
      favoriteButton.setAttribute("aria-label", favoriteButton.title);
      favoriteButton.disabled = !options || typeof options.onFavorite !== "function";
      sourceButton.title = options && options.manageSources ? t("manageImageSource") : t("imageSource");
      sourceButton.setAttribute("aria-label", sourceButton.title);
      sourceButton.disabled = !(options && options.manageSources) && !imageSources[currentIndex];
      sourceButton.classList.toggle("looks-disabled", Boolean(options && options.manageSources && !imageSources[currentIndex]));
      sourceButton.setAttribute("aria-disabled", options && options.manageSources && !imageSources[currentIndex] ? "true" : "false");
    }

    function updateOriginalImageInfo() {
      var tooltip = getImageInfoTooltip(imageInfos[currentIndex], imageNames[currentIndex]);
      var hasCurrentLanguageInfo = hasImageInfoForCurrentLanguage(imageInfos[currentIndex]);
      image.title = tooltip;
      infoButton.title = tooltip;
      infoButton.setAttribute("aria-label", hasCurrentLanguageInfo ? tooltip : t("editImageInfo"));
      infoButton.classList.toggle("active", hasCurrentLanguageInfo);
    }

    function updateOriginalImage(nextIndex) {
      currentIndex = Math.min(Math.max(nextIndex, 0), images.length - 1);
      image.src = images[currentIndex] || "";
      updateOriginalImageInfo();
      updateOriginalImageActions();
      if (navigation) {
        navigation.replaceWith(createOverlayImageNavigation());
        navigation = content.querySelector(".original-image-navigation");
      }
      if (typeof onSelect === "function") {
        onSelect(currentIndex);
      }
    }

    function handleOriginalImageKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeOriginalImageOverlay();
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        updateOriginalImage(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        updateOriginalImage(images.length - 1);
        return;
      }
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }
      event.preventDefault();
      updateOriginalImage(currentIndex + (event.key === "ArrowLeft" ? -1 : 1));
    }

    function createOverlayImageNavigation() {
      var navigationElement = createImageNavigationControls(images.length, currentIndex, {
        first: function () {
          updateOriginalImage(0);
        },
        previous: function () {
          updateOriginalImage(currentIndex - 1);
        },
        next: function () {
          updateOriginalImage(currentIndex + 1);
        },
        last: function () {
          updateOriginalImage(images.length - 1);
        }
      });
      navigationElement.classList.add("original-image-navigation");
      return navigationElement;
    }

    imageStage.appendChild(image);
    actionBar.appendChild(deleteButton);
    actionBar.appendChild(favoriteButton);
    actionBar.appendChild(sourceButton);
    actionBar.appendChild(infoButton);
    imageStage.appendChild(actionBar);
    updateOriginalImageActions();
    content.appendChild(imageStage);
    var navigation = null;
    if (images.length > 1) {
      navigation = createOverlayImageNavigation();
      content.appendChild(navigation);
    }
    overlay.appendChild(content);
    overlay._originalImageKeydownHandler = handleOriginalImageKeydown;
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay || event.target === content || event.target === image) {
        closeOriginalImageOverlay();
      }
    });
    document.body.appendChild(overlay);
    document.addEventListener("keydown", handleOriginalImageKeydown);
    overlay.focus();
  }

  function closeOriginalImageOverlay() {
    var overlay = document.querySelector(".original-image-overlay");
    if (overlay) {
      if (overlay._originalImageKeydownHandler) {
        document.removeEventListener("keydown", overlay._originalImageKeydownHandler);
      }
      overlay.remove();
    }
  }

  function createHeading(text) {
    var heading = document.createElement("h2");
    heading.textContent = text;
    heading.style.fontSize = getTitleFontSize(text);
    return heading;
  }

  function fitHeadingToOneLine(heading) {
    var size = parseFloat(window.getComputedStyle(heading).fontSize);
    while (heading.scrollWidth > heading.clientWidth && size > 20) {
      size -= 2;
      heading.style.fontSize = size + "px";
    }
  }

  function createNameGrid(flower) {
    var grid = document.createElement("div");
    grid.className = "name-grid";
    [
      ["hu", t("labelHu"), flower.names.hu],
      ["la", t("labelLa"), flower.names.la],
      ["de", t("labelDe"), flower.names.de],
      ["en", t("labelEn"), flower.names.en]
    ].forEach(function (entry) {
      var row = document.createElement("div");
      row.className = "name-row";
      var label = document.createElement("span");
      label.className = "name-label";
      label.title = entry[1];
      label.setAttribute("aria-label", entry[1]);
      label.appendChild(createNameLabelIcon(entry[0]));
      var value = document.createElement("span");
      value.className = "name-value";
      value.textContent = entry[2] || "—";
      row.appendChild(label);
      row.appendChild(value);
      grid.appendChild(row);
    });
    return grid;
  }

  function createNameLabelIcon(field) {
    var src = {
      hu: "flag-hu.png",
      la: "icon-latin.png",
      de: "flag-de.png",
      en: "flag-en.png"
    }[field] || "icon-latin.png";
    return createIconImage(src);
  }

  function createDescriptionSection(flower) {
    var section = document.createElement("section");
    section.className = "description-section";

    var tabs = document.createElement("div");
    tabs.className = "info-tabs";
    var activeTab = state.activeInfoTab === "links" ? "links" : "description";
    var links = normalizeLinks(flower.links);
    var descriptionButton = createDescriptionTabButton(activeTab === "description");
    var linksButton = createLinksTabButton(links.length);
    linksButton.classList.toggle("active", activeTab === "links");

    var descriptionPanel = document.createElement("div");
    descriptionPanel.className = "info-panel";
    var text = document.createElement("div");
    var description = getLocalizedDescription(flower);
    text.className = "description-content";
    if (!description) {
      text.className = "description-content empty-description";
      text.textContent = t("missingDescription");
    } else {
      text.innerHTML = description;
    }
    descriptionPanel.appendChild(text);
    descriptionPanel.classList.toggle("hidden", activeTab !== "description");

    var linksPanel = createLinksPanel(flower);
    linksPanel.classList.toggle("hidden", activeTab !== "links");

    descriptionButton.addEventListener("click", function () {
      state.activeInfoTab = "description";
      descriptionButton.classList.add("active");
      linksButton.classList.remove("active");
      descriptionPanel.classList.remove("hidden");
      linksPanel.classList.add("hidden");
    });

    linksButton.addEventListener("click", function () {
      state.activeInfoTab = "links";
      linksButton.classList.add("active");
      descriptionButton.classList.remove("active");
      linksPanel.classList.remove("hidden");
      descriptionPanel.classList.add("hidden");
    });

    tabs.appendChild(descriptionButton);
    tabs.appendChild(linksButton);
    section.appendChild(tabs);
    section.appendChild(descriptionPanel);
    section.appendChild(linksPanel);
    return section;
  }

  function createInfoTabButton(text, isActive) {
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    if (isActive) {
      button.classList.add("active");
    }
    return button;
  }

  function createDescriptionTabButton(isActive) {
    var button = createInfoTabButton("", isActive);
    var icon = createIconImage("icon-info.png");
    var label = document.createElement("span");
    button.classList.add("description-tab-button");
    button.title = t("descriptionTitle");
    button.setAttribute("aria-label", t("descriptionTitle"));
    label.textContent = t("descriptionTitle");
    button.appendChild(icon);
    button.appendChild(label);
    return button;
  }

  function createLinksTabButton(count) {
    var button = createInfoTabButton("", false);
    var icon = createIconImage("icon-link.png");
    var counter = document.createElement("span");
    button.classList.add("links-tab-button");
    button.title = t("linksTitle") + " [" + count + "]";
    button.setAttribute("aria-label", button.title);
    counter.className = "links-tab-count";
    counter.textContent = "[" + count + "]";
    button.appendChild(icon);
    button.appendChild(counter);
    return button;
  }

  function createLinksPanel(flower) {
    var panel = document.createElement("div");
    panel.className = "info-panel";
    var links = normalizeLinks(flower.links);

    if (links.length === 0) {
      var empty = document.createElement("div");
      empty.className = "description-content empty-description";
      empty.textContent = t("noLinks");
      panel.appendChild(empty);
      return panel;
    }

    var list = document.createElement("ul");
    list.className = "links-list";
    links.forEach(function (link) {
      var item = document.createElement("li");
      var anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = getLocalizedLinkName(link);
      item.appendChild(anchor);
      list.appendChild(item);
    });
    panel.appendChild(list);
    return panel;
  }

  function handleEditorToolbarClick(event) {
    var textColorButton = event.target.closest("button[data-editor-color]");
    var backgroundColorButton = event.target.closest("button[data-editor-background]");
    var button = event.target.closest("button[data-command]");
    if (textColorButton) {
      elements.descriptionColorInput.value = textColorButton.dataset.editorColor;
      formatDescription("foreColor", textColorButton.dataset.editorColor);
      return;
    }
    if (backgroundColorButton) {
      elements.descriptionBackgroundColorInput.value = backgroundColorButton.dataset.editorBackground;
      formatDescription("hiliteColor", backgroundColorButton.dataset.editorBackground);
      return;
    }
    if (!button) {
      return;
    }

    formatDescription(button.dataset.command);
  }

  function saveEditorSelection() {
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    var range = selection.getRangeAt(0);
    if (!elements.descriptionEditor.contains(range.commonAncestorContainer)) {
      return;
    }
    state.editorRange = range.cloneRange();
  }

  function restoreEditorSelection() {
    var selection = window.getSelection();
    if (!selection || !state.editorRange) {
      return;
    }
    selection.removeAllRanges();
    selection.addRange(state.editorRange);
  }

  function formatDescription(command, value) {
    elements.descriptionEditor.focus();
    restoreEditorSelection();
    if (applyCustomInlineFormat(command, value)) {
      saveEditorSelection();
      elements.descriptionEditor.focus();
      return;
    }
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value || null);
    saveEditorSelection();
    elements.descriptionEditor.focus();
  }

  function applyCustomInlineFormat(command, value) {
    var styles = {};
    if (command === "bold") {
      styles.fontWeight = "700";
    } else if (command === "italic") {
      styles.fontStyle = "italic";
    } else if (command === "underline") {
      styles.textDecoration = "underline";
    } else if (command === "foreColor") {
      styles.color = readSafeColor(value);
    } else if (command === "hiliteColor" || command === "backColor") {
      styles.backgroundColor = readSafeColor(value);
    } else if (command === "fontName") {
      styles.fontFamily = EDITOR_FONT_FAMILIES[value] || "";
    } else if (command === "fontSize") {
      styles.fontSize = EDITOR_FONT_SIZES[value] || "";
    } else {
      return false;
    }

    if (!styles.color && !styles.backgroundColor && !styles.fontFamily && !styles.fontSize && !styles.fontWeight && !styles.fontStyle && !styles.textDecoration) {
      return true;
    }

    return wrapEditorSelectionWithStyles(styles);
  }

  function wrapEditorSelectionWithStyles(styles) {
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return true;
    }

    var range = selection.getRangeAt(0);
    if (!elements.descriptionEditor.contains(range.commonAncestorContainer) || range.collapsed) {
      return true;
    }

    var wrapper = document.createElement("span");
    Object.keys(styles).forEach(function (property) {
      if (styles[property]) {
        wrapper.style[property] = styles[property];
      }
    });
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    selection.removeAllRanges();
    var nextRange = document.createRange();
    nextRange.selectNodeContents(wrapper);
    selection.addRange(nextRange);
    return true;
  }

  function renderStickyDetailActions(flower) {
    elements.topDetailActions.innerHTML = "";
    elements.topDetailActions.classList.toggle("hidden", !flower);
    if (!flower) {
      return;
    }

    elements.topDetailActions.appendChild(createImageMetadataDisplay(flower));
    elements.topDetailActions.appendChild(createDetailActions(flower));
  }

  function createImageMetadataDisplay(flower) {
    var display = document.createElement("div");
    display.className = "current-context-display";
    display.setAttribute("aria-live", "polite");
    display.textContent = t("imageMetadataReading");
    updateImageMetadataDisplay(display, flower);
    return display;
  }

  function updateImageMetadataDisplay(display, flower) {
    var images = getFlowerImages(flower);
    var image = images[getFlowerImageIndex(flower)] || "";
    if (!image) {
      display.textContent = t("imageMetadataUnavailable");
      return;
    }
    getImageDisplayMetadata(image).then(function (text) {
      display.textContent = text || t("imageMetadataUnavailable");
    });
  }

  function ensureCurrentContextUpdates() {
    if (state.currentInfoTimer) {
      return;
    }
    state.currentInfoTimer = window.setInterval(updateCurrentContextDisplays, 1000);
  }

  function updateCurrentContextDisplays() {
    document.querySelectorAll(".current-context-display").forEach(updateCurrentContextDisplay);
  }

  function updateCurrentContextDisplay(display) {
    var location = state.currentLocationName || t(state.currentLocationStatus === "loading" ? "currentLocationSearching" : "currentLocationUnavailable");
    display.textContent = formatCurrentDateTime(new Date()) + " · " + location;
  }

  function formatCurrentDateTime(date) {
    var localeByLanguage = {
      hu: "hu-HU",
      de: "de-DE",
      en: "en-GB"
    };
    return new Intl.DateTimeFormat(localeByLanguage[state.language] || "de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function requestCurrentLocationName() {
    if (state.currentLocationStatus !== "idle" || state.currentLocationName) {
      return;
    }
    if (!navigator.geolocation) {
      state.currentLocationStatus = "unavailable";
      updateCurrentContextDisplays();
      return;
    }
    state.currentLocationStatus = "loading";
    updateCurrentContextDisplays();
    navigator.geolocation.getCurrentPosition(function (position) {
      reverseGeocodeCurrentPosition(position.coords.latitude, position.coords.longitude);
    }, function () {
      state.currentLocationStatus = "unavailable";
      updateCurrentContextDisplays();
    }, {
      enableHighAccuracy: false,
      maximumAge: 600000,
      timeout: 9000
    });
  }

  function reverseGeocodeCurrentPosition(latitude, longitude) {
    var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + encodeURIComponent(latitude) + "&lon=" + encodeURIComponent(longitude) + "&zoom=10&addressdetails=1&accept-language=" + encodeURIComponent(state.language);
    fetch(url)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("reverse geocode failed");
        }
        return response.json();
      })
      .then(function (data) {
        state.currentLocationName = getLocationNameFromReverseGeocode(data);
        state.currentLocationStatus = state.currentLocationName ? "ready" : "unavailable";
        updateCurrentContextDisplays();
      })
      .catch(function () {
        state.currentLocationStatus = "unavailable";
        updateCurrentContextDisplays();
      });
  }

  function getLocationNameFromReverseGeocode(data) {
    var address = data && data.address ? data.address : {};
    return address.city || address.town || address.village || address.municipality || address.county || address.state || data.display_name || "";
  }

  function getImageDisplayMetadata(imageDataUrl) {
    var cacheKey = getImageMetadataCacheKey(imageDataUrl);
    if (state.imageMetadataCache[cacheKey]) {
      return formatImageDisplayMetadata(state.imageMetadataCache[cacheKey]);
    }
    return Promise.resolve()
      .then(function () {
        return extractImageMetadataFromDataUrl(imageDataUrl);
      })
      .then(function (metadata) {
        state.imageMetadataCache[cacheKey] = metadata;
        return formatImageDisplayMetadata(metadata);
      })
      .catch(function () {
        state.imageMetadataCache[cacheKey] = {};
        return "";
      });
  }

  function getImageMetadataCacheKey(imageDataUrl) {
    return String(imageDataUrl || "").length + ":" + String(imageDataUrl || "").slice(0, 96);
  }

  function formatImageDisplayMetadata(metadata) {
    var parts = [];
    if (metadata && metadata.takenAt) {
      parts.push(formatExifDateTime(metadata.takenAt));
    }
    if (metadata && Number.isFinite(metadata.latitude) && Number.isFinite(metadata.longitude)) {
      return getImageLocationName(metadata.latitude, metadata.longitude).then(function (locationName) {
        return parts.concat(locationName || t("imageLocationResolving")).filter(Boolean).join(" · ");
      });
    }
    return Promise.resolve(parts.join(" · "));
  }

  function formatExifDateTime(value) {
    var match = String(value || "").match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) {
      return String(value || "").trim();
    }
    var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6] || 0));
    return formatCurrentDateTime(date);
  }

  function getImageLocationName(latitude, longitude) {
    var key = latitude.toFixed(4) + "," + longitude.toFixed(4);
    if (state.imageLocationNameCache[key]) {
      return Promise.resolve(state.imageLocationNameCache[key]);
    }
    return reverseGeocodeCoordinates(latitude, longitude).then(function (locationName) {
      state.imageLocationNameCache[key] = locationName;
      return locationName;
    }).catch(function () {
      return latitude.toFixed(5) + ", " + longitude.toFixed(5);
    });
  }

  function reverseGeocodeCoordinates(latitude, longitude) {
    var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + encodeURIComponent(latitude) + "&lon=" + encodeURIComponent(longitude) + "&zoom=10&addressdetails=1&accept-language=" + encodeURIComponent(state.language);
    return fetch(url)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("reverse geocode failed");
        }
        return response.json();
      })
      .then(getLocationNameFromReverseGeocode);
  }

  function extractImageMetadataFromDataUrl(dataUrl) {
    if (!/^data:image\/jpe?g/i.test(String(dataUrl || ""))) {
      return {};
    }
    return parseExifFromJpegBytes(dataUrlToBytes(dataUrl));
  }

  function parseExifFromJpegBytes(bytes) {
    if (!bytes || bytes.length < 12 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
      return {};
    }
    var offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        break;
      }
      var marker = bytes[offset + 1];
      var length = readBigEndianUint16(bytes, offset + 2);
      var dataOffset = offset + 4;
      if (marker === 0xe1 && hasExifHeader(bytes, dataOffset)) {
        return parseExifTiff(bytes, dataOffset + 6);
      }
      offset += 2 + length;
    }
    return {};
  }

  function hasExifHeader(bytes, offset) {
    return bytes[offset] === 0x45 && bytes[offset + 1] === 0x78 && bytes[offset + 2] === 0x69 && bytes[offset + 3] === 0x66 && bytes[offset + 4] === 0 && bytes[offset + 5] === 0;
  }

  function parseExifTiff(bytes, tiffOffset) {
    var littleEndian = bytes[tiffOffset] === 0x49 && bytes[tiffOffset + 1] === 0x49;
    var bigEndian = bytes[tiffOffset] === 0x4d && bytes[tiffOffset + 1] === 0x4d;
    if (!littleEndian && !bigEndian) {
      return {};
    }
    var read16 = function (offset) {
      return littleEndian ? bytes[offset] | (bytes[offset + 1] << 8) : readBigEndianUint16(bytes, offset);
    };
    var read32 = function (offset) {
      return littleEndian ? (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0 : readBigEndianUint32(bytes, offset);
    };
    var firstIfdOffset = read32(tiffOffset + 4);
    var rootTags = readExifIfd(bytes, tiffOffset, tiffOffset + firstIfdOffset, read16, read32);
    var exifTags = rootTags[0x8769] ? readExifIfd(bytes, tiffOffset, tiffOffset + rootTags[0x8769], read16, read32) : {};
    var gpsTags = rootTags[0x8825] ? readExifIfd(bytes, tiffOffset, tiffOffset + rootTags[0x8825], read16, read32) : {};
    return {
      takenAt: exifTags[0x9003] || exifTags[0x9004] || rootTags[0x0132] || "",
      latitude: getGpsCoordinate(gpsTags[0x0001], gpsTags[0x0002]),
      longitude: getGpsCoordinate(gpsTags[0x0003], gpsTags[0x0004])
    };
  }

  function readExifIfd(bytes, tiffOffset, ifdOffset, read16, read32) {
    var tags = {};
    if (ifdOffset <= 0 || ifdOffset + 2 > bytes.length) {
      return tags;
    }
    var count = read16(ifdOffset);
    for (var index = 0; index < count; index += 1) {
      var entryOffset = ifdOffset + 2 + index * 12;
      if (entryOffset + 12 > bytes.length) {
        break;
      }
      var tag = read16(entryOffset);
      var type = read16(entryOffset + 2);
      var valueCount = read32(entryOffset + 4);
      tags[tag] = readExifValue(bytes, tiffOffset, entryOffset, type, valueCount, read32);
    }
    return tags;
  }

  function readExifValue(bytes, tiffOffset, entryOffset, type, count, read32) {
    var typeSize = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 }[type] || 1;
    var valueLength = typeSize * count;
    var valueOffset = valueLength <= 4 ? entryOffset + 8 : tiffOffset + read32(entryOffset + 8);
    if (valueOffset < 0 || valueOffset + valueLength > bytes.length) {
      return null;
    }
    if (type === 2) {
      return readExifAscii(bytes, valueOffset, count);
    }
    if (type === 5) {
      return readExifRationals(bytes, valueOffset, count, read32);
    }
    if (type === 3 || type === 4) {
      return read32(entryOffset + 8);
    }
    return null;
  }

  function readExifAscii(bytes, offset, count) {
    var text = "";
    for (var index = 0; index < count && offset + index < bytes.length; index += 1) {
      if (bytes[offset + index] === 0) {
        break;
      }
      text += String.fromCharCode(bytes[offset + index]);
    }
    return text.trim();
  }

  function readExifRationals(bytes, offset, count, read32) {
    var values = [];
    for (var index = 0; index < count; index += 1) {
      var numerator = read32(offset + index * 8);
      var denominator = read32(offset + index * 8 + 4);
      values.push(denominator ? numerator / denominator : 0);
    }
    return values;
  }

  function getGpsCoordinate(reference, values) {
    if (!Array.isArray(values) || values.length < 3) {
      return null;
    }
    var coordinate = values[0] + values[1] / 60 + values[2] / 3600;
    return reference === "S" || reference === "W" ? -coordinate : coordinate;
  }

  function readBigEndianUint16(bytes, offset) {
    return (bytes[offset] << 8) | bytes[offset + 1];
  }

  function readBigEndianUint32(bytes, offset) {
    return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
  }

  function createDetailActions(flower) {
    var actions = document.createElement("div");
    actions.className = "detail-actions";

    var previousButton = createActionButton(t("historyBack"), "icon-prev.png", "history-nav-button history-back-button nav-button icon-action compact-action");
    previousButton.title = t("historyBack");
    previousButton.disabled = !canNavigateDetailHistory(-1);
    previousButton.addEventListener("click", function () {
      navigateDetailHistory(-1);
    });

    var nextButton = createActionButton(t("historyForward"), "icon-next.png", "history-nav-button history-forward-button nav-button icon-action compact-action");
    nextButton.title = t("historyForward");
    nextButton.disabled = !canNavigateDetailHistory(1);
    nextButton.addEventListener("click", function () {
      navigateDetailHistory(1);
    });

    var previousListButton = createActionButton(t("previousFlower"), "icon-prev.png", "nav-button icon-action compact-action");
    previousListButton.title = t("previousFlower");
    previousListButton.addEventListener("click", function () {
      selectFlowerByOffset(-1);
    });

    var nextListButton = createActionButton(t("nextFlower"), "icon-next.png", "nav-button icon-action compact-action");
    nextListButton.title = t("nextFlower");
    nextListButton.addEventListener("click", function () {
      selectFlowerByOffset(1);
    });

    var exportSingleButton = createActionButton(t("exportSingleFlower"), "icon-export.png", "icon-action icon-only-action");
    exportSingleButton.addEventListener("click", function () {
      exportSingleFlower(flower);
    });

    var editButton = createActionButton(t("edit"), "icon-edit.png", "icon-action icon-only-action");
    editButton.addEventListener("click", function () {
      openForm(flower);
    });

    var deleteButton = createActionButton(t("delete"), "icon-delete.png", "icon-action icon-only-action danger");
    deleteButton.addEventListener("click", function () {
      confirmAndDelete(flower);
    });

    var addButton = createActionButton(t("newFlower"), "icon-add.png", "icon-action icon-only-action");
    addButton.addEventListener("click", function () {
      openForm();
    });

    var pdfButton = createActionButton(t("downloadPdf"), "icon-pdf.png", "icon-action icon-only-action");
    pdfButton.addEventListener("click", function () {
      downloadFlowerPdf(flower, pdfButton);
    });

    var webSearchButton = createActionButton(t("searchFlowerOnline"), "icon-web-search.png", "icon-action icon-only-action");
    webSearchButton.addEventListener("click", function () {
      searchFlowerOnline(flower);
    });

    var appInfoButton = createActionButton(t("appInfo"), "icon-info.png", "icon-action icon-only-action");
    appInfoButton.addEventListener("click", function () {
      openAppInfo();
    });

    actions.appendChild(previousButton);
    actions.appendChild(nextButton);
    actions.appendChild(previousListButton);
    actions.appendChild(nextListButton);
    actions.appendChild(exportSingleButton);
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    actions.appendChild(addButton);
    actions.appendChild(pdfButton);
    actions.appendChild(webSearchButton);
    actions.appendChild(appInfoButton);
    return actions;
  }

  function createActionButton(label, iconSrc, className) {
    var button = document.createElement("button");
    var image = document.createElement("img");
    var text = document.createElement("span");

    button.type = "button";
    button.className = className || "";
    button.title = label;
    button.setAttribute("aria-label", label);
    image.src = iconSrc;
    image.alt = "";
    text.textContent = label;

    button.appendChild(image);
    button.appendChild(text);
    return button;
  }

  function setActionButtonLabel(button, label) {
    var text = button.querySelector("span");
    if (text) {
      text.textContent = label;
    } else {
      button.textContent = label;
    }
    button.title = label;
    button.setAttribute("aria-label", label);
  }

  function getFlowerIndex(id) {
    return state.flowers.findIndex(function (flower) {
      return flower.id === id;
    });
  }

  function getNavigationFlowers() {
    return getVisibleFlowers();
  }

  function getNavigationFlowerIndex(id) {
    return getNavigationFlowers().findIndex(function (flower) {
      return flower.id === id;
    });
  }

  function setFlowerImageIndex(id, index, options) {
    state.imageIndexes[id] = Math.max(0, Math.floor(Number(index) || 0));
    if (options && options.updateHistory) {
      updateDetailHistory(id, {
        imageIndex: state.imageIndexes[id],
        replaceCurrentHistory: options.replaceCurrentHistory
      });
    }
  }

  function setSelectedFlower(id, options) {
    state.selectedId = id;
    updateDetailHistory(id, options || {});
  }

  function updateDetailHistory(id, options) {
    if (!id) {
      state.detailHistory = [];
      state.detailHistoryIndex = -1;
      return;
    }
    var entry = createDetailHistoryEntry(id, options || {});
    if (options.replaceHistory || state.detailHistoryIndex === -1) {
      state.detailHistory = [entry];
      state.detailHistoryIndex = 0;
      return;
    }
    if (options.replaceCurrentHistory && state.detailHistoryIndex >= 0) {
      state.detailHistory[state.detailHistoryIndex] = entry;
      return;
    }
    if (detailHistoryEntriesEqual(state.detailHistory[state.detailHistoryIndex], entry)) {
      return;
    }
    state.detailHistory = state.detailHistory.slice(0, state.detailHistoryIndex + 1);
    state.detailHistory.push(entry);
    state.detailHistoryIndex = state.detailHistory.length - 1;
  }

  function createDetailHistoryEntry(id, options) {
    var imageIndex = Number.isFinite(Number(options.imageIndex)) ? Number(options.imageIndex) : getHistoryImageIndexForFlower(id);
    return {
      id: id,
      imageIndex: Math.max(0, Math.floor(imageIndex || 0))
    };
  }

  function getHistoryEntryId(entry) {
    return entry && typeof entry === "object" ? entry.id : entry;
  }

  function getHistoryEntryImageIndex(entry) {
    return entry && typeof entry === "object" ? Math.max(0, Math.floor(Number(entry.imageIndex) || 0)) : 0;
  }

  function getHistoryImageIndexForFlower(id) {
    var flower = getFlowerById(id);
    if (!flower) {
      return 0;
    }
    return getFlowerImageIndex(flower);
  }

  function detailHistoryEntriesEqual(left, right) {
    return getHistoryEntryId(left) === getHistoryEntryId(right) && getHistoryEntryImageIndex(left) === getHistoryEntryImageIndex(right);
  }

  function canNavigateDetailHistory(offset) {
    var nextIndex = state.detailHistoryIndex + offset;
    return nextIndex >= 0 && nextIndex < state.detailHistory.length;
  }

  function navigateDetailHistory(offset) {
    if (!canNavigateDetailHistory(offset)) {
      return;
    }
    state.detailHistoryIndex += offset;
    var entry = state.detailHistory[state.detailHistoryIndex];
    var id = getHistoryEntryId(entry);
    if (!getFlowerById(id)) {
      state.detailHistory = state.detailHistory.filter(function (historyEntry) {
        return Boolean(getFlowerById(getHistoryEntryId(historyEntry)));
      });
      state.detailHistoryIndex = Math.min(state.detailHistoryIndex, state.detailHistory.length - 1);
      return;
    }
    state.selectedId = id;
    state.imageIndexes[id] = getHistoryEntryImageIndex(entry);
    var target = getSelectedFlower();
    if (target) {
      selectFilterMatchLanguage(target, normalizeSearchText(elements.filterInput.value));
    }
    closeForm();
    render();
    scrollToFlower(state.selectedId);
  }

  function selectFlowerByOffset(offset) {
    var flowers = getNavigationFlowers();
    var target = getSearchNavigationTarget(flowers, offset);
    if (!target) {
      return;
    }

    setSelectedFlower(target.id);
    selectFilterMatchLanguage(target, normalizeSearchText(elements.filterInput.value));
    selectSearchMatchImage(target, normalizeSearchText(elements.searchInput.value));
    closeForm();
    render();
    scrollToFlower(state.selectedId);
  }

  function selectFlowerEdge(edge) {
    var flowers = getNavigationFlowers();
    var target = edge === "first" ? flowers[0] : flowers[flowers.length - 1];
    if (!target) {
      return;
    }

    setSelectedFlower(target.id);
    selectFilterMatchLanguage(target, normalizeSearchText(elements.filterInput.value));
    selectSearchMatchImage(target, normalizeSearchText(elements.searchInput.value));
    closeForm();
    render();
    scrollToFlower(state.selectedId);
  }

  function searchFlowerOnline(flower) {
    var query = getOnlineSearchName(flower);
    if (!query) {
      return;
    }
    window.open("https://www.google.com/search?q=" + encodeURIComponent(query), "_blank", "noopener");
  }

  function openAppInfo() {
    window.open("app-info.html?lang=" + encodeURIComponent(state.language), "_blank", "noopener");
  }

  function openImageSource(sourceUrl) {
    if (!sourceUrl) {
      window.alert(t("noImageSource"));
      return;
    }
    window.open(sourceUrl, "_blank", "noopener");
  }

  function normalizeImageSourceInput(value) {
    return String(value || "").replace(/[\r\n]+/g, " ").trim();
  }

  function promptImageSource(currentSource) {
    return openImageSourceDialog(currentSource);
  }

  function openImageSourceDialog(currentSource) {
    return new Promise(function (resolve) {
      var overlay = document.createElement("div");
      var panel = document.createElement("div");
      var title = document.createElement("h2");
      var form = document.createElement("form");
      var label = document.createElement("label");
      var input = document.createElement("input");
      var saveButton = document.createElement("button");
      var cancelButton = document.createElement("button");
      var finished = false;

      function finish(value) {
        if (finished) {
          return;
        }
        finished = true;
        overlay.remove();
        document.removeEventListener("keydown", handleEscape, true);
        resolve(value);
      }

      function handleEscape(event) {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          finish(null);
        }
      }

      overlay.className = "online-search-overlay image-info-overlay";
      panel.className = "online-search-panel image-info-panel";
      form.className = "online-search-form image-info-form";
      title.textContent = t("manageImageSource");
      label.textContent = t("imageSourcePrompt");
      label.setAttribute("for", "imageSourceInput");
      input.id = "imageSourceInput";
      input.type = "url";
      input.autocomplete = "off";
      input.value = currentSource || "";
      saveButton.type = "submit";
      configureDialogIconButton(saveButton, t("save"), "icon-save.png");
      cancelButton.type = "button";
      configureDialogIconButton(cancelButton, t("cancel"), "icon-exit.png");

      form.appendChild(label);
      form.appendChild(input);
      form.appendChild(saveButton);
      form.appendChild(cancelButton);
      panel.appendChild(title);
      panel.appendChild(form);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        finish(normalizeImageSourceInput(input.value));
      });
      cancelButton.addEventListener("click", function () {
        finish(null);
      });
      document.addEventListener("keydown", handleEscape, true);

      window.setTimeout(function () {
        input.focus();
        input.select();
      });
    });
  }

  function createImageInfoButton(infoText, imageName, onClick) {
    var button = document.createElement("button");
    var hasInfo = hasImageInfoForCurrentLanguage(infoText);
    var tooltip = getImageInfoTooltip(infoText, imageName);
    button.type = "button";
    button.className = "hero-image-info" + (hasInfo ? " active" : "");
    button.title = tooltip;
    button.setAttribute("aria-label", hasInfo ? tooltip : t("editImageInfo"));
    button.appendChild(createIconImage("icon-info.png"));
    button.addEventListener("click", onClick);
    return button;
  }

  function getImageInfoTooltip(infoText, imageName) {
    return getLocalizedImageInfo(infoText) || String(imageName || "").trim() || t("imageInfo");
  }

  function hasImageInfoForCurrentLanguage(infoText) {
    return Boolean(getImageInfoForLanguage(infoText, state.language));
  }

  function getLocalizedImageInfo(infoText) {
    var info = normalizeImageInfoEntry(infoText);
    var preferredLanguages = getImageInfoFallbackLanguages(state.language);
    for (var index = 0; index < preferredLanguages.length; index += 1) {
      var value = info[preferredLanguages[index]];
      if (value) {
        return value;
      }
    }
    return "";
  }

  function getImageInfoForLanguage(infoText, language) {
    return normalizeImageInfoEntry(infoText)[language] || "";
  }

  function setImageInfoForLanguage(infoText, language, value) {
    var info = normalizeImageInfoEntry(infoText);
    info[language] = String(value || "").replace(/[\r\n]+/g, " ").trim();
    return info;
  }

  function getImageInfoFallbackLanguages(language) {
    if (language === "hu") {
      return ["hu", "de", "en"];
    }
    if (language === "en") {
      return ["en", "hu", "de"];
    }
    return ["de", "hu", "en"];
  }

  function getImageInfoLanguageLabelKey(language) {
    return {
      hu: "labelHu",
      de: "labelDe",
      en: "labelEn"
    }[language] || "labelDe";
  }

  function promptImageInfo(currentInfo) {
    var language = state.language;
    return openImageInfoDialog(currentInfo, language).then(function (value) {
      if (value === null) {
        return null;
      }
      return {
        language: language,
        text: value
      };
    });
  }

  function openImageInfoDialog(currentInfo, language) {
    return new Promise(function (resolve) {
      var overlay = document.createElement("div");
      var panel = document.createElement("div");
      var title = document.createElement("h2");
      var form = document.createElement("form");
      var label = document.createElement("label");
      var input = document.createElement("input");
      var saveButton = document.createElement("button");
      var cancelButton = document.createElement("button");
      var finished = false;

      function finish(value) {
        if (finished) {
          return;
        }
        finished = true;
        overlay.remove();
        document.removeEventListener("keydown", handleEscape);
        resolve(value);
      }

      function handleEscape(event) {
        if (event.key === "Escape") {
          finish(null);
        }
      }

      overlay.className = "online-search-overlay image-info-overlay";
      panel.className = "online-search-panel image-info-panel";
      form.className = "online-search-form image-info-form";
      title.textContent = t("imageInfo");
      label.textContent = t("imageInfoPrompt", { language: t(getImageInfoLanguageLabelKey(language)) });
      label.setAttribute("for", "imageInfoInput");
      input.id = "imageInfoInput";
      input.type = "text";
      input.autocomplete = "off";
      input.value = getImageInfoForLanguage(currentInfo, language);
      saveButton.type = "submit";
      configureDialogIconButton(saveButton, t("save"), "icon-save.png");
      cancelButton.type = "button";
      configureDialogIconButton(cancelButton, t("cancel"), "icon-exit.png");

      form.appendChild(label);
      form.appendChild(input);
      form.appendChild(saveButton);
      form.appendChild(cancelButton);
      panel.appendChild(title);
      panel.appendChild(form);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        finish(String(input.value || "").replace(/[\r\n]+/g, " ").trim());
      });
      cancelButton.addEventListener("click", function () {
        finish(null);
      });
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
          finish(null);
        }
      });
      document.addEventListener("keydown", handleEscape);

      window.setTimeout(function () {
        input.focus();
        input.select();
      });
    });
  }

  function editFlowerImageInfo(flower, imageIndex, options) {
    var images = getFlowerImages(flower);
    var imageInfos = getFlowerImageInfos(flower);
    if (imageIndex < 0 || imageIndex >= images.length) {
      return Promise.resolve(null);
    }

    return promptImageInfo(imageInfos[imageIndex]).then(function (result) {
      if (result === null) {
        return null;
      }

      imageInfos[imageIndex] = setImageInfoForLanguage(imageInfos[imageIndex], result.language, result.text);
      var updatedFlower = Object.assign({}, flower, {
        imageInfos: imageInfos,
        updatedAt: new Date().toISOString()
      });
      return saveFlower(updatedFlower)
        .then(loadFlowers)
        .then(function () {
          setSelectedFlower(flower.id);
          render();
          if (options && options.reopenThumbnails) {
            var refreshedFlower = getSelectedFlower();
            if (refreshedFlower) {
              openThumbnailChooserForFlower(refreshedFlower);
            }
          }
          return imageInfos[imageIndex];
        });
    }).catch(function () {
      window.alert(t("saveFailed"));
      return null;
    });
  }

  function editFlowerImageSource(flower, imageIndex, options) {
    var images = getFlowerImages(flower);
    var imageSources = getFlowerImageSources(flower);
    if (imageIndex < 0 || imageIndex >= images.length) {
      return Promise.resolve(null);
    }

    return promptImageSource(imageSources[imageIndex]).then(function (value) {
      if (value === null) {
        return null;
      }

      imageSources[imageIndex] = value;
      var updatedFlower = Object.assign({}, flower, {
        imageSources: imageSources,
        updatedAt: new Date().toISOString()
      });
      return saveFlower(updatedFlower)
        .then(loadFlowers)
        .then(function () {
          setSelectedFlower(flower.id);
          render();
          if (options && options.reopenThumbnails) {
            var refreshedFlower = getSelectedFlower();
            if (refreshedFlower) {
              openThumbnailChooserForFlower(refreshedFlower);
            }
          }
          return imageSources[imageIndex];
        });
    }).catch(function () {
      window.alert(t("saveFailed"));
      return null;
    });
  }

  function editPendingImageInfo(imageIndex, options) {
    var images = normalizeImages(state.pendingImages);
    var imageInfos = normalizeImageInfos(state.pendingImageInfos, images.length);
    if (imageIndex < 0 || imageIndex >= images.length) {
      return Promise.resolve(null);
    }

    return promptImageInfo(imageInfos[imageIndex]).then(function (result) {
      if (result === null) {
        return null;
      }
      imageInfos[imageIndex] = setImageInfoForLanguage(imageInfos[imageIndex], result.language, result.text);
      state.pendingImageInfos = imageInfos;
      renderImagePreview(state.pendingImages);
      if (options && options.reopenThumbnails) {
        openThumbnailChooserForPendingImages();
      }
      return imageInfos[imageIndex];
    });
  }

  function editPendingImageSource(imageIndex, options) {
    var images = normalizeImages(state.pendingImages);
    var imageSources = normalizeImageSources(state.pendingImageSources, images.length);
    if (imageIndex < 0 || imageIndex >= images.length) {
      return Promise.resolve(null);
    }

    return promptImageSource(imageSources[imageIndex]).then(function (value) {
      if (value === null) {
        return null;
      }
      imageSources[imageIndex] = value;
      state.pendingImageSources = imageSources;
      renderImagePreview(state.pendingImages);
      if (options && options.reopenThumbnails) {
        openThumbnailChooserForPendingImages();
      }
      return imageSources[imageIndex];
    });
  }

  function getOnlineSearchName(flower) {
    if (!flower || !flower.names) {
      return "";
    }
    var localizedName = getLocalizedFlowerName(flower);
    return getFirstNamePart(localizedName) || flower.names.la || flower.names.hu || "";
  }

  function openForm(flower) {
    var currentFlower = flower || null;
    state.editingId = currentFlower ? currentFlower.id : "";
    state.pendingImages = currentFlower ? getFlowerImages(currentFlower) : [];
    state.pendingImageSources = currentFlower ? getFlowerImageSources(currentFlower) : [];
    state.pendingImageNames = currentFlower ? getFlowerImageNames(currentFlower) : [];
    state.pendingImageInfos = currentFlower ? getFlowerImageInfos(currentFlower) : [];
    state.pendingImageData = state.pendingImages[0] || "";
    state.pendingImageIndex = 0;
    state.pendingFavoriteImageIndex = currentFlower ? getFavoriteImageIndex(currentFlower) : 0;
    elements.formModeLabel.textContent = currentFlower ? t("edit") : t("newFlower");
    elements.nameHu.value = currentFlower ? currentFlower.names.hu : "";
    elements.nameLa.value = currentFlower ? currentFlower.names.la : "";
    elements.nameDe.value = currentFlower ? currentFlower.names.de : "";
    elements.nameEn.value = currentFlower ? currentFlower.names.en : "";
    state.descriptionLanguage = state.language;
    state.descriptionDrafts = currentFlower ? normalizeDescription(currentFlower.description) : { hu: "", de: "", en: "" };
    elements.descriptionEditor.innerHTML = state.descriptionDrafts[state.descriptionLanguage] || "";
    state.editorRange = null;
    updateDescriptionLanguageTabs();
    renderLinksEditor(currentFlower ? currentFlower.links : []);
    state.lastLookupLatinName = "";
    elements.imageInput.value = "";
    clearFormError();
    renderImagePreview(state.pendingImages);
    render();
    elements.nameHu.focus();
  }

  function closeForm() {
    saveCurrentDescriptionDraft();
    state.editingId = null;
    state.pendingImageData = "";
    state.pendingImages = [];
    state.pendingImageSources = [];
    state.pendingImageNames = [];
    state.pendingImageInfos = [];
    state.pendingImageIndex = 0;
    state.pendingFavoriteImageIndex = 0;
    state.lastLookupLatinName = "";
    state.descriptionDrafts = { hu: "", de: "", en: "" };
    state.editorRange = null;
    elements.linksEditorList.innerHTML = "";
    window.clearTimeout(state.autoFillTimer);
    elements.flowerForm.reset();
    clearFormError();
    setAutoFillStatus("");
  }

  function saveFlowerFromForm() {
    autoFillNamesFromLatin(true).then(function () {
      persistFlowerFromForm();
    });
  }

  function persistFlowerFromForm() {
    saveCurrentDescriptionDraft();
    var hu = elements.nameHu.value.trim();
    var images = normalizeImages(state.pendingImages);
    var imageSources = normalizeImageSources(state.pendingImageSources, images.length);
    var imageNames = normalizeImageNames(state.pendingImageNames, images.length, hu || "blume");
    var imageInfos = normalizeImageInfos(state.pendingImageInfos, images.length);
    var imageData = images[0] || "";
    var favoriteImageIndex = normalizeFavoriteImageIndex(state.pendingFavoriteImageIndex, images);

    if (!hu) {
      showFormError(t("huRequired"));
      elements.nameHu.focus();
      return;
    }

    if (!imageData) {
      showFormError(t("imageRequired"));
      return;
    }

    var flower = {
      id: state.editingId || createId(),
      names: {
        hu: hu,
        la: elements.nameLa.value.trim(),
        de: elements.nameDe.value.trim(),
        en: elements.nameEn.value.trim()
      },
      description: {
        hu: state.descriptionDrafts.hu,
        de: state.descriptionDrafts.de,
        en: state.descriptionDrafts.en
      },
      links: collectLinksFromForm(),
      imageData: imageData,
      images: images,
      imageSources: imageSources,
      imageNames: imageNames,
      imageInfos: imageInfos,
      favoriteImageIndex: favoriteImageIndex,
      updatedAt: new Date().toISOString()
    };

    saveFlower(flower)
      .then(loadFlowers)
      .then(function () {
        setSelectedFlower(flower.id);
        closeForm();
        render();
      })
      .catch(function () {
        showFormError(t("saveFailed"));
      });
  }

  function scheduleAutoFillFromLatin() {
    window.clearTimeout(state.autoFillTimer);
    state.autoFillTimer = window.setTimeout(function () {
      autoFillNamesFromLatin(false);
    }, 900);
  }

  function autoFillNamesFromLatin(force) {
    var latinName = elements.nameLa.value.trim();

    if (!latinName) {
      state.lastLookupLatinName = "";
      setAutoFillStatus("");
      return Promise.resolve();
    }

    if (!force && latinName === state.lastLookupLatinName) {
      return Promise.resolve();
    }

    if (!window.fetch) {
      setAutoFillStatus(t("autoFillUnavailable"), true);
      return Promise.resolve();
    }

    if (window.navigator && window.navigator.onLine === false) {
      setAutoFillStatus(t("offline"), true);
      return Promise.resolve();
    }

    state.lastLookupLatinName = latinName;
    setAutoFillStatus(t("lookupSearching"));

    return fetchNamesFromWikidata(latinName)
      .then(function (names) {
        if (!names) {
          setAutoFillStatus(t("lookupNoMatch"), true);
          return;
        }

        var added = fillEmptyNameFields(names);
        if (added.length === 0) {
          setAutoFillStatus(t("lookupFoundNoOverwrite"));
          return;
        }

        setAutoFillStatus(t("lookupAdded", { fields: added.join(", ") }));
      })
      .catch(function () {
        setAutoFillStatus(t("lookupFailed"), true);
      });
  }

  function fetchNamesFromWikidata(latinName) {
    var controller = window.AbortController ? new AbortController() : null;
    var timeoutId = window.setTimeout(function () {
      if (controller) {
        controller.abort();
      }
    }, 8000);
    var query = [
      "SELECT ?hu ?de ?en WHERE {",
      "  ?item wdt:P225 " + sparqlString(latinName) + ".",
      "  OPTIONAL { ?item rdfs:label ?hu FILTER(LANG(?hu) = \"hu\") }",
      "  OPTIONAL { ?item rdfs:label ?de FILTER(LANG(?de) = \"de\") }",
      "  OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en) = \"en\") }",
      "} LIMIT 1"
    ].join("\n");
    var url = "https://query.wikidata.org/sparql?format=json&origin=*&query=" + encodeURIComponent(query);

    return fetch(url, {
      headers: {
        Accept: "application/sparql-results+json"
      },
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("lookup failed");
        }
        return response.json();
      })
      .then(function (data) {
        var rows = data && data.results && data.results.bindings;
        if (!rows || rows.length === 0) {
          return null;
        }

        return {
          hu: bindingValue(rows[0].hu),
          de: bindingValue(rows[0].de),
          en: bindingValue(rows[0].en)
        };
      })
      .finally(function () {
        window.clearTimeout(timeoutId);
      });
  }

  function fillEmptyNameFields(names) {
    var added = [];

    if (!elements.nameHu.value.trim() && names.hu) {
      elements.nameHu.value = names.hu;
      added.push(t("labelHu"));
    }
    if (!elements.nameDe.value.trim() && names.de) {
      elements.nameDe.value = names.de;
      added.push(t("labelDe"));
    }
    if (!elements.nameEn.value.trim() && names.en) {
      elements.nameEn.value = names.en;
      added.push(t("labelEn"));
    }

    return added;
  }

  function createFlowerFromInternet() {
    if (!window.fetch) {
      window.alert(t("autoFillUnavailable"));
      return;
    }
    if (window.navigator && window.navigator.onLine === false) {
      window.alert(t("offline"));
      return;
    }

    openOnlineFlowerSearchDialog()
      .then(function (selection) {
        if (!selection) {
          return null;
        }
        elements.createOnlineFlowerButton.disabled = true;
        elements.createOnlineFlowerButton.title = t("createOnlineFlowerSearching");
        return fetchFlowerOnlineData(selection.searchName, selection.candidate);
      })
      .then(function (flower) {
        if (!flower) {
          return null;
        }
        if (!flower.images.length) {
          window.alert(t("createOnlineFlowerNoImage"));
          return null;
        }
        return saveFlower(flower).then(function () {
          return flower;
        });
      })
      .then(function (flower) {
        if (!flower) {
          return null;
        }
        return loadFlowers().then(function () {
          setSelectedFlower(flower.id);
          closeForm();
          render();
          scrollToFlower(flower.id);
          window.alert(t("createOnlineFlowerDone", { count: flower.images.length }));
        });
      })
      .catch(function () {
        window.alert(t("createOnlineFlowerFailed"));
      })
      .finally(function () {
        elements.createOnlineFlowerButton.disabled = false;
        elements.createOnlineFlowerButton.title = t("createOnlineFlower");
      });
  }

  function openOnlineFlowerSearchDialog() {
    return new Promise(function (resolve) {
      var overlay = document.createElement("div");
      var panel = document.createElement("div");
      var title = document.createElement("h2");
      var form = document.createElement("form");
      var label = document.createElement("label");
      var input = document.createElement("input");
      var searchButton = document.createElement("button");
      var cancelButton = document.createElement("button");
      var historyPanel = document.createElement("div");
      var status = document.createElement("p");
      var list = document.createElement("div");
      var finished = false;

      function finish(value) {
        if (finished) {
          return;
        }
        finished = true;
        overlay.remove();
        document.removeEventListener("keydown", handleEscape);
        resolve(value || null);
      }

      function handleEscape(event) {
        if (event.key === "Escape") {
          finish(null);
        }
      }

      overlay.className = "online-search-overlay";
      panel.className = "online-search-panel";
      title.textContent = t("onlineSearchTitle");
      form.className = "online-search-form";
      label.textContent = getCreateOnlineFlowerPrompt();
      label.setAttribute("for", "onlineFlowerSearchInput");
      input.id = "onlineFlowerSearchInput";
      input.type = "text";
      input.autocomplete = "off";
      input.placeholder = t("onlineSearchInputLabel");
      searchButton.type = "submit";
      configureDialogIconButton(searchButton, t("search"), "icon-search-flower-upload.png");
      cancelButton.type = "button";
      configureDialogIconButton(cancelButton, t("onlineSearchCancel"), "icon-exit.png");
      historyPanel.className = "online-search-history";
      status.className = "online-search-status";
      list.className = "online-search-results";

      form.appendChild(label);
      form.appendChild(input);
      form.appendChild(searchButton);
      form.appendChild(cancelButton);
      panel.appendChild(title);
      panel.appendChild(form);
      panel.appendChild(historyPanel);
      panel.appendChild(status);
      panel.appendChild(list);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      renderOnlineSearchHistory(historyPanel, input);

      cancelButton.addEventListener("click", function () {
        finish(null);
      });
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
          finish(null);
        }
      });
      document.addEventListener("keydown", handleEscape);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var searchName = input.value.trim();
        if (!searchName) {
          input.focus();
          return;
        }

        searchButton.disabled = true;
        status.textContent = t("createOnlineFlowerSearching");
        list.innerHTML = "";
        saveOnlineSearchHistory(searchName);
        renderOnlineSearchHistory(historyPanel, input);

        fetchFlowerOnlineCandidates(searchName).then(function (candidates) {
          status.textContent = candidates.length ? t("onlineSearchSelect") : t("createOnlineFlowerNoMatch");
          renderOnlineFlowerCandidates(list, candidates, searchName, finish);
        }).catch(function () {
          status.textContent = t("createOnlineFlowerFailed");
        }).finally(function () {
          searchButton.disabled = false;
        });
      });

      window.setTimeout(function () {
        input.focus();
      });
    });
  }

  function renderOnlineFlowerCandidates(container, candidates, searchName, finish) {
    container.innerHTML = "";
    candidates.forEach(function (candidate) {
      var button = document.createElement("button");
      var name = document.createElement("strong");
      var meta = document.createElement("span");
      button.type = "button";
      button.className = "online-search-result";
      name.textContent = getOnlineCandidateTitle(candidate);
      meta.textContent = getOnlineCandidateMeta(candidate);
      button.appendChild(name);
      button.appendChild(meta);
      button.addEventListener("click", function () {
        finish({
          searchName: searchName,
          candidate: candidate
        });
      });
      container.appendChild(button);
    });
  }

  function getOnlineCandidateTitle(candidate) {
    var names = candidate.names || {};
    return names[state.language] || names.hu || names.de || names.en || names.la || candidate.searchTerm || "";
  }

  function getOnlineCandidateMeta(candidate) {
    var names = candidate.names || {};
    var parts = [];
    if (names.la && names.la !== getOnlineCandidateTitle(candidate)) {
      parts.push(names.la);
    }
    if (candidate.searchTerm) {
      parts.push(t("search") + ": " + candidate.searchTerm);
    }
    return parts.join(" / ");
  }

  function renderOnlineSearchHistory(container, input) {
    var history = loadOnlineSearchHistory();
    container.innerHTML = "";
    if (!history.length) {
      return;
    }

    var title = document.createElement("span");
    var chips = document.createElement("div");
    var clearButton = document.createElement("button");

    title.className = "online-search-history-title";
    title.textContent = t("onlineSearchHistory");
    chips.className = "online-search-history-chips";
    clearButton.type = "button";
    clearButton.className = "online-search-history-clear";
    configureDialogIconButton(clearButton, t("onlineSearchClearHistory"), "icon-delete.png");
    clearButton.addEventListener("click", function () {
      clearOnlineSearchHistory();
      renderOnlineSearchHistory(container, input);
      input.focus();
    });

    history.forEach(function (term) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "online-search-history-chip";
      chip.textContent = term;
      chip.addEventListener("click", function () {
        input.value = term;
        input.focus();
        input.select();
      });
      chips.appendChild(chip);
    });

    container.appendChild(title);
    container.appendChild(chips);
    container.appendChild(clearButton);
  }

  function loadOnlineSearchHistory() {
    try {
      var parsed = JSON.parse(localStorage.getItem(ONLINE_SEARCH_HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.map(function (term) {
        return String(term || "").trim();
      }).filter(Boolean).slice(0, 12) : [];
    } catch (error) {
      return [];
    }
  }

  function saveOnlineSearchHistory(term) {
    var cleanTerm = String(term || "").trim();
    if (!cleanTerm) {
      return;
    }
    var lowerTerm = cleanTerm.toLocaleLowerCase();
    var history = loadOnlineSearchHistory().filter(function (item) {
      return item.toLocaleLowerCase() !== lowerTerm;
    });
    history.unshift(cleanTerm);
    localStorage.setItem(ONLINE_SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
  }

  function clearOnlineSearchHistory() {
    localStorage.removeItem(ONLINE_SEARCH_HISTORY_KEY);
  }

  function getCreateOnlineFlowerPrompt() {
    if (state.language === "hu") {
      return t("createOnlineFlowerPromptHu");
    }
    if (state.language === "de") {
      return t("createOnlineFlowerPromptDe");
    }
    if (state.language === "en") {
      return t("createOnlineFlowerPromptEn");
    }
    return t("createOnlineFlowerPrompt");
  }

  function fetchFlowerOnlineCandidates(searchName) {
    var variants = buildOnlineSearchVariants(searchName).slice(0, 4);
    var languages = getOnlineSearchLanguages();
    var tasks = [];

    variants.forEach(function (variant, variantIndex) {
      languages.forEach(function (language) {
        tasks.push(function () {
          return fetchWikidataSearchResults(variant, language).then(function (results) {
            return results.map(function (result, resultIndex) {
              return {
                id: result.id,
                searchTerm: variant,
                sourceLanguage: language,
                score: (variants.length - variantIndex) * 100 - resultIndex
              };
            });
          }).catch(function () {
            return [];
          });
        });
      });
    });

    return runPromiseQueue(tasks).then(function (groups) {
      var summaries = [];
      var seen = {};

      [].concat.apply([], groups).forEach(function (summary) {
        if (!summary.id || seen[summary.id]) {
          return;
        }
        seen[summary.id] = true;
        summaries.push(summary);
      });

      summaries.sort(function (a, b) {
        return b.score - a.score;
      });

      return fetchWikidataEntities(summaries.slice(0, 12).map(function (summary) {
        return summary.id;
      })).then(function (entities) {
        return summaries.map(function (summary) {
          var entity = entities[summary.id];
          if (!entity || !isPlantEntity(entity)) {
            return null;
          }
          return {
            id: summary.id,
            entity: entity,
            searchTerm: summary.searchTerm,
            sourceLanguage: summary.sourceLanguage,
            score: summary.score,
            names: getNamesFromWikidataEntity(entity, searchName)
          };
        }).filter(Boolean).slice(0, 8);
      });
    });
  }

  function getOnlineSearchLanguages() {
    if (state.language === "hu") {
      return ["hu", "en", "de"];
    }
    if (state.language === "en") {
      return ["en", "hu", "de"];
    }
    return ["de", "en", "hu"];
  }

  function fetchFlowerOnlineData(searchName, candidate) {
    var entity = candidate.entity;
    var names = getNamesFromWikidataEntity(entity, searchName);
    var preferredLatinName = getPreferredLatinNameFromInput(searchName, names.la);
    var sitelinks = getSitelinksFromWikidataEntity(entity);

    names = preserveSearchNameForSelectedLanguage(names, searchName, preferredLatinName);

    return Promise.all([
      fetchDescriptionsForSitelinks(sitelinks, entity),
      fetchOnlineImages(entity, names, searchName)
    ]).then(function (results) {
      var description = results[0];
      var imageResult = results[1];
      var images = imageResult.images;
      return {
        id: createId(),
        names: names,
        description: description,
        links: getOnlineLinksFromSitelinks(sitelinks),
        imageData: images[0] || "",
        images: images,
        imageSources: imageResult.sources,
        imageNames: normalizeImageNames([], images.length, getImageBaseNameForFlower({ names: names })),
        imageInfos: normalizeImageInfos([], images.length),
        favoriteImageIndex: 0,
        updatedAt: new Date().toISOString()
      };
    });
  }

  function buildOnlineSearchVariants(searchName) {
    var normalized = normalizeOnlineSearchText(searchName);
    var variants = [normalized];
    var slashParts = normalized.split("/").map(function (part) {
      return part.trim();
    }).filter(Boolean);
    var latinPart = slashParts.find(function (part) {
      return getLatinBaseName(part);
    });

    slashParts.forEach(function (part) {
      variants.push(part);
    });

    if (latinPart) {
      variants.push(latinPart);
      variants.push(removeCultivarWords(latinPart));
    }

    variants.push(removeCultivarWords(normalized));
    variants.push(getLatinBaseName(normalized));

    return uniqueValues(variants.map(function (variant) {
      return normalizeOnlineSearchText(variant);
    }).filter(function (variant) {
      return variant.length >= 3;
    })).slice(0, 8);
  }

  function normalizeOnlineSearchText(value) {
    return String(value || "")
      .replace(/[‘’`´]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/\s+/g, " ")
      .trim();
  }

  function removeCultivarWords(value) {
    var text = normalizeOnlineSearchText(value)
      .replace(/'[^']+'/g, " ")
      .replace(/"[^"]+"/g, " ")
      .replace(/\b(alba|white|baby|swan|cappuccino|cultivar|var\.?|cv\.?)\b/ig, " ")
      .replace(/\s+/g, " ")
      .trim();
    return getLatinBaseName(text) || text;
  }

  function getLatinBaseName(value) {
    var match = normalizeOnlineSearchText(value).match(/\b([A-Za-z][A-Za-z-]+)\s+([a-z][a-z-]+)\b/);
    if (!match) {
      return "";
    }
    return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() + " " + match[2].toLowerCase();
  }

  function getPreferredLatinNameFromInput(searchName, fallbackLatin) {
    var normalized = normalizeOnlineSearchText(searchName);
    var slashParts = normalized.split("/").map(function (part) {
      return part.trim();
    });
    var latinPart = slashParts.find(function (part) {
      return getLatinBaseName(part);
    });
    return latinPart || getLatinBaseName(normalized) || fallbackLatin || "";
  }

  function preserveSearchNameForSelectedLanguage(names, searchName, preferredLatinName) {
    var nextNames = Object.assign({}, names);
    var cleanSearchName = normalizeOnlineSearchText(searchName);
    var languageName = getLanguageNameFromInput(cleanSearchName);

    if (preferredLatinName) {
      nextNames.la = preferredLatinName;
    }

    if (state.language === "hu" && languageName) {
      nextNames.hu = languageName;
    }
    if (state.language === "de" && languageName) {
      nextNames.de = languageName;
    }
    if (state.language === "en" && languageName) {
      nextNames.en = languageName;
    }

    return nextNames;
  }

  function getLanguageNameFromInput(searchName) {
    var parts = normalizeOnlineSearchText(searchName).split("/").map(function (part) {
      return part.trim();
    }).filter(Boolean);
    var languagePart = parts.find(function (part) {
      return !getLatinBaseName(part);
    });

    if (languagePart) {
      return languagePart;
    }

    return getLatinBaseName(searchName) ? "" : normalizeOnlineSearchText(searchName);
  }

  function fetchWikidataSearchResults(searchTerm, language) {
    var wikidataLanguage = language === "la" ? "en" : language;
    var searchUrl = "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*&language=" + encodeURIComponent(wikidataLanguage) + "&uselang=" + encodeURIComponent(wikidataLanguage) + "&type=item&limit=5&search=" + encodeURIComponent(searchTerm);
    return fetchJson(searchUrl).then(function (data) {
      return data && data.search ? data.search : [];
    });
  }

  function fetchWikidataEntities(ids) {
    var uniqueIds = uniqueValues(ids);
    if (!uniqueIds.length) {
      return Promise.resolve({});
    }
    return Promise.all(uniqueIds.map(function (id) {
      var entityUrl = "https://www.wikidata.org/wiki/Special:EntityData/" + encodeURIComponent(id) + ".json";
      return fetchJson(entityUrl).then(function (entityData) {
        return entityData && entityData.entities ? entityData.entities[id] : null;
      }).catch(function () {
        return null;
      });
    })).then(function (entities) {
      var result = {};
      entities.forEach(function (entity, index) {
        if (entity) {
          result[uniqueIds[index]] = entity;
        }
      });
      return result;
    });
  }

  function isPlantEntity(entity) {
    return Boolean(getEntityClaimValue(entity, "P225") || getEntityClaimValue(entity, "P105") || getEntityLabel(entity, "la"));
  }

  function getNamesFromWikidataEntity(entity, fallbackName) {
    return {
      hu: getEntityLabel(entity, "hu") || fallbackName,
      la: getEntityClaimValue(entity, "P225") || "",
      de: getEntityLabel(entity, "de") || "",
      en: getEntityLabel(entity, "en") || ""
    };
  }

  function getSitelinksFromWikidataEntity(entity) {
    var sitelinks = entity && entity.sitelinks ? entity.sitelinks : {};
    return {
      hu: sitelinks.huwiki && sitelinks.huwiki.title,
      de: sitelinks.dewiki && sitelinks.dewiki.title,
      en: sitelinks.enwiki && sitelinks.enwiki.title,
      commons: sitelinks.commonswiki && sitelinks.commonswiki.title
    };
  }

  function getEntityLabel(entity, language) {
    return entity && entity.labels && entity.labels[language] ? entity.labels[language].value || "" : "";
  }

  function getEntityDescription(entity, language) {
    return entity && entity.descriptions && entity.descriptions[language] ? entity.descriptions[language].value || "" : "";
  }

  function getEntityClaimValue(entity, propertyId) {
    var claim = entity && entity.claims && entity.claims[propertyId] && entity.claims[propertyId][0];
    return claim && claim.mainsnak && claim.mainsnak.datavalue ? claim.mainsnak.datavalue.value || "" : "";
  }

  function fetchDescriptionsForSitelinks(sitelinks, entity) {
    return Promise.all([
      fetchWikiDescription("hu", sitelinks.hu, getEntityDescription(entity, "hu")),
      fetchWikiDescription("de", sitelinks.de, getEntityDescription(entity, "de")),
      fetchWikiDescription("en", sitelinks.en, getEntityDescription(entity, "en"))
    ]).then(function (values) {
      return {
        hu: values[0],
        de: values[1],
        en: values[2]
      };
    });
  }

  function fetchWikiDescription(language, title, fallback) {
    if (!title) {
      return Promise.resolve(fallback ? "<p>" + escapeHtml(fallback) + "</p>" : "");
    }
    var url = "https://" + language + ".wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=" + encodeURIComponent(title);
    return fetchJson(url).then(function (data) {
      var pages = data && data.query && data.query.pages ? data.query.pages : {};
      var pageIds = Object.keys(pages);
      var extract = pageIds.length ? pages[pageIds[0]].extract || "" : "";
      return extract ? textToHtmlParagraphs(extract) : (fallback ? "<p>" + escapeHtml(fallback) + "</p>" : "");
    }).catch(function () {
      return fallback ? "<p>" + escapeHtml(fallback) + "</p>" : "";
    });
  }

  function textToHtmlParagraphs(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .map(function (paragraph) {
        return paragraph.trim();
      })
      .filter(Boolean)
      .slice(0, 4)
      .map(function (paragraph) {
        return "<p>" + escapeHtml(paragraph) + "</p>";
      })
      .join("");
  }

  function getOnlineLinksFromSitelinks(sitelinks) {
    return [
      createWikiLink("hu", sitelinks.hu),
      createWikiLink("de", sitelinks.de),
      createWikiLink("en", sitelinks.en)
    ].filter(Boolean);
  }

  function createWikiLink(language, title) {
    if (!title) {
      return null;
    }
    return {
      id: createId(),
      names: {
        hu: language.toUpperCase() + " Wikipedia",
        de: language.toUpperCase() + " Wikipedia",
        en: language.toUpperCase() + " Wikipedia"
      },
      url: "https://" + language + ".wikipedia.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"))
    };
  }

  function fetchOnlineImages(entity, names, originalSearchName) {
    return fetchOnlineImageUrls(entity, names, originalSearchName).then(function (urls) {
      return loadImageUrlsAsDataUrls(urls, 10);
    });
  }

  function fetchOnlineImageUrls(entity, names, originalSearchName) {
    var files = [];
    var imageFile = getEntityClaimValue(entity, "P18");
    var category = getEntityClaimValue(entity, "P373");
    var commonsTitle = entity && entity.sitelinks && entity.sitelinks.commonswiki && entity.sitelinks.commonswiki.title;
    var searchNames = uniqueValues([
      originalSearchName,
      names.la,
      names.hu,
      names.de,
      names.en,
      getLatinBaseName(originalSearchName)
    ].map(normalizeOnlineSearchText).filter(Boolean)).slice(0, 4);

    if (imageFile) {
      files.push(imageFile);
    }

    return Promise.all([
      files.length ? fetchCommonsUrlsForFiles(files) : Promise.resolve([]),
      category ? fetchCommonsImagesFromCategory(category) : Promise.resolve([]),
      commonsTitle && commonsTitle.indexOf("Category:") === 0 ? fetchCommonsImagesFromCategory(commonsTitle.replace(/^Category:/, "")) : Promise.resolve([]),
      fetchCommonsImagesBySearchTerms(searchNames)
    ]).then(function (groups) {
      return uniqueImagesByUrl([].concat.apply([], groups)).slice(0, 18);
    });
  }

  function fetchCommonsImagesBySearchTerms(searchNames) {
    return Promise.all(searchNames.map(function (searchName) {
      return fetchCommonsImagesBySearch(searchName);
    })).then(function (groups) {
      return uniqueImagesByUrl([].concat.apply([], groups));
    });
  }

  function uniqueImagesByUrl(images) {
    var seen = {};
    return images.filter(function (image) {
      var key = image && image.url ? image.url : "";
      if (!key || seen[key]) {
        return false;
      }
      seen[key] = true;
      return true;
    });
  }

  function fetchCommonsUrlsForFiles(files) {
    var titles = files.map(function (file) {
      return "File:" + file;
    }).join("|");
    var url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1600&titles=" + encodeURIComponent(titles);
    return fetchJson(url).then(extractImagesFromCommonsPages);
  }

  function fetchCommonsImagesFromCategory(category) {
    var url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=categorymembers&gcmtitle=" + encodeURIComponent("Category:" + category) + "&gcmtype=file&gcmlimit=30&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1600";
    return fetchJson(url).then(extractImagesFromCommonsPages).catch(function () {
      return [];
    });
  }

  function fetchCommonsImagesBySearch(query) {
    var url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=30&gsrsearch=" + encodeURIComponent(query + " filetype:bitmap") + "&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1600";
    return fetchJson(url).then(extractImagesFromCommonsPages).catch(function () {
      return [];
    });
  }

  function extractImagesFromCommonsPages(data) {
    var pages = data && data.query && data.query.pages ? data.query.pages : {};
    return Object.keys(pages).map(function (pageId) {
      var imageInfo = pages[pageId].imageinfo && pages[pageId].imageinfo[0];
      if (!imageInfo || !isSupportedImageMime(imageInfo.mime) || !isLargeEnoughOnlineImage(imageInfo)) {
        return null;
      }
      return {
        url: imageInfo.thumburl || imageInfo.url || "",
        source: imageInfo.descriptionurl || imageInfo.url || "",
        width: imageInfo.width || 0,
        height: imageInfo.height || 0
      };
    }).filter(Boolean);
  }

  function isLargeEnoughOnlineImage(imageInfo) {
    var width = Number(imageInfo.width) || 0;
    var height = Number(imageInfo.height) || 0;
    if (!width || !height) {
      return true;
    }
    return width >= 900 || height >= 650;
  }

  function isSupportedImageMime(mime) {
    return /image\/(jpeg|jpg|png|webp|gif)/i.test(String(mime || ""));
  }

  function loadImageUrlsAsDataUrls(images, limit) {
    var seen = {};
    var candidates = images.filter(function (image) {
      var key = image && image.url ? image.url : "";
      if (!key || seen[key]) {
        return false;
      }
      seen[key] = true;
      return true;
    }).slice(0, 18);

    return Promise.all(candidates.map(function (image) {
      return imageUrlToDataUrl(image.url).then(function (dataUrl) {
        return {
          dataUrl: dataUrl,
          source: image.source || ""
        };
      }).catch(function () {
        return null;
      });
    })).then(function (loadedImages) {
      var selected = loadedImages.filter(Boolean).slice(0, limit);
      return {
        images: selected.map(function (image) {
          return image.dataUrl;
        }),
        sources: selected.map(function (image) {
          return image.source || "";
        })
      };
    });
  }

  function imageUrlToDataUrl(url) {
    return fetchWithTimeout(url, { mode: "cors" }, 7000)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("image failed");
        }
        return response.blob();
      })
      .then(function (blob) {
        if (!isSupportedImageMime(blob.type)) {
          throw new Error("unsupported image");
        }
        return readFileAsDataUrl(blob);
      });
  }

  function fetchJson(url) {
    if (window.location && window.location.protocol === "file:" && isMediaWikiApiUrl(url)) {
      return fetchJsonp(url);
    }

    return fetchWithTimeout(url, {
      headers: {
        Accept: "application/json"
      }
    }, 12000).then(function (response) {
      if (!response.ok) {
        throw new Error("fetch failed");
      }
      return response.json();
    }).catch(function () {
      return fetchJsonp(url);
    });
  }

  function isMediaWikiApiUrl(url) {
    return /^https:\/\/(www\.wikidata\.org|commons\.wikimedia\.org|[a-z]+\.wikipedia\.org)\/w\/api\.php/i.test(String(url || ""));
  }

  function fetchJsonp(url) {
    return new Promise(function (resolve, reject) {
      var callbackName = "flowerInventoryJsonp" + Date.now() + Math.random().toString(16).slice(2);
      var script = document.createElement("script");
      var timeoutId = window.setTimeout(function () {
        cleanup();
        reject(new Error("jsonp timeout"));
      }, 12000);

      function cleanup() {
        window.clearTimeout(timeoutId);
        try {
          delete window[callbackName];
        } catch (error) {
          window[callbackName] = undefined;
        }
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      }

      window[callbackName] = function (data) {
        cleanup();
        resolve(data);
      };

      script.onerror = function () {
        cleanup();
        reject(new Error("jsonp failed"));
      };
      script.src = appendUrlParameter(url, "callback", callbackName);
      document.head.appendChild(script);
    });
  }

  function appendUrlParameter(url, name, value) {
    var separator = url.indexOf("?") === -1 ? "?" : "&";
    return url + separator + encodeURIComponent(name) + "=" + encodeURIComponent(value);
  }

  function runPromiseQueue(tasks) {
    var results = [];
    return tasks.reduce(function (chain, task) {
      return chain.then(function () {
        return task().then(function (result) {
          results.push(result);
        });
      });
    }, Promise.resolve()).then(function () {
      return results;
    });
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    var controller = window.AbortController ? new AbortController() : null;
    var timeoutId = window.setTimeout(function () {
      if (controller) {
        controller.abort();
      }
    }, timeoutMs || 10000);
    var fetchOptions = Object.assign({}, options || {});
    if (controller) {
      fetchOptions.signal = controller.signal;
    }
    return fetch(url, fetchOptions).finally(function () {
      window.clearTimeout(timeoutId);
    });
  }

  function uniqueValues(values) {
    var seen = {};
    return values.filter(function (value) {
      var key = String(value || "");
      if (!key || seen[key]) {
        return false;
      }
      seen[key] = true;
      return true;
    });
  }

  function bindingValue(binding) {
    return binding && binding.value ? binding.value : "";
  }

  function sanitizeDescriptionHtml(html) {
    var template = document.createElement("template");
    template.innerHTML = String(html || "");
    cleanDescriptionNode(template.content);
    return template.innerHTML.trim();
  }

  function cleanDescriptionNode(root) {
    var allowedTags = ["B", "STRONG", "I", "EM", "U", "BR", "DIV", "P", "SPAN", "FONT", "UL", "OL", "LI"];
    Array.prototype.slice.call(root.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        node.remove();
        return;
      }

      if (allowedTags.indexOf(node.tagName) === -1) {
        unwrapNode(node);
        return;
      }

      cleanElementAttributes(node);
      cleanDescriptionNode(node);
    });
  }

  function cleanElementAttributes(element) {
    var color = readSafeColor(element.style.color) || readSafeColor(element.getAttribute("color"));
    var backgroundColor = readSafeColor(element.style.backgroundColor) || readSafeColor(element.getAttribute("bgcolor"));
    var fontFamily = readSafeFontFamily(element.style.fontFamily) || readSafeFontFamily(element.getAttribute("face"));
    var fontSize = readSafeFontSize(element.style.fontSize) || readLegacyFontSize(element.getAttribute("size"));
    var fontWeight = readSafeFontWeight(element.style.fontWeight);
    var fontStyle = readSafeFontStyle(element.style.fontStyle);
    var textDecoration = readSafeTextDecoration(element.style.textDecorationLine || element.style.textDecoration);
    Array.prototype.slice.call(element.attributes).forEach(function (attribute) {
      element.removeAttribute(attribute.name);
    });

    if (color) {
      element.style.color = color;
    }
    if (backgroundColor) {
      element.style.backgroundColor = backgroundColor;
    }
    if (fontFamily) {
      element.style.fontFamily = fontFamily;
    }
    if (fontSize) {
      element.style.fontSize = fontSize;
    }
    if (fontWeight) {
      element.style.fontWeight = fontWeight;
    }
    if (fontStyle) {
      element.style.fontStyle = fontStyle;
    }
    if (textDecoration) {
      element.style.textDecoration = textDecoration;
    }
  }

  function readSafeColor(value) {
    var color = String(value || "").trim();
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) {
      return color;
    }
    if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(color)) {
      return color;
    }
    return "";
  }

  function readSafeFontFamily(value) {
    var family = String(value || "").split(",")[0].replace(/['"]/g, "").trim();
    return EDITOR_FONT_FAMILIES[family] || "";
  }

  function readSafeFontSize(value) {
    var size = String(value || "").trim().toLowerCase();
    var namedSizes = {
      "x-small": "12px",
      small: "14px",
      medium: "16px",
      large: "20px",
      "x-large": "24px",
      "xx-large": "32px"
    };
    if (namedSizes[size]) {
      return namedSizes[size];
    }
    var match = size.match(/^(\d{1,2})px$/);
    var pixels = match ? Number(match[1]) : 0;
    if (pixels >= 10 && pixels <= 40) {
      return pixels + "px";
    }
    return "";
  }

  function readLegacyFontSize(value) {
    var size = String(value || "").trim();
    return EDITOR_FONT_SIZES[size] || "";
  }

  function readSafeFontWeight(value) {
    var weight = String(value || "").trim().toLowerCase();
    if (weight === "bold" || weight === "700" || weight === "800" || weight === "900") {
      return "700";
    }
    return "";
  }

  function readSafeFontStyle(value) {
    return String(value || "").trim().toLowerCase() === "italic" ? "italic" : "";
  }

  function readSafeTextDecoration(value) {
    return String(value || "").toLowerCase().indexOf("underline") !== -1 ? "underline" : "";
  }

  function unwrapNode(node) {
    var parent = node.parentNode;
    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node);
    }
    node.remove();
  }

  function htmlToPlainText(html) {
    var template = document.createElement("template");
    template.innerHTML = sanitizeDescriptionHtml(html);
    return template.content.textContent || "";
  }

  function sparqlString(value) {
    return "\"" + String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"";
  }

  function setAutoFillStatus(message, isWarning) {
    elements.autoFillStatus.textContent = message;
    elements.autoFillStatus.classList.toggle("warning", Boolean(isWarning));
  }

  function confirmAndDelete(flower) {
    var confirmed = window.confirm(t("confirmDelete", { name: flower.names.hu }));
    if (!confirmed) {
      return;
    }

    deleteFlower(flower.id)
      .then(loadFlowers)
      .then(function () {
        setSelectedFlower(state.flowers[0] ? state.flowers[0].id : null, {
          replaceHistory: true
        });
        render();
      })
      .catch(function () {
        window.alert(t("deleteFailed"));
      });
  }

  function handleImageDrag(event) {
    event.preventDefault();
    elements.imagePreview.classList.add("drag-over");
  }

  function handleImageDrop(event) {
    event.preventDefault();
    elements.imagePreview.classList.remove("drag-over");

    var files = event.dataTransfer && event.dataTransfer.files;
    if (!files || files.length === 0) {
      return;
    }

    useImageFiles(files);
  }

  function handleClipboardPaste(event) {
    var files = getImageFilesFromClipboard(event.clipboardData);
    if (!files.length) {
      return;
    }

    event.preventDefault();

    if (state.thumbnailPasteContext && typeof state.thumbnailPasteContext.onAddFiles === "function") {
      state.thumbnailPasteContext.onAddFiles(files, getThumbnailPasteInsertIndex());
      return;
    }

    if (state.editingId !== null) {
      useImageFiles(files, {
        insertIndex: normalizeImages(state.pendingImages).length
      });
      return;
    }

    var flower = getSelectedFlower();
    if (!flower) {
      window.alert(t("pasteImageUnavailable"));
      return;
    }
    appendImagesToFlower(flower, files, {
      insertIndex: getFlowerImages(flower).length
    });
  }

  function getImageFilesFromClipboard(clipboardData) {
    var items = clipboardData && clipboardData.items ? Array.prototype.slice.call(clipboardData.items) : [];
    return items.map(function (item) {
      return item.kind === "file" && item.type && item.type.indexOf("image/") === 0 ? item.getAsFile() : null;
    }).filter(Boolean);
  }

  function useImageFiles(fileList, options) {
    var files = Array.prototype.slice.call(fileList || []);
    if (files.length === 0) {
      return;
    }
    if (files.some(function (file) {
      return !file.type || file.type.indexOf("image/") !== 0;
    })) {
      showFormError(t("dragImageOnly"));
      return;
    }

    Promise.all(files.map(readFileAsDataUrl)).then(function (dataUrls) {
      var previousLength = normalizeImages(state.pendingImages).length;
      var insertIndex = getImageInsertIndex(options && options.insertIndex, previousLength);
      var previousFavoriteIndex = normalizeFavoriteImageIndex(state.pendingFavoriteImageIndex, state.pendingImages);
      state.pendingImages = insertItemsAt(normalizeImages(state.pendingImages), dataUrls, insertIndex);
      state.pendingImageSources = insertItemsAt(normalizeImageSources(state.pendingImageSources, previousLength), dataUrls.map(function () {
        return "";
      }), insertIndex);
      state.pendingImageNames = insertItemsAt(normalizeImageNames(state.pendingImageNames, previousLength, getPendingImageBaseName()), getImageNamesForFiles(files, getPendingFlowerLike(), state.pendingImageNames), insertIndex);
      state.pendingImageInfos = insertItemsAt(normalizeImageInfos(state.pendingImageInfos, previousLength), dataUrls.map(function () {
        return createEmptyImageInfo();
      }), insertIndex);
      state.pendingImageData = state.pendingImages[0] || "";
      state.pendingImageIndex = insertIndex;
      state.pendingFavoriteImageIndex = insertIndex <= previousFavoriteIndex ? previousFavoriteIndex + dataUrls.length : previousFavoriteIndex;
      renderImagePreview(state.pendingImages);
      elements.imageInput.value = "";
      clearFormError();
      if (options && options.reopenThumbnails) {
        openThumbnailChooserForPendingImages();
      }
    }).catch(function () {
      showFormError(t("readImageFailed"));
    });
  }

  function downloadFlowerPdf(flower, button) {
    var originalText = button.textContent;
    button.disabled = true;
    setActionButtonLabel(button, t("pdfCreating"));

    createFlowerPdfBlob(flower)
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = safeFileName(getPdfFlowerFileName(flower)) + ".pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      })
      .catch(function () {
        window.alert(t("pdfFailed"));
      })
      .finally(function () {
        button.disabled = false;
        setActionButtonLabel(button, originalText);
      });
  }

  function createFlowerPdfBlob(flower) {
    return Promise.all([
      loadImage(getFavoriteFlowerImageData(flower)),
      loadPdfIcons()
    ]).then(function (loaded) {
      var image = loaded[0];
      var icons = loaded[1];
      var pageWidth = 1240;
      var pageHeight = 1754;
      var margin = 86;
      var canvas = document.createElement("canvas");
      canvas.width = pageWidth;
      canvas.height = pageHeight;
      var ctx = canvas.getContext("2d");

      return renderDescriptionForPdf(flower, pageWidth - margin * 2).then(function (descriptionImage) {
        var annotations = [];
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageWidth, pageHeight);
        drawPdfTitle(ctx, flower, margin, pageWidth - margin * 2);
        var imageBottom = drawPdfImage(ctx, image, margin, 185, pageWidth - margin * 2, 560);
        var namesBottom = drawPdfNames(ctx, flower, margin, imageBottom + 46, icons);
        var linksHeight = measurePdfLinksHeight(ctx, flower, pageWidth - margin * 2);
        var descriptionMaxY = pageHeight - margin - linksHeight - (linksHeight ? 42 : 0);
        var descriptionBottom = drawPdfDescription(ctx, descriptionImage, margin, namesBottom + 52, pageWidth - margin * 2, descriptionMaxY, icons);
        annotations = drawPdfLinks(ctx, flower, margin, descriptionBottom + 42, pageWidth - margin * 2, pageHeight - margin, icons);

        var jpegData = canvas.toDataURL("image/jpeg", 0.92);
        return makeSingleImagePdf(jpegData, 1240, 1754, 595, 842, annotations);
      });
    });
  }

  function loadPdfIcons() {
    return Promise.resolve({
      hu: "hu",
      la: "la",
      de: "de",
      en: "en",
      description: "description",
      links: "links"
    });
  }

  function drawPdfTitle(ctx, flower, margin, maxWidth) {
    var title = getLocalizedFlowerName(flower) || t("flowers");
    var titleSize = fitPdfTextSize(ctx, title, 58, 30, maxWidth, "700");

    ctx.fillStyle = "#22211d";
    ctx.font = "700 " + titleSize + "px Segoe UI, Arial, sans-serif";
    ctx.fillText(title, margin, 105);

    ctx.fillStyle = "#6a665e";
    ctx.font = "26px Segoe UI, Arial, sans-serif";
    ctx.fillText(t("appNamePdf"), margin, 148);
  }

  function fitPdfTextSize(ctx, text, maxSize, minSize, maxWidth, weight) {
    var size = maxSize;
    while (size > minSize) {
      ctx.font = (weight || "400") + " " + size + "px Segoe UI, Arial, sans-serif";
      if (ctx.measureText(text).width <= maxWidth) {
        return size;
      }
      size -= 2;
    }
    return minSize;
  }

  function drawPdfImage(ctx, image, x, y, maxWidth, maxHeight) {
    var ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
    var width = image.width * ratio;
    var height = image.height * ratio;
    var left = x + (maxWidth - width) / 2;

    ctx.fillStyle = "#f6f5f1";
    ctx.fillRect(x, y, maxWidth, maxHeight);
    ctx.drawImage(image, left, y + (maxHeight - height) / 2, width, height);
    return y + maxHeight;
  }

  function drawPdfNames(ctx, flower, x, y, icons) {
    var rows = [
      ["hu", flower.names.hu],
      ["la", flower.names.la],
      ["de", flower.names.de],
      ["en", flower.names.en]
    ];
    var currentY = y;

    rows.forEach(function (row) {
      drawPdfIcon(ctx, icons[row[0]], x, currentY - 32, 34, row[0] !== "la");

      ctx.fillStyle = "#22211d";
      ctx.font = "30px Segoe UI, Arial, sans-serif";
      ctx.fillText(row[1] || "-", x + 68, currentY);

      currentY += 48;
    });

    return currentY;
  }

  function drawPdfDescription(ctx, descriptionImage, x, y, maxWidth, maxY, icons) {
    drawPdfIcon(ctx, icons.description, x, y - 34, 38, true);
    ctx.fillStyle = "#22211d";
    ctx.font = "700 28px Segoe UI, Arial, sans-serif";
    ctx.fillText(t("descriptionTitle"), x + 52, y - 5);

    var contentY = y + 44;
    var availableHeight = Math.max(0, maxY - contentY);
    var height = Math.min(descriptionImage.height, availableHeight);
    ctx.drawImage(descriptionImage, 0, 0, descriptionImage.width, height, x, contentY, maxWidth, height);
    return contentY + height;
  }

  function drawPdfLinks(ctx, flower, x, y, maxWidth, maxY, icons) {
    var links = normalizeLinks(flower.links);
    var annotations = [];
    var currentY = y;

    if (links.length === 0 || currentY >= maxY) {
      return annotations;
    }

    drawPdfIcon(ctx, icons.links, x, currentY - 34, 38, false);
    ctx.fillStyle = "#22211d";
    ctx.font = "700 28px Segoe UI, Arial, sans-serif";
    ctx.fillText("[" + links.length + "]", x + 52, currentY - 5);
    currentY += 48;

    ctx.font = "700 25px Segoe UI, Arial, sans-serif";
    ctx.fillStyle = "#23634d";

    links.forEach(function (link) {
      var lines = wrapPdfText(ctx, getLocalizedLinkName(link), maxWidth);
      lines.forEach(function (line) {
        if (currentY > maxY) {
          return;
        }

        var width = ctx.measureText(line).width;
        ctx.fillText(line, x, currentY);
        ctx.beginPath();
        ctx.moveTo(x, currentY + 4);
        ctx.lineTo(x + width, currentY + 4);
        ctx.strokeStyle = "#23634d";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        annotations.push({
          url: link.url,
          rect: {
            left: x,
            top: currentY - 28,
            right: x + width,
            bottom: currentY + 8
          }
        });
        currentY += 34;
      });
      currentY += 10;
    });

    return annotations;
  }

  function drawPdfIcon(ctx, icon, x, y, size, isRound) {
    ctx.save();
    if (isRound) {
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    if (icon === "hu") {
      drawPdfFlag(ctx, x, y, size, ["#c8102e", "#ffffff", "#477050"]);
    } else if (icon === "de") {
      drawPdfFlag(ctx, x, y, size, ["#111111", "#dd0000", "#ffce00"]);
    } else if (icon === "en") {
      drawPdfUnionIcon(ctx, x, y, size);
    } else if (icon === "la") {
      drawPdfLatinIcon(ctx, x, y, size);
    } else if (icon === "description") {
      drawPdfInfoIcon(ctx, x, y, size);
    } else if (icon === "links") {
      drawPdfLinkIcon(ctx, x, y, size);
    }
    ctx.restore();
  }

  function drawPdfFlag(ctx, x, y, size, colors) {
    var bandHeight = size / colors.length;
    colors.forEach(function (color, index) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y + index * bandHeight, size, bandHeight + 0.5);
    });
  }

  function drawPdfUnionIcon(ctx, x, y, size) {
    ctx.fillStyle = "#1f3f82";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = size * 0.18;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.strokeStyle = "#c8102e";
    ctx.lineWidth = size * 0.08;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + size * 0.39, y, size * 0.22, size);
    ctx.fillRect(x, y + size * 0.39, size, size * 0.22);
    ctx.fillStyle = "#c8102e";
    ctx.fillRect(x + size * 0.44, y, size * 0.12, size);
    ctx.fillRect(x, y + size * 0.44, size, size * 0.12);
  }

  function drawPdfLatinIcon(ctx, x, y, size) {
    ctx.fillStyle = "#9b0014";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "#d8b45a";
    ctx.font = "700 " + Math.round(size * 0.32) + "px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPQR", x + size / 2, y + size / 2);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  function drawPdfInfoIcon(ctx, x, y, size) {
    ctx.fillStyle = "#1677dc";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 " + Math.round(size * 0.76) + "px Segoe UI, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("i", x + size / 2, y + size / 2 + size * 0.02);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  function drawPdfLinkIcon(ctx, x, y, size) {
    ctx.fillStyle = "#2c3856";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(3, size * 0.12);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x + size * 0.36, y + size * 0.63, size * 0.23, Math.PI * 0.75, Math.PI * 1.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size * 0.64, y + size * 0.37, size * 0.23, Math.PI * 1.75, Math.PI * 0.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.42, y + size * 0.58);
    ctx.lineTo(x + size * 0.58, y + size * 0.42);
    ctx.stroke();
  }

  function measurePdfLinksHeight(ctx, flower, maxWidth) {
    var links = normalizeLinks(flower.links);
    var height = 0;

    if (links.length === 0) {
      return height;
    }

    height += 48;
    ctx.font = "700 25px Segoe UI, Arial, sans-serif";
    links.forEach(function (link) {
      height += wrapPdfText(ctx, getLocalizedLinkName(link), maxWidth).length * 34 + 10;
    });
    return height;
  }

  function wrapPdfText(ctx, text, maxWidth) {
    var words = String(text || "").split(/\s+/).filter(Boolean);
    var lines = [];
    var line = "";

    words.forEach(function (word) {
      var testLine = line ? line + " " + word : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });

    if (line) {
      lines.push(line);
    }
    return lines.length ? lines : [String(text || "")];
  }

  function renderDescriptionForPdf(flower, width) {
    var description = getLocalizedDescription(flower);
    var html = description || "<p>" + escapeHtml(t("missingDescription")) + "</p>";
    var muted = description ? "#22211d" : "#6a665e";
    var container = document.createElement("div");
    container.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    container.style.width = width + "px";
    container.style.boxSizing = "border-box";
    container.style.background = "#ffffff";
    container.style.color = muted;
    container.style.font = "26px Segoe UI, Arial, sans-serif";
    container.style.lineHeight = "1.6";
    container.style.overflowWrap = "anywhere";
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.innerHTML = sanitizeDescriptionHtml(html);
    preparePdfDescriptionHtml(container);
    document.body.appendChild(container);

    var height = Math.max(40, Math.ceil(container.scrollHeight) + 8);
    container.style.position = "static";
    container.style.left = "";
    container.style.top = "";
    var serialized = new XMLSerializer().serializeToString(container);
    document.body.removeChild(container);

    var svg = [
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"", width, "\" height=\"", height, "\">",
      "<foreignObject width=\"100%\" height=\"100%\">",
      serialized,
      "</foreignObject>",
      "</svg>"
    ].join("");

    return loadImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
  }

  function preparePdfDescriptionHtml(container) {
    Array.prototype.slice.call(container.querySelectorAll("*")).forEach(function (element) {
      element.style.maxWidth = "100%";
      element.style.boxSizing = "border-box";
    });

    Array.prototype.slice.call(container.querySelectorAll("p, div, ul, ol")).forEach(function (element) {
      element.style.margin = "0 0 14px";
    });

    Array.prototype.slice.call(container.querySelectorAll("ul, ol")).forEach(function (element) {
      element.style.paddingLeft = "34px";
    });

    Array.prototype.slice.call(container.querySelectorAll("li")).forEach(function (element) {
      element.style.margin = "0 0 8px";
    });
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () {
        resolve(image);
      };
      image.onerror = reject;
      image.src = src;
    });
  }

  function makeSingleImagePdf(jpegDataUrl, imageWidth, imageHeight, pageWidth, pageHeight, annotations) {
    var jpegBytes = dataUrlToBytes(jpegDataUrl);
    var imageObject = "<< /Type /XObject /Subtype /Image /Width " + imageWidth + " /Height " + imageHeight + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpegBytes.length + " >>";
    var content = "q\n" + pageWidth + " 0 0 " + pageHeight + " 0 0 cm\n/Im1 Do\nQ";
    var linkAnnotations = (annotations || []).filter(function (annotation) {
      return annotation.url && annotation.rect;
    });
    var annotationRefs = linkAnnotations.map(function (_, index) {
      return (index + 6) + " 0 R";
    });
    var pageObject = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pageWidth + " " + pageHeight + "] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R";
    if (annotationRefs.length) {
      pageObject += " /Annots [" + annotationRefs.join(" ") + "]";
    }
    pageObject += " >>";

    var objects = [
      { body: "<< /Type /Catalog /Pages 2 0 R >>" },
      { body: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
      { body: pageObject },
      { body: imageObject, stream: jpegBytes },
      { body: "<< /Length " + content.length + " >>", stream: content }
    ];
    linkAnnotations.forEach(function (annotation) {
      objects.push({ body: makePdfLinkAnnotation(annotation, imageWidth, imageHeight, pageWidth, pageHeight) });
    });

    var chunks = ["%PDF-1.4\n"];
    var offsets = [0];
    var position = chunks[0].length;

    objects.forEach(function (object, index) {
      offsets.push(position);
      var header = (index + 1) + " 0 obj\n";
      chunks.push(header);
      position += header.length;
      chunks.push(object.body);
      position += object.body.length;
      if (object.stream !== undefined) {
        chunks.push("\nstream\n");
        position += 8;
        chunks.push(object.stream);
        position += object.stream.length;
        chunks.push("\nendstream");
        position += 10;
      }
      chunks.push("\nendobj\n");
      position += 8;
    });

    var xrefPosition = position;
    var xref = "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
    for (var i = 1; i < offsets.length; i += 1) {
      xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    }
    var trailer = "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefPosition + "\n%%EOF";
    chunks.push(xref + trailer);

    return new Blob(chunks, { type: "application/pdf" });
  }

  function makePdfLinkAnnotation(annotation, imageWidth, imageHeight, pageWidth, pageHeight) {
    var rect = annotation.rect;
    var left = rect.left / imageWidth * pageWidth;
    var right = rect.right / imageWidth * pageWidth;
    var bottom = pageHeight - rect.bottom / imageHeight * pageHeight;
    var top = pageHeight - rect.top / imageHeight * pageHeight;
    return "<< /Type /Annot /Subtype /Link /Rect [" + [
      pdfNumber(left),
      pdfNumber(bottom),
      pdfNumber(right),
      pdfNumber(top)
    ].join(" ") + "] /Border [0 0 0] /A << /S /URI /URI (" + escapePdfString(encodeURI(annotation.url)) + ") >> >>";
  }

  function pdfNumber(value) {
    return String(Math.round(value * 100) / 100);
  }

  function escapePdfString(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\r/g, "")
      .replace(/\n/g, "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function dataUrlToBytes(dataUrl) {
    var base64 = dataUrl.split(",")[1] || "";
    var binary = window.atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function safeFileName(value) {
    return String(value || "blume")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "_")
      .slice(0, 80) || "blume";
  }

  function getPdfFlowerFileName(flower) {
    var name = getLocalizedFlowerName(flower) || flower.names.hu || "blume";
    return getFirstNamePart(name) || "blume";
  }

  function renderImagePreview(images) {
    var imageList = normalizeImages(images);
    var imageSources = normalizeImageSources(state.pendingImageSources, imageList.length);
    var imageInfos = normalizeImageInfos(state.pendingImageInfos, imageList.length);
    var imageNames = normalizeImageNames(state.pendingImageNames, imageList.length, getPendingImageBaseName());
    var imageIndex = Math.min(Math.max(state.pendingImageIndex || 0, 0), Math.max(imageList.length - 1, 0));
    var favoriteImageIndex = normalizeFavoriteImageIndex(state.pendingFavoriteImageIndex, imageList);
    elements.imagePreview.innerHTML = "";
    elements.imagePreview.classList.toggle("empty", imageList.length === 0);
    elements.imagePreview.classList.toggle("has-images", imageList.length > 0);
    state.pendingImageIndex = imageIndex;
    state.pendingFavoriteImageIndex = favoriteImageIndex;
    state.pendingImageSources = imageSources;
    state.pendingImageInfos = imageInfos;

    if (imageList.length === 0) {
      var label = document.createElement("span");
      label.textContent = t("selectImageDrop");
      elements.imagePreview.appendChild(label);
      elements.imagePreview.appendChild(elements.imageInput);
      return;
    }

    var preview = document.createElement("div");
    var addInput = document.createElement("input");
    var addButton = document.createElement("button");
    var deleteButton = document.createElement("button");
    var favoriteButton = document.createElement("button");
    var thumbnailsButton = document.createElement("button");
    var sourceButton = document.createElement("button");
    var infoButton = document.createElement("button");
    var isFavoriteImage = imageIndex === favoriteImageIndex;

    preview.className = "image-preview-stack";
    preview.addEventListener("wheel", handlePendingImageWheel, { passive: false });
    var image = document.createElement("img");
    image.src = imageList[imageIndex];
    image.alt = t("imagePreview");
    image.title = getImageInfoTooltip(imageInfos[imageIndex], imageNames[imageIndex]);
    image.className = "hero-image";
    image.addEventListener("click", function () {
      openOriginalImageOverlay(imageList, imageIndex, t("imagePreview"), function (index) {
        state.pendingImageIndex = index;
        renderImagePreview(state.pendingImages);
      }, {
        imageInfos: state.pendingImageInfos,
        imageNames: imageNames,
        imageSources: imageSources,
        favoriteIndex: favoriteImageIndex,
        onFavorite: setPendingFavoriteImage,
        onDelete: deletePendingImageByIndex,
        onInfo: editPendingImageInfo,
        onSource: editPendingImageSource,
        manageSources: true
      });
    });

    addInput.type = "file";
    addInput.accept = "image/*";
    addInput.multiple = true;
    addInput.className = "hero-image-add-input";
    addInput.addEventListener("change", function (event) {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      useImageFiles(event.target.files);
      addInput.value = "";
    });

    addButton.type = "button";
    addButton.className = "hero-image-add";
    addButton.title = t("addImage");
    addButton.setAttribute("aria-label", t("addImage"));
    addButton.appendChild(createIconImage("icon-add.png"));
    addButton.addEventListener("click", function () {
      addInput.click();
    });

    deleteButton.type = "button";
    deleteButton.className = "hero-image-delete";
    deleteButton.title = t("deleteImage");
    deleteButton.setAttribute("aria-label", t("deleteImage"));
    deleteButton.disabled = imageList.length <= 1;
    deleteButton.appendChild(createIconImage("icon-delete.png"));
    deleteButton.addEventListener("click", deleteCurrentPendingImage);

    favoriteButton.type = "button";
    favoriteButton.className = "hero-image-favorite" + (isFavoriteImage ? " active" : "");
    favoriteButton.title = isFavoriteImage ? t("favoriteImage") : t("setFavoriteImage");
    favoriteButton.setAttribute("aria-label", favoriteButton.title);
    favoriteButton.appendChild(createIconImage("icon-favorite.png"));
    favoriteButton.addEventListener("click", function () {
      setPendingFavoriteImage(imageIndex);
    });

    thumbnailsButton.type = "button";
    thumbnailsButton.className = "hero-image-thumbnails";
    thumbnailsButton.title = t("showThumbnails");
    thumbnailsButton.setAttribute("aria-label", t("showThumbnails"));
    thumbnailsButton.appendChild(createIconImage("icon-thumbnails.png"));
    thumbnailsButton.addEventListener("click", function () {
      openThumbnailChooser({
        images: imageList,
        imageSources: imageSources,
        imageNames: state.pendingImageNames,
        imageInfos: state.pendingImageInfos,
        currentIndex: imageIndex,
        favoriteIndex: favoriteImageIndex,
        onSelect: selectPendingImageByIndex,
        onFavorite: setPendingFavoriteImage,
        onDelete: function (index) {
          deletePendingImageByIndex(index, {
            reopenThumbnails: true
          });
        },
        onAddFiles: function (files, insertIndex) {
          useImageFiles(files, {
            reopenThumbnails: true,
            insertIndex: insertIndex
          });
        },
        onInfo: function (index) {
          editPendingImageInfo(index, {
            reopenThumbnails: true
          });
        },
        onSource: function (index) {
          editPendingImageSource(index, {
            reopenThumbnails: true
          });
        },
        manageSources: true
      });
    });

    sourceButton.type = "button";
    sourceButton.className = "hero-image-source";
    sourceButton.title = t("manageImageSource");
    sourceButton.setAttribute("aria-label", t("manageImageSource"));
    sourceButton.classList.toggle("looks-disabled", !imageSources[imageIndex]);
    sourceButton.setAttribute("aria-disabled", imageSources[imageIndex] ? "false" : "true");
    sourceButton.appendChild(createIconImage("icon-link.png"));
    sourceButton.addEventListener("click", function () {
      editPendingImageSource(imageIndex);
    });

    infoButton = createImageInfoButton(imageInfos[imageIndex], imageNames[imageIndex], function () {
      editPendingImageInfo(imageIndex);
    });

    preview.appendChild(image);
    preview.appendChild(addInput);
    preview.appendChild(addButton);
    preview.appendChild(deleteButton);
    preview.appendChild(favoriteButton);
    preview.appendChild(thumbnailsButton);
    preview.appendChild(sourceButton);
    preview.appendChild(infoButton);
    elements.imagePreview.appendChild(preview);
    if (imageList.length > 1) {
      elements.imagePreview.appendChild(createPendingImageNavigation(imageList.length, imageIndex));
    }
  }

  function createPendingImageNavigation(imageCount, imageIndex) {
    return createImageNavigationControls(imageCount, imageIndex, {
      first: function () {
        selectPendingImageByIndex(0);
      },
      previous: function () {
        selectPendingImageByOffset(-1);
      },
      next: function () {
        selectPendingImageByOffset(1);
      },
      last: function () {
        selectPendingImageByIndex(imageCount - 1);
      }
    });
  }

  function selectPendingImageByIndex(index) {
    var images = normalizeImages(state.pendingImages);
    if (index < 0 || index >= images.length) {
      return;
    }
    state.pendingImageIndex = index;
    renderImagePreview(images);
  }

  function selectPendingImageByOffset(offset) {
    selectPendingImageByIndex((state.pendingImageIndex || 0) + offset);
  }

  function handlePendingImageWheel(event) {
    var images = normalizeImages(state.pendingImages);
    if (images.length <= 1 || event.deltaY === 0) {
      return;
    }
    event.preventDefault();
    selectPendingImageByOffset(event.deltaY > 0 ? 1 : -1);
  }

  function deleteCurrentPendingImage() {
    var images = normalizeImages(state.pendingImages);
    if (images.length <= 1) {
      window.alert(t("keepOneImage"));
      return;
    }

    var imageIndex = Math.min(Math.max(state.pendingImageIndex || 0, 0), images.length - 1);
    deletePendingImageByIndex(imageIndex);
  }

  function deletePendingImageByIndex(imageIndex, options) {
    var images = normalizeImages(state.pendingImages);
    if (images.length <= 1) {
      window.alert(t("keepOneImage"));
      return;
    }
    if (imageIndex < 0 || imageIndex >= images.length) {
      return;
    }

    var favoriteImageIndex = normalizeFavoriteImageIndex(state.pendingFavoriteImageIndex, images);
    var updatedImages = images.filter(function (_, index) {
      return index !== imageIndex;
    });
    var updatedSources = normalizeImageSources(state.pendingImageSources, images.length).filter(function (_, index) {
      return index !== imageIndex;
    });
    var updatedNames = normalizeImageNames(state.pendingImageNames, images.length, getPendingImageBaseName()).filter(function (_, index) {
      return index !== imageIndex;
    });
    var updatedInfos = normalizeImageInfos(state.pendingImageInfos, images.length).filter(function (_, index) {
      return index !== imageIndex;
    });
    var nextIndex = Math.min(imageIndex, updatedImages.length - 1);

    state.pendingImages = updatedImages;
    state.pendingImageSources = updatedSources;
    state.pendingImageNames = updatedNames;
    state.pendingImageInfos = updatedInfos;
    state.pendingImageData = updatedImages[0] || "";
    state.pendingImageIndex = nextIndex;
    state.pendingFavoriteImageIndex = getFavoriteIndexAfterImageDelete(favoriteImageIndex, imageIndex, nextIndex);
    renderImagePreview(updatedImages);
    if (options && options.reopenThumbnails) {
      openThumbnailChooserForPendingImages();
    }
  }

  function setPendingFavoriteImage(imageIndex) {
    var images = normalizeImages(state.pendingImages);
    if (imageIndex < 0 || imageIndex >= images.length) {
      return;
    }
    var promoted = promoteImageToFirst(images, normalizeImageSources(state.pendingImageSources, images.length), imageIndex, normalizeImageNames(state.pendingImageNames, images.length, getPendingImageBaseName()), normalizeImageInfos(state.pendingImageInfos, images.length));
    state.pendingImages = promoted.images;
    state.pendingImageSources = promoted.sources;
    state.pendingImageNames = promoted.names;
    state.pendingImageInfos = promoted.infos;
    state.pendingImageData = promoted.images[0] || "";
    state.pendingImageIndex = 0;
    state.pendingFavoriteImageIndex = 0;
    renderImagePreview(state.pendingImages);
  }

  function exportFlowers() {
    loadFlowers().then(function () {
      var hasFilter = Boolean(normalizeSearchText(elements.filterInput.value));
      var flowers = hasFilter ? getVisibleFlowers() : state.flowers;
      return saveExportData(createExportData(flowers), {
        stem: hasFilter ? "blumen-inventar-export-gefiltert" : "blumen-inventar-export",
        titleKey: hasFilter ? "exportFilteredFlowers" : "exportAllFlowers"
      });
    });
  }

  function exportSingleFlower(flower) {
    var currentFlower = flower || getSelectedFlower();
    if (!currentFlower) {
      return;
    }
    saveExportData(createExportData([currentFlower]), {
      stem: "blumen-inventar-export-" + getExportFlowerNamePart(currentFlower),
      titleKey: "exportSingleFlower"
    });
  }

  function createExportData(flowers) {
    return {
      app: "flower-inventory",
      version: 1,
      exportedAt: new Date().toISOString(),
      flowers: Array.isArray(flowers) ? flowers : []
    };
  }

  function saveExportData(exportData, options) {
    var baseName = getExportBaseFileName(options && options.stem);
    return chooseExportFormat(exportData.flowers.length, options && options.titleKey).then(function (format) {
      if (!format) {
        return;
      }
      if (window.showSaveFilePicker) {
        return saveExportDataWithFilePicker(exportData, baseName, format);
      }
      return createExportBlob(exportData, format).then(function (blob) {
        downloadExportBlob(blob, baseName + "." + format);
      });
    });
  }

  function saveExportDataWithFilePicker(exportData, baseName, format) {
    return window.showSaveFilePicker(createExportPickerOptions(format, {
      suggestedName: baseName + "." + format
    })).then(function (handle) {
      var selectedFormat = getExportFormatFromFileName(handle.name, format);
      return createExportBlob(exportData, selectedFormat).then(function (blob) {
        return handle.createWritable().then(function (writable) {
          return writable.write(blob).then(function () {
            return writable.close();
          });
        });
      });
    }).catch(function (error) {
      if (error && error.name === "AbortError") {
        return;
      }
      return createExportBlob(exportData, format).then(function (blob) {
        downloadExportBlob(blob, baseName + "." + format);
      });
    });
  }

  function chooseExportFormat(count, titleKey) {
    return showAppChoiceDialog({
      title: t(titleKey || "export"),
      message: t("exportStatus", { count: count }) + "\n" + t("exportFormatQuestion"),
      acceptLabel: t("exportZip"),
      cancelLabel: t("exportJson"),
      acceptIcon: "icon-zip.png",
      cancelIcon: "icon-json.png",
      acceptValue: "zip",
      cancelValue: "json",
      dismissValue: null,
      extraLabel: t("cancel"),
      extraIcon: "icon-exit.png",
      extraValue: null,
      iconOnly: true,
      noPrimary: true,
      panelClassName: "export-format-dialog"
    });
  }

  function createExportBlob(exportData, format) {
    var jsonText = JSON.stringify(exportData, null, 2);
    if (format === "json") {
      return Promise.resolve(new Blob([jsonText], { type: "application/json" }));
    }
    return createZipBlob("blumen-inventar-export.json", jsonText);
  }

  function getExportFormatFromFileName(fileName, fallbackFormat) {
    if (/\.json$/i.test(fileName || "")) {
      return "json";
    }
    if (/\.zip$/i.test(fileName || "")) {
      return "zip";
    }
    return fallbackFormat || "zip";
  }

  function getExportBaseFileName(stem) {
    var now = new Date();
    return [
      now.getFullYear(),
      padDatePart(now.getMonth() + 1),
      padDatePart(now.getDate()),
      padDatePart(now.getHours()),
      padDatePart(now.getMinutes())
    ].join("-") + "-" + (stem || "blumen-inventar-export");
  }

  function getExportFlowerNamePart(flower) {
    var name = getLocalizedFlowerName(flower) || flower.names.hu || flower.names.la || "blume";
    var firstPart = String(name || "blume").split("/")[0].trim() || "blume";
    return safeExportNamePart(firstPart);
  }

  function safeExportNamePart(value) {
    return String(value || "blume")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "blume";
  }

  function createZipBlob(fileName, text) {
    var fileNameBytes = encodeUtf8(fileName);
    var contentBytes = encodeUtf8(text);
    var crc = calculateCrc32(contentBytes);
    var timestamp = getZipTimestamp(new Date());
    return compressZipContent(contentBytes).then(function (compressed) {
      var localHeader = createZipLocalHeader(fileNameBytes, compressed.method, timestamp, crc, compressed.bytes.length, contentBytes.length);
      var centralHeader = createZipCentralHeader(fileNameBytes, compressed.method, timestamp, crc, compressed.bytes.length, contentBytes.length, 0);
      var endRecord = createZipEndRecord(centralHeader.byteLength, localHeader.byteLength + compressed.bytes.length);
      return new Blob([localHeader, compressed.bytes, centralHeader, endRecord], { type: "application/zip" });
    });
  }

  function compressZipContent(bytes) {
    if (!window.CompressionStream) {
      return Promise.resolve({ bytes: bytes, method: 0 });
    }

    try {
      var stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
      return new Response(stream).arrayBuffer().then(function (buffer) {
        return {
          bytes: new Uint8Array(buffer),
          method: 8
        };
      }).catch(function () {
        return { bytes: bytes, method: 0 };
      });
    } catch (error) {
      return Promise.resolve({ bytes: bytes, method: 0 });
    }
  }

  function createZipLocalHeader(fileNameBytes, method, timestamp, crc, compressedSize, uncompressedSize) {
    var header = new Uint8Array(30 + fileNameBytes.length);
    writeUint32(header, 0, 0x04034b50);
    writeUint16(header, 4, 20);
    writeUint16(header, 6, 0);
    writeUint16(header, 8, method);
    writeUint16(header, 10, timestamp.time);
    writeUint16(header, 12, timestamp.date);
    writeUint32(header, 14, crc);
    writeUint32(header, 18, compressedSize);
    writeUint32(header, 22, uncompressedSize);
    writeUint16(header, 26, fileNameBytes.length);
    writeUint16(header, 28, 0);
    header.set(fileNameBytes, 30);
    return header;
  }

  function createZipCentralHeader(fileNameBytes, method, timestamp, crc, compressedSize, uncompressedSize, localHeaderOffset) {
    var header = new Uint8Array(46 + fileNameBytes.length);
    writeUint32(header, 0, 0x02014b50);
    writeUint16(header, 4, 20);
    writeUint16(header, 6, 20);
    writeUint16(header, 8, 0);
    writeUint16(header, 10, method);
    writeUint16(header, 12, timestamp.time);
    writeUint16(header, 14, timestamp.date);
    writeUint32(header, 16, crc);
    writeUint32(header, 20, compressedSize);
    writeUint32(header, 24, uncompressedSize);
    writeUint16(header, 28, fileNameBytes.length);
    writeUint16(header, 30, 0);
    writeUint16(header, 32, 0);
    writeUint16(header, 34, 0);
    writeUint16(header, 36, 0);
    writeUint32(header, 38, 0);
    writeUint32(header, 42, localHeaderOffset);
    header.set(fileNameBytes, 46);
    return header;
  }

  function createZipEndRecord(centralDirectorySize, centralDirectoryOffset) {
    var record = new Uint8Array(22);
    writeUint32(record, 0, 0x06054b50);
    writeUint16(record, 4, 0);
    writeUint16(record, 6, 0);
    writeUint16(record, 8, 1);
    writeUint16(record, 10, 1);
    writeUint32(record, 12, centralDirectorySize);
    writeUint32(record, 16, centralDirectoryOffset);
    writeUint16(record, 20, 0);
    return record;
  }

  function getZipTimestamp(date) {
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
  }

  function encodeUtf8(value) {
    return new TextEncoder().encode(value);
  }

  function decodeUtf8(bytes) {
    return new TextDecoder("utf-8").decode(bytes);
  }

  function writeUint16(bytes, offset, value) {
    bytes[offset] = value & 255;
    bytes[offset + 1] = (value >>> 8) & 255;
  }

  function writeUint32(bytes, offset, value) {
    bytes[offset] = value & 255;
    bytes[offset + 1] = (value >>> 8) & 255;
    bytes[offset + 2] = (value >>> 16) & 255;
    bytes[offset + 3] = (value >>> 24) & 255;
  }

  function readUint16(view, offset) {
    return view.getUint16(offset, true);
  }

  function readUint32(view, offset) {
    return view.getUint32(offset, true);
  }

  function calculateCrc32(bytes) {
    var crc = -1;
    for (var index = 0; index < bytes.length; index += 1) {
      crc = (crc >>> 8) ^ getCrc32Table()[(crc ^ bytes[index]) & 255];
    }
    return (crc ^ -1) >>> 0;
  }

  function getCrc32Table() {
    if (getCrc32Table.table) {
      return getCrc32Table.table;
    }
    var table = [];
    for (var index = 0; index < 256; index += 1) {
      var value = index;
      for (var bit = 0; bit < 8; bit += 1) {
        value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      }
      table[index] = value >>> 0;
    }
    getCrc32Table.table = table;
    return table;
  }

  function padDatePart(value) {
    return String(value).padStart(2, "0");
  }

  function downloadExportBlob(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function chooseImportFile() {
    if (window.showOpenFilePicker) {
      getExportDirectoryHandle("read").then(function (directoryHandle) {
        return window.showOpenFilePicker(createImportPickerOptions({
          multiple: false,
          startIn: directoryHandle
        }));
      }).then(function (handles) {
        if (!handles || !handles[0]) {
          return null;
        }
        return handles[0].getFile();
      }).then(function (file) {
        if (file) {
          importFlowerFile(file);
        }
      }).catch(function (error) {
        if (!error || error.name !== "AbortError") {
          elements.importFileInput.value = "";
          elements.importFileInput.click();
        }
      });
      return;
    }

    elements.importFileInput.value = "";
    elements.importFileInput.click();
  }

  function createExportPickerOptions(format, options) {
    var type = format === "json"
      ? {
        description: "JSON",
        accept: { "application/json": [".json"] }
      }
      : {
        description: "ZIP",
        accept: { "application/zip": [".zip"] }
      };
    var pickerOptions = Object.assign({
      id: "flower-inventory-export-import",
      types: [type]
    }, options || {});
    if (!pickerOptions.startIn) {
      delete pickerOptions.startIn;
    }
    return pickerOptions;
  }

  function createImportPickerOptions(options) {
    var pickerOptions = Object.assign({
      id: "flower-inventory-export-import",
      types: [{
        description: "Sicherungsdatei",
        accept: {
          "application/json": [".json"],
          "application/zip": [".zip"]
        }
      }, {
        description: "JSON",
        accept: { "application/json": [".json"] }
      }, {
        description: "ZIP",
        accept: { "application/zip": [".zip"] }
      }]
    }, options || {});
    if (!pickerOptions.startIn) {
      delete pickerOptions.startIn;
    }
    return pickerOptions;
  }

  function getExportDirectoryHandle(mode) {
    if (!window.showDirectoryPicker) {
      return Promise.resolve(null);
    }

    return getSetting(EXPORT_DIRECTORY_KEY)
      .then(function (handle) {
        if (!isDirectoryHandle(handle)) {
          return pickExportDirectory(mode);
        }
        return verifyDirectoryPermission(handle, mode).then(function (allowed) {
          return allowed ? handle : pickExportDirectory(mode);
        });
      })
      .catch(function () {
        return null;
      });
  }

  function pickExportDirectory(mode) {
    return window.showDirectoryPicker({
      id: "flower-inventory-export-import-folder",
      mode: mode || "read"
    }).then(function (handle) {
      return setSetting(EXPORT_DIRECTORY_KEY, handle).then(function () {
        return handle;
      }).catch(function () {
        return handle;
      });
    }).catch(function (error) {
      if (error && error.name === "AbortError") {
        return null;
      }
      throw error;
    });
  }

  function isDirectoryHandle(handle) {
    return handle && handle.kind === "directory" && typeof handle.queryPermission === "function";
  }

  function verifyDirectoryPermission(handle, mode) {
    var options = { mode: mode || "read" };
    return handle.queryPermission(options).then(function (permission) {
      if (permission === "granted") {
        return true;
      }
      return handle.requestPermission(options).then(function (nextPermission) {
        return nextPermission === "granted";
      });
    }).catch(function () {
      return false;
    });
  }

  function importFlowers(event) {
    var file = event.target.files[0];
    if (!file) {
      return;
    }
    importFlowerFile(file);
  }

  function importFlowerFile(file) {
    readImportFlowersFromFile(file)
      .then(function (flowers) {
        if (flowers.length === 0) {
          throw new Error("empty");
        }

        return showImportModeDialog(flowers.length).then(function (replace) {
          if (replace === null) {
            throw new Error("import-cancelled");
          }
          return importNormalizedFlowers(flowers, replace);
        });
      })
      .then(loadFlowers)
      .then(function () {
        setSelectedFlower(state.flowers[0] ? state.flowers[0].id : null, {
          replaceHistory: true
        });
        closeForm();
        render();
        return showAppMessageDialog(t("importDone"));
      })
      .catch(function (error) {
        if (error && error.message === "import-cancelled") {
          return;
        }
        showAppMessageDialog(t("importFailed"));
      });
  }

  function readImportFlowersFromFile(file) {
    if (isZipFile(file)) {
      return readFileAsArrayBuffer(file)
        .then(readJsonTextFromZip)
        .then(parseImportFlowers);
    }
    return readFileAsText(file).then(parseImportFlowers);
  }

  function parseImportFlowers(text) {
    var data = JSON.parse(text);
    return normalizeImportData(data);
  }

  function isZipFile(file) {
    var name = file && file.name ? file.name : "";
    var type = file && file.type ? file.type : "";
    return /\.zip$/i.test(name) || /zip/i.test(type);
  }

  function readJsonTextFromZip(arrayBuffer) {
    var bytes = new Uint8Array(arrayBuffer);
    var view = new DataView(arrayBuffer);
    var endOffset = findZipEndRecord(view);
    if (endOffset < 0) {
      throw new Error("zip-end-not-found");
    }

    var entryCount = readUint16(view, endOffset + 10);
    var centralDirectoryOffset = readUint32(view, endOffset + 16);
    var entry = findJsonZipEntry(view, bytes, centralDirectoryOffset, entryCount);
    if (!entry) {
      throw new Error("json-entry-not-found");
    }
    return readZipEntryText(view, bytes, entry);
  }

  function findZipEndRecord(view) {
    var minimumOffset = Math.max(0, view.byteLength - 65557);
    for (var offset = view.byteLength - 22; offset >= minimumOffset; offset -= 1) {
      if (readUint32(view, offset) === 0x06054b50) {
        return offset;
      }
    }
    return -1;
  }

  function findJsonZipEntry(view, bytes, centralDirectoryOffset, entryCount) {
    var offset = centralDirectoryOffset;
    for (var index = 0; index < entryCount; index += 1) {
      if (readUint32(view, offset) !== 0x02014b50) {
        throw new Error("zip-central-directory-invalid");
      }
      var fileNameLength = readUint16(view, offset + 28);
      var extraLength = readUint16(view, offset + 30);
      var commentLength = readUint16(view, offset + 32);
      var fileName = decodeUtf8(bytes.slice(offset + 46, offset + 46 + fileNameLength));
      if (/\.json$/i.test(fileName)) {
        return {
          method: readUint16(view, offset + 10),
          compressedSize: readUint32(view, offset + 20),
          localHeaderOffset: readUint32(view, offset + 42)
        };
      }
      offset += 46 + fileNameLength + extraLength + commentLength;
    }
    return null;
  }

  function readZipEntryText(view, bytes, entry) {
    var localOffset = entry.localHeaderOffset;
    if (readUint32(view, localOffset) !== 0x04034b50) {
      throw new Error("zip-local-header-invalid");
    }
    var fileNameLength = readUint16(view, localOffset + 26);
    var extraLength = readUint16(view, localOffset + 28);
    var dataStart = localOffset + 30 + fileNameLength + extraLength;
    var compressedBytes = bytes.slice(dataStart, dataStart + entry.compressedSize);
    return decompressZipEntry(compressedBytes, entry.method).then(decodeUtf8);
  }

  function decompressZipEntry(bytes, method) {
    if (method === 0) {
      return Promise.resolve(bytes);
    }
    if (method !== 8 || !window.DecompressionStream) {
      throw new Error("zip-compression-unsupported");
    }

    try {
      var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return new Response(stream).arrayBuffer().then(function (buffer) {
        return new Uint8Array(buffer);
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function showImportModeDialog(count) {
    return showAppChoiceDialog({
      title: t("import"),
      message: t("importStatus", { count: count }) + "\n" + t("importReplaceQuestion"),
      acceptLabel: t("replaceImportData"),
      cancelLabel: t("addImportData"),
      acceptIcon: "icon-replace.png",
      cancelIcon: "icon-import-add.png",
      acceptValue: true,
      cancelValue: false,
      dismissValue: null,
      extraLabel: t("cancel"),
      extraIcon: "icon-exit.png",
      extraValue: null,
      iconOnly: true,
      noPrimary: true,
      panelClassName: "import-mode-dialog"
    });
  }

  function showAppMessageDialog(message) {
    return showAppChoiceDialog({
      title: t("appTitle"),
      message: message,
      acceptLabel: "OK",
      acceptIcon: "icon-save.png",
      hideCancel: true
    });
  }

  function showAppChoiceDialog(options) {
    return new Promise(function (resolve) {
      var overlay = document.createElement("div");
      var panel = document.createElement("div");
      var title = document.createElement("h2");
      var message = document.createElement("p");
      var actions = document.createElement("div");
      var acceptButton = document.createElement("button");
      var cancelButton = document.createElement("button");
      var finished = false;

      function finish(value) {
        if (finished) {
          return;
        }
        finished = true;
        overlay.remove();
        document.removeEventListener("keydown", handleKeydown);
        resolve(value);
      }

      function handleKeydown(event) {
        if (event.key === "Escape") {
          finish(options.dismissValue === undefined ? false : options.dismissValue);
        }
      }

      overlay.className = "online-search-overlay app-dialog-overlay";
      panel.className = "online-search-panel app-dialog-panel";
      if (options.panelClassName) {
        panel.classList.add(options.panelClassName);
      }
      title.textContent = options.title || t("appTitle");
      message.className = "app-dialog-message";
      message.textContent = options.message || "";
      actions.className = "app-dialog-actions";
      acceptButton.type = "button";
      configureDialogIconButton(acceptButton, options.acceptLabel || "OK", options.acceptIcon || "icon-save.png");
      if (!options.noPrimary) {
        acceptButton.classList.add("primary");
      }
      if (options.iconOnly) {
        acceptButton.classList.add("icon-only-choice");
      }
      acceptButton.addEventListener("click", function () {
        finish(options.acceptValue === undefined ? true : options.acceptValue);
      });

      panel.appendChild(title);
      panel.appendChild(message);
      actions.appendChild(acceptButton);

      if (!options.hideCancel) {
        cancelButton.type = "button";
        configureDialogIconButton(cancelButton, options.cancelLabel || t("cancel"), options.cancelIcon || "icon-exit.png");
        if (options.iconOnly) {
          cancelButton.classList.add("icon-only-choice");
        }
        cancelButton.addEventListener("click", function () {
          finish(options.cancelValue === undefined ? false : options.cancelValue);
        });
        actions.appendChild(cancelButton);
      }

      if (options.extraLabel && options.extraIcon) {
        var extraButton = document.createElement("button");
        extraButton.type = "button";
        configureDialogIconButton(extraButton, options.extraLabel, options.extraIcon);
        extraButton.classList.add("small-icon-choice");
        extraButton.addEventListener("click", function () {
          finish(options.extraValue === undefined ? false : options.extraValue);
        });
        actions.appendChild(extraButton);
      }

      panel.appendChild(actions);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
          finish(options.dismissValue === undefined ? false : options.dismissValue);
        }
      });
      document.addEventListener("keydown", handleKeydown);
      acceptButton.focus();
    });
  }

  function importNormalizedFlowers(flowers, replace) {
    var work = replace ? clearFlowers() : Promise.resolve();

    return work.then(function () {
      return Promise.all(flowers.map(function (flower) {
        if (!replace && flower.id && state.flowers.some(function (existing) {
          return existing.id === flower.id;
        })) {
          flower.id = createId();
        }
        return saveFlower(flower);
      }));
    });
  }

  function normalizeImportData(data) {
    var source = Array.isArray(data) ? data : data.flowers;
    if (!Array.isArray(source)) {
      return [];
    }

    return source
      .filter(function (flower) {
        return flower && flower.names && flower.names.hu && getImportedImages(flower).length > 0;
      })
      .map(function (flower) {
        var images = getImportedImages(flower);
        return {
          id: typeof flower.id === "string" && flower.id ? flower.id : createId(),
          names: {
            hu: String(flower.names.hu || "").trim(),
            la: String(flower.names.la || "").trim(),
            de: String(flower.names.de || "").trim(),
            en: String(flower.names.en || "").trim()
          },
          description: normalizeDescription(flower.description),
          links: normalizeLinks(flower.links),
          imageData: images[0],
          images: images,
          imageSources: normalizeImageSources(flower.imageSources, images.length),
          imageNames: normalizeImageNames(flower.imageNames, images.length, flower.names.hu || "blume"),
          imageInfos: normalizeImageInfos(flower.imageInfos, images.length),
          favoriteImageIndex: normalizeFavoriteImageIndex(flower.favoriteImageIndex, images),
          updatedAt: flower.updatedAt || new Date().toISOString()
        };
      });
  }

  function normalizeImages(images) {
    if (Array.isArray(images)) {
      return images.map(function (image) {
        return String(image || "");
      }).filter(Boolean);
    }
    return images ? [String(images)] : [];
  }

  function normalizeImageSources(sources, count) {
    var normalized = Array.isArray(sources) ? sources.map(function (source) {
      return String(source || "").trim();
    }) : [];
    while (normalized.length < count) {
      normalized.push("");
    }
    return normalized.slice(0, count);
  }

  function normalizeImageNames(names, count, baseName) {
    var normalized = Array.isArray(names) ? names.map(function (name) {
      return String(name || "").trim();
    }) : [];
    while (normalized.length < count) {
      normalized.push(createImageName(baseName, normalized.length + 1, "png"));
    }
    return normalized.slice(0, count);
  }

  function normalizeImageInfos(infos, count) {
    var normalized = Array.isArray(infos) ? infos.map(function (info) {
      return normalizeImageInfoEntry(info);
    }) : [];
    while (normalized.length < count) {
      normalized.push(createEmptyImageInfo());
    }
    return normalized.slice(0, count);
  }

  function normalizeImageInfoEntry(info) {
    if (info && typeof info === "object" && !Array.isArray(info)) {
      return {
        hu: normalizeImageInfoText(info.hu),
        de: normalizeImageInfoText(info.de),
        en: normalizeImageInfoText(info.en)
      };
    }

    var text = normalizeImageInfoText(info);
    return {
      hu: text,
      de: "",
      en: ""
    };
  }

  function createEmptyImageInfo() {
    return {
      hu: "",
      de: "",
      en: ""
    };
  }

  function normalizeImageInfoText(value) {
    return String(value || "").replace(/[\r\n]+/g, " ").trim();
  }

  function promoteImageToFirst(images, sources, imageIndex, names, infos) {
    var imageList = normalizeImages(images);
    var sourceList = normalizeImageSources(sources, imageList.length);
    var nameList = normalizeImageNames(names, imageList.length, "blume");
    var infoList = normalizeImageInfos(infos, imageList.length);
    var index = normalizeFavoriteImageIndex(imageIndex, imageList);

    if (index <= 0 || imageList.length <= 1) {
      return {
        images: imageList,
        sources: sourceList,
        names: nameList,
        infos: infoList
      };
    }

    return {
      images: [imageList[index]].concat(imageList.slice(0, index), imageList.slice(index + 1)),
      sources: [sourceList[index]].concat(sourceList.slice(0, index), sourceList.slice(index + 1)),
      names: [nameList[index]].concat(nameList.slice(0, index), nameList.slice(index + 1)),
      infos: [infoList[index]].concat(infoList.slice(0, index), infoList.slice(index + 1))
    };
  }

  function getFlowerImages(flower) {
    if (!flower) {
      return [];
    }
    var images = normalizeImages(flower.images);
    return images.length ? images : normalizeImages(flower.imageData);
  }

  function getFlowerImageSources(flower) {
    return normalizeImageSources(flower && flower.imageSources, getFlowerImages(flower).length);
  }

  function getFlowerImageNames(flower) {
    return normalizeImageNames(flower && flower.imageNames, getFlowerImages(flower).length, getImageBaseNameForFlower(flower));
  }

  function getFlowerImageInfos(flower) {
    return normalizeImageInfos(flower && flower.imageInfos, getFlowerImages(flower).length);
  }

  function getImageNamesForFiles(files, flower, existingNames) {
    var usedNames = {};
    normalizeImageNames(existingNames, Array.isArray(existingNames) ? existingNames.length : 0, getImageBaseNameForFlower(flower)).forEach(function (name) {
      usedNames[name.toLocaleLowerCase()] = true;
    });

    var startIndex = Array.isArray(existingNames) ? existingNames.length + 1 : 1;
    return files.map(function (file, index) {
      var extension = getImageFileExtension(file);
      return createNextImageName(getImageBaseNameForFlower(flower), extension, usedNames, startIndex + index);
    });
  }

  function createNextImageName(baseName, extension, usedNames, startIndex) {
    var index = Math.max(1, startIndex || 1);
    var name = "";
    do {
      name = createImageName(baseName, index, extension);
      index += 1;
    } while (usedNames[name.toLocaleLowerCase()]);
    usedNames[name.toLocaleLowerCase()] = true;
    return name;
  }

  function createImageName(baseName, index, extension) {
    return sanitizeImageFileBaseName(baseName || "blume") + "-" + String(index).padStart(3, "0") + "." + (extension || "png");
  }

  function getImageFileExtension(file) {
    var type = String(file && file.type || "").toLowerCase();
    if (type.indexOf("jpeg") !== -1 || type.indexOf("jpg") !== -1) {
      return "jpg";
    }
    if (type.indexOf("webp") !== -1) {
      return "webp";
    }
    if (type.indexOf("gif") !== -1) {
      return "gif";
    }
    return "png";
  }

  function getImageBaseNameForFlower(flower) {
    return getFirstNamePart(getLocalizedFlowerName(flower) || (flower && flower.names && (flower.names.hu || flower.names.de || flower.names.en)) || "blume");
  }

  function getPendingImageBaseName() {
    return getFirstNamePart(elements.nameHu.value.trim() || elements.nameDe.value.trim() || elements.nameEn.value.trim() || "blume");
  }

  function getPendingFlowerLike() {
    return {
      names: {
        hu: elements.nameHu.value.trim(),
        la: elements.nameLa.value.trim(),
        de: elements.nameDe.value.trim(),
        en: elements.nameEn.value.trim()
      }
    };
  }

  function sanitizeImageFileBaseName(value) {
    return String(value || "blume")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "_")
      .replace(/_+$/g, "")
      .slice(0, 64) || "blume";
  }

  function getImportedImages(flower) {
    var images = normalizeImages(flower && flower.images);
    return images.length ? images : normalizeImages(flower && flower.imageData);
  }

  function getFlowerImageIndex(flower) {
    var images = getFlowerImages(flower);
    var index = state.imageIndexes[flower.id] || 0;
    if (index < 0) {
      return 0;
    }
    if (index >= images.length) {
      return Math.max(0, images.length - 1);
    }
    return index;
  }

  function normalizeFavoriteImageIndex(index, images) {
    var imageList = normalizeImages(images);
    var parsedIndex = Number(index);
    if (!Number.isFinite(parsedIndex) || parsedIndex < 0) {
      return 0;
    }
    parsedIndex = Math.floor(parsedIndex);
    if (parsedIndex >= imageList.length) {
      return Math.max(0, imageList.length - 1);
    }
    return parsedIndex;
  }

  function getFavoriteImageIndex(flower) {
    return normalizeFavoriteImageIndex(flower && flower.favoriteImageIndex, getFlowerImages(flower));
  }

  function getFavoriteFlowerImageData(flower) {
    var images = getFlowerImages(flower);
    return images[getFavoriteImageIndex(flower)] || images[0] || flower.imageData || "";
  }

  function getCurrentFlowerImageData(flower) {
    var images = getFlowerImages(flower);
    return images[getFlowerImageIndex(flower)] || images[0] || flower.imageData || "";
  }

  function getSelectedFlower() {
    return state.flowers.find(function (flower) {
      return flower.id === state.selectedId;
    }) || null;
  }

  function getFlowerById(id) {
    return state.flowers.find(function (flower) {
      return flower.id === id;
    }) || null;
  }

  function getLocalizedFlowerName(flower) {
    if (!flower || !flower.names) {
      return "";
    }

    if (state.language === "de") {
      return flower.names.de || flower.names.hu || flower.names.en || flower.names.la || "";
    }
    if (state.language === "en") {
      return flower.names.en || flower.names.hu || flower.names.de || flower.names.la || "";
    }
    return flower.names.hu || flower.names.de || flower.names.en || flower.names.la || "";
  }

  function getFlowerTitle(flower) {
    return getFirstNamePart(getLocalizedFlowerName(flower));
  }

  function getFirstNamePart(name) {
    return String(name || "").split("/")[0].trimEnd() || String(name || "").trim() || "";
  }

  function getTitleFontSize(text) {
    var length = String(text || "").length;
    if (length > 42) {
      return "26px";
    }
    if (length > 34) {
      return "30px";
    }
    if (length > 26) {
      return "36px";
    }
    return "";
  }

  function normalizeDescription(description) {
    if (description && typeof description === "object" && !Array.isArray(description)) {
      return {
        hu: sanitizeDescriptionHtml(description.hu || ""),
        de: sanitizeDescriptionHtml(description.de || ""),
        en: sanitizeDescriptionHtml(description.en || "")
      };
    }

    return {
      hu: "",
      de: sanitizeDescriptionHtml(description || ""),
      en: ""
    };
  }

  function getDescriptionForLanguage(flower, language) {
    var descriptions = normalizeDescription(flower ? flower.description : "");
    return descriptions[language] || "";
  }

  function getLocalizedDescription(flower) {
    var descriptions = normalizeDescription(flower ? flower.description : "");
    return descriptions[state.language] || descriptions.hu || descriptions.de || descriptions.en || "";
  }

  function normalizeLinks(links) {
    if (!Array.isArray(links)) {
      return [];
    }

    return links.map(function (link) {
      var url = String(link && link.url || "").trim();
      return {
        id: link && link.id ? String(link.id) : createId(),
        names: {
          hu: String(link && link.names && link.names.hu || "").trim(),
          de: String(link && link.names && link.names.de || "").trim(),
          en: String(link && link.names && link.names.en || "").trim()
        },
        url: normalizeUrl(url)
      };
    }).filter(function (link) {
      return link.url && (link.names.hu || link.names.de || link.names.en);
    });
  }

  function normalizeUrl(url) {
    if (!url) {
      return "";
    }
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
      return url;
    }
    return "https://" + url;
  }

  function getLocalizedLinkName(link) {
    if (state.language === "de") {
      return link.names.de || link.names.hu || link.names.en || link.url;
    }
    if (state.language === "en") {
      return link.names.en || link.names.hu || link.names.de || link.url;
    }
    return link.names.hu || link.names.de || link.names.en || link.url;
  }

  function getSearchableLinks(flower) {
    return normalizeLinks(flower.links).reduce(function (values, link) {
      values.push(link.names.hu, link.names.de, link.names.en, link.url);
      return values;
    }, []);
  }

  function compareFlowers(a, b) {
    var direction = getCurrentSortDirection() === "za" ? -1 : 1;
    return direction * getSortFlowerName(a).localeCompare(getSortFlowerName(b), getSortLocale(), { sensitivity: "base" });
  }

  function sortFlowers() {
    state.flowers.sort(compareFlowers);
  }

  function toggleSortDirection() {
    var nextDirection = getCurrentSortDirection() === "az" ? "za" : "az";
    state.sortDirections[state.language] = nextDirection;
    saveSortDirections();
    sortFlowers();
    updateSortButton();
    render();
  }

  function getCurrentSortDirection() {
    return state.sortDirections[state.language] || "az";
  }

  function getSortFlowerName(flower) {
    if (state.language === "de") {
      return flower.names.de || flower.names.hu || flower.names.en || flower.names.la || "";
    }
    if (state.language === "en") {
      return flower.names.en || flower.names.hu || flower.names.de || flower.names.la || "";
    }
    return flower.names.hu || flower.names.de || flower.names.en || flower.names.la || "";
  }

  function getSortLocale() {
    if (state.language === "hu") {
      return "hu";
    }
    if (state.language === "en") {
      return "en";
    }
    return "de";
  }

  function updateSortButton() {
    var isAz = getCurrentSortDirection() === "az";
    var label = t(isAz ? "sortAz" : "sortZa");
    elements.sortFlowersIcon.src = isAz ? "icon-sort-az.png" : "icon-sort-za.png";
    elements.sortFlowersButton.title = label;
    elements.sortFlowersButton.setAttribute("aria-label", label);
    elements.sortFlowersLabel.textContent = label;
  }

  function loadSortDirections() {
    try {
      var stored = JSON.parse(localStorage.getItem("flowerInventorySortDirections") || "{}");
      return {
        hu: stored.hu === "za" ? "za" : "az",
        de: stored.de === "za" ? "za" : "az",
        en: stored.en === "za" ? "za" : "az"
      };
    } catch (error) {
      return { hu: "az", de: "az", en: "az" };
    }
  }

  function saveSortDirections() {
    localStorage.setItem("flowerInventorySortDirections", JSON.stringify(state.sortDirections));
  }

  function normalizeSearchText(value) {
    var text = String(value || "").trim().toLocaleLowerCase();
    if (text.normalize) {
      text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    return text
      .replace(/ő/g, "o")
      .replace(/ű/g, "u")
      .replace(/đ/g, "d")
      .replace(/ł/g, "l")
      .replace(/ø/g, "o")
      .replace(/æ/g, "ae")
      .replace(/œ/g, "oe")
      .replace(/ß/g, "ss");
  }

  function cssEscape(value) {
    if (window.CSS && window.CSS.escape) {
      return window.CSS.escape(value);
    }
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function createId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return "flower-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function readFileAsDataUrl(file) {
    return readFile(file, "readAsDataURL");
  }

  function readFileAsText(file) {
    return readFile(file, "readAsText");
  }

  function readFileAsArrayBuffer(file) {
    return readFile(file, "readAsArrayBuffer");
  }

  function readFile(file, method) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader[method](file);
    });
  }

  function showFormError(message) {
    elements.formError.textContent = message;
  }

  function clearFormError() {
    elements.formError.textContent = "";
  }

  function showFatalError(error) {
    var details = getErrorMessage(error);
    var address = window.location.href;
    elements.detailView.innerHTML = [
      "<div class=\"empty-state\"><div class=\"empty-state-inner\">",
      "<h2>", escapeHtml(t("dbUnavailableTitle")), "</h2>",
      "<p>", escapeHtml(t("dbUnavailableText")), "</p>",
      "<p class=\"fatal-detail\">", escapeHtml(t("dbUnavailableDetails", { details: details })), "</p>",
      "<p class=\"fatal-detail\">", escapeHtml(t("currentAddress", { address: address })), "</p>",
      "<p class=\"fatal-detail\">", escapeHtml(t("resetDatabaseNote")), "</p>",
      "<p class=\"fatal-detail\">", escapeHtml(t("repairDatabaseNote")), "</p>",
      "<input id=\"repairImportFileInput\" class=\"visually-hidden\" type=\"file\" accept=\"application/json,application/zip,application/x-zip-compressed,.json,.zip\">",
      "<button id=\"repairImportButton\" class=\"primary\" type=\"button\">", escapeHtml(t("repairDatabaseImport")), "</button> ",
      "<button id=\"resetDatabaseButton\" class=\"primary\" type=\"button\">", escapeHtml(t("resetDatabase")), "</button>",
      "</div></div>"
    ].join("");
    var resetButton = document.getElementById("resetDatabaseButton");
    var repairButton = document.getElementById("repairImportButton");
    var repairInput = document.getElementById("repairImportFileInput");
    if (resetButton) {
      resetButton.addEventListener("click", resetLocalDatabase);
    }
    if (repairButton && repairInput) {
      repairButton.addEventListener("click", function () {
        repairInput.value = "";
        repairInput.click();
      });
      repairInput.addEventListener("change", repairLocalDatabaseFromImport);
    }
    window.console.error(error);
  }

  function repairLocalDatabaseFromImport(event) {
    var file = event.target.files[0];
    var previousDatabaseName = getActiveDatabaseName();
    if (!file) {
      return;
    }
    if (!window.confirm(t("repairDatabaseConfirm"))) {
      return;
    }

    readImportFlowersFromFile(file)
      .then(function (flowers) {
        if (flowers.length === 0) {
          throw new Error("empty");
        }
        switchToFreshDatabaseName();
        return openDatabase().then(function (db) {
          state.db = db;
          state.flowers = [];
          return importNormalizedFlowers(flowers, true);
        }).then(function () {
          return setSetting(DEMO_SEEDED_KEY, true);
        });
      })
      .then(function () {
        window.alert(t("repairDatabaseDone"));
        window.location.reload();
      })
      .catch(function (error) {
        sessionStorage.removeItem(PENDING_REPAIR_IMPORT_KEY);
        if (previousDatabaseName === DB_NAME) {
          localStorage.removeItem(ACTIVE_DB_NAME_KEY);
        } else {
          localStorage.setItem(ACTIVE_DB_NAME_KEY, previousDatabaseName);
        }
        window.alert(t("repairDatabaseFailed") + "\n\n" + t("repairDatabaseStorageBroken") + "\n\n" + getErrorMessage(error));
      });
  }

  function resumePendingRepairImport() {
    if (sessionStorage.getItem(PENDING_REPAIR_IMPORT_KEY) !== "1") {
      return;
    }
    sessionStorage.removeItem(PENDING_REPAIR_IMPORT_KEY);
    window.setTimeout(function () {
      chooseImportFile();
    }, 300);
  }

  function resetLocalDatabase() {
    if (!window.confirm(t("resetDatabaseConfirm"))) {
      return;
    }
    deleteLocalDatabase()
      .then(function () {
        localStorage.removeItem(ACTIVE_DB_NAME_KEY);
        window.location.reload();
      })
      .catch(function (error) {
        window.alert(t("resetDatabaseFailed") + "\n" + getErrorMessage(error));
      });
  }

  function deleteLocalDatabase() {
    return new Promise(function (resolve, reject) {
      var indexedDbApi = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      var request = null;
      var databaseName = getActiveDatabaseName();

      if (!indexedDbApi) {
        reject(new Error("window.indexedDB is missing"));
        return;
      }

      if (state.db) {
        state.db.close();
        state.db = null;
      }

      try {
        request = indexedDbApi.deleteDatabase(databaseName);
      } catch (error) {
        reject(error);
        return;
      }

      request.onsuccess = resolve;
      request.onblocked = function () {
        reject(new Error("deleteDatabase blocked; close other tabs with this app and try again"));
      };
      request.onerror = function () {
        reject(request.error || new Error("deleteDatabase failed"));
      };
    });
  }

  function getErrorMessage(error) {
    if (!error) {
      return "unknown error";
    }
    if (error.name && error.message) {
      return error.name + ": " + error.message;
    }
    return String(error.message || error.name || error);
  }

  // Kleine lokale SVG-Bilder für den ersten Start. Eigene Fotos können danach ersetzt werden.
  function svgImage(color, background, label) {
    var svg = [
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 900 650\">",
      "<rect width=\"900\" height=\"650\" fill=\"" + background + "\"/>",
      "<path d=\"M450 520 C440 430 440 350 450 260\" stroke=\"#2f7d62\" stroke-width=\"18\" fill=\"none\" stroke-linecap=\"round\"/>",
      "<ellipse cx=\"450\" cy=\"230\" rx=\"88\" ry=\"132\" fill=\"" + color + "\"/>",
      "<ellipse cx=\"360\" cy=\"285\" rx=\"72\" ry=\"112\" fill=\"" + color + "\" opacity=\"0.86\" transform=\"rotate(-32 360 285)\"/>",
      "<ellipse cx=\"540\" cy=\"285\" rx=\"72\" ry=\"112\" fill=\"" + color + "\" opacity=\"0.86\" transform=\"rotate(32 540 285)\"/>",
      "<ellipse cx=\"450\" cy=\"320\" rx=\"82\" ry=\"92\" fill=\"" + color + "\" opacity=\"0.94\"/>",
      "<circle cx=\"450\" cy=\"288\" r=\"42\" fill=\"#f4c542\"/>",
      "<path d=\"M437 462 C350 420 305 442 270 500 C340 520 395 510 437 462Z\" fill=\"#3b8f6d\"/>",
      "<path d=\"M463 445 C540 390 600 402 642 452 C572 486 514 488 463 445Z\" fill=\"#3b8f6d\"/>",
      "<text x=\"450\" y=\"600\" text-anchor=\"middle\" font-family=\"Segoe UI, Arial\" font-size=\"42\" font-weight=\"700\" fill=\"#22211d\">" + escapeSvg(label) + "</text>",
      "</svg>"
    ].join("");
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function escapeSvg(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}());
