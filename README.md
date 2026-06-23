# Blumen-Inventar

Diese Anwendung ist eine rein lokale HTML-Anwendung zur Verwaltung eines Blumen-Inventars. Sie benötigt keinen Server, kein Node.js, kein Backend und keine Internetverbindung.

Die Benutzeroberfläche kann im Hauptfenster rechts oben über Flaggen zwischen Magyar, Deutsch und English umgeschaltet werden.

## Start

Öffne die Datei `index.html` per Doppelklick im Browser. Alternativ kann die Datei über `Datei öffnen` im Browser ausgewählt werden.

## Lokale Speicherung

Alle Blumen werden lokal im Browser mit IndexedDB gespeichert. Zu jeder Blume werden der Magyar Name, optionale Namen in Latein, Deutsch und English, dreisprachige formatierbare Beschreibungen, Links sowie das Bild gespeichert.

Die Daten liegen im Speicherbereich des jeweiligen Browsers auf diesem PC. Eine HTML-Datei darf aus Sicherheitsgründen keine beliebigen Dateien automatisch auf dem PC überschreiben. Deshalb speichert die Anwendung nicht direkt in eine lokale Inventardatei, sondern nutzt IndexedDB.

## Optionale Online-Ergänzung

Wenn eine Internetverbindung vorhanden ist und ein Name im Feld `Latein` eingetragen wird, versucht die Anwendung passende Namen für `Magyar`, `Deutsch` und `English` über Wikidata zu ermitteln. Bereits ausgefüllte Felder werden dabei nicht überschrieben. Ohne Internetverbindung kann alles weiterhin manuell eingetragen werden.

Über das Zauberstab-Icon im linken Bereich kann eine neue Blume aus dem Internet angelegt werden. Je nach aktuell ausgewählter Sprache kann ein ungarischer, deutscher oder englischer Name eingegeben werden; ein lateinischer Name ist ebenfalls möglich. Die Eingabe und die Auswahl der Online-Treffer erfolgen in einem Dialogfenster, die Auswahl kann per Mausklick getroffen werden. Bei Sorten- oder Handelsnamen wie `Echinacea purpurea 'Alba'` oder `Rudbeckia hirta 'Cappuccino'` wird zusätzlich nach dem botanischen Basistaxon gesucht, damit gängige Blumen trotzdem angeboten werden können.

Die Anwendung lädt bis zu 10 ausreichend große Bilder, speichert aber eine begrenzte, browserfreundliche Bildgröße lokal in IndexedDB. Wenn eine Online-Quelle zum Bild verfügbar ist, wird sie mitgespeichert und kann über das Link-Icon beim Bild geöffnet werden.

## Export und Import

Mit `Exportieren` wird eine JSON-Datei gespeichert. Der vorgeschlagene Dateiname beginnt mit Datum und Uhrzeit, zum Beispiel `2026-06-21-09-50-blumen-inventar-export.json`. In Browsern mit File System Access API kann Speicherort und Dateiname im Speichern-Dialog ausgewählt werden. Der Ordner `export` im App-Verzeichnis ist als Ablage für Sicherungen vorgesehen.

Mit `Importieren` kann eine zuvor exportierte JSON-Datei über einen Dateiauswahldialog wieder geladen werden. Export und Import verwenden dieselbe Ordner-Erinnerung des Browsers. Beim Import fragt die Anwendung, ob die bestehenden Daten ersetzt oder ob die importierten Blumen ergänzt werden sollen.

In der Detailansicht kann die aktuell angezeigte Blume außerdem als PDF-Datei heruntergeladen werden. Das PDF enthält Bild, Namen, die formatierte Leírás und die erfassten Links als klickbare Verweise.

## Empfohlene Browser

Empfohlen werden aktuelle Versionen von:

- Microsoft Edge
- Google Chrome
- Mozilla Firefox

Die Anwendung funktioniert offline. Für dauerhafte Speicherung muss IndexedDB im Browser aktiviert sein.
