#include "recherche_fichier.h"

Recherche_Fichier::Recherche_Fichier(QString Lien, QString Site, QDate Date, bool ite = false)
    : Chemin(Lien),
    fichier(Chemin),
    fichierInfo(Chemin)
{
    isIteratif = ite;
    dataLog.Site = Site;
    // setup des chemins
    cheminXml = file_path + "_" + Date.toString(qdate_format) + file_format;
    cheminBufferXml = file_path + "_" + Date.toString(qdate_format) + "_buffer" + file_format;

    fichierXml.setFileName(cheminXml);


    // Si fichier xml non existant -> le créer
    if( !fichierXml.exists() && fichierXml.open(QIODevice::ReadWrite | QIODevice::Text)){
        QXmlStreamWriter Nouveau_texte(&fichierXml);
        Nouveau_texte.setAutoFormatting(true);

        Nouveau_texte.writeStartDocument();
        Nouveau_texte.writeStartElement("Logs");
        Nouveau_texte.writeEndElement();
        fichierXml.close();
    }


    // Connexion db
    db_AS400.setConnectOptions("SQL_ATTR_TRACE=SQL_OPT_TRACE_ON");
    db_AS400.setHostName("AS400");

    loadEnvFile(string(ENV_PATH));
    QString
        db_username1 = QString(std::getenv(ENV_VAR2)),
        db_password1 = QString(std::getenv(ENV_VAR3)),
        db_name1     = QString(std::getenv(ENV_VAR4)),

        db_username2 = QString(std::getenv(ENV_VAR5)),
        db_password2 = QString(std::getenv(ENV_VAR6)),
        db_name2     = QString(std::getenv(ENV_VAR7)),
        lib_name	 = QString(std::getenv(ENV_VAR8));
    dbName1 = db_name1;
    dbName2 = db_name2;
    libName = lib_name;

    if (db_username1.isEmpty()) throw std::runtime_error(ENV_VAR2 " not defined !");
    if (db_password1.isEmpty()) throw std::runtime_error(ENV_VAR3 " not defined !");
    if (db_name1.isEmpty())     throw std::runtime_error(ENV_VAR4 " not defined !");

    if (db_username2.isEmpty()) throw std::runtime_error(ENV_VAR5 " not defined !");
    if (db_password2.isEmpty()) throw std::runtime_error(ENV_VAR6 " not defined !");
    if (db_name2.isEmpty())     throw std::runtime_error(ENV_VAR7 " not defined !");


    db_liste.setUserName(db_username1);
    db_liste.setPassword(db_password1);
    db_liste.setDatabaseName(db_name1);

    db_AS400.setUserName(db_username2);
    db_AS400.setPassword(db_password2);
    db_AS400.setDatabaseName(db_name2);


    if (!db_liste.isOpen() && !db_liste.open()) {
        throw std::runtime_error("Erreur : Impossible d'ouvrir la connexion à la base de données : " + dbName1.toStdString() +  "\n" + db_liste.lastError().text().toStdString());
    }
    if (!db_AS400.open()) throw std::runtime_error("Impossible d'ouvrir la connexion à la base de données :" + dbName2.toStdString() +  "\n" +db_AS400.lastError().text().toStdString());

    // recuperation datetime lastlog in bdd
    QSqlQuery query(db_AS400);
    QString sql = QString(R"(
            SELECT CREATION_DATE, CREATION_HEURE
            FROM %1.SUIVIE_PANNE_CARTEELECTRONIQUE
            ORDER BY CONCAT(CREATION_DATE, CREATION_HEURE) DESC
            FETCH FIRST 1 ROW ONLY
        )").arg(libName);
    query.prepare(sql);

    if (query.exec() && query.next()) {
        QString lastLogDataString = query.value(0).toString() + " " + query.value(1).toString();
        lastLog = QDateTime::fromString(lastLogDataString, qdatetime_format);
    }
}

void Recherche_Fichier::rf_start(){
    QString texte;

    if (!db_liste.isOpen() && !db_liste.open()) throw std::runtime_error("Erreur : Impossible d'ouvrir la connexion à la base de données : " + dbName1.toStdString() +  "\n" + db_liste.lastError().text().toStdString());
    if (!db_AS400.open()) throw std::runtime_error("Impossible d'ouvrir la connexion à la base de données :" + dbName2.toStdString() +  "\n" +db_AS400.lastError().text().toStdString());


    if(fichier.open(QIODevice::ReadOnly | QIODevice::Text)){   // Lecture fichier
        QTextStream stream(&fichier);
        stream.setEncoding(QStringConverter::Latin1);
        texte = stream.readAll();
        fichier.close();
    }
    else{   // erreur d'ouverture
        throw std::runtime_error("Ouverture impossible de " + Chemin.toStdString());
        return;
    }
    Text = texte.split("\n", Qt::SkipEmptyParts);


    QRegularExpressionMatch match;
    QString line;

    // Parcourir chaque ligne et appliquer les regex
    for (indexText = 0; indexText < Text.size() -1; indexText++) {
        line = Text.at(indexText);

        match = reEntete.match(line);
        if (match.hasMatch()) {
            dataEntete.Article = match.captured(1).trimmed();
            dataEntete.FIC = match.captured(2).trimmed();
            dataEntete.ind_FIC = match.captured(3).trimmed();

            /*
            qDebug() << "=== Nouvelle Entrée d'Entête ===";
            qDebug() << "Article entête" << dataEntete.Article;
            qDebug() << "FIC entête" << dataEntete.FIC;
            qDebug() << "iFIC entête" << dataEntete.ind_FIC;
            qDebug() << "================================";
            */
        }

        // 1. Extraire la date et heure du test
        match = reDateTime.match(line);
        if (match.hasMatch()) {
            dataLog.Date_Heure = match.captured(1).trimmed() + " " + match.captured(2).trimmed();
        }

        // 2. Extraire le résultat du test et la durée
        match = reResultatTest.match(line);
        if (match.hasMatch()) {
            dataLog.duree = match.captured(1).trimmed().toInt()*60 + match.captured(2).trimmed().toInt();
        }

        // 3. Extraire la ligne de résultat avec $M/R
        match = reLigneResult.match(line);
        if (match.hasMatch()) {
            dataLog.Statut = match.captured(1).trimmed();
            dataLog.OF = match.captured(2).trimmed();
            dataLog.Code_AOI = match.captured(3).trimmed();
            dataLog.Poste = match.captured(4).trimmed();

            QString AOI = dataLog.Code_AOI;
            trackingMap[AOI].append(dataLog.Statut);
            resolve(AOI);
            recup_infoCarte();
        }
    }

    db_AS400.close();
    db_liste.close();
}

void Recherche_Fichier::recup_infoCarte() {
    if (dataLog.Statut == "DEPANNAGE" || dataLog.Statut == "I" || isExist(dataLog.Code_AOI, dataLog.OF)) {
        // Reset variable
        dataLog.reset();
        panneText = "";
        return;
    }
    else if (dataLog.Statut == "M")			{dataLog.stateFlag = "2";}
    else if (dataLog.Statut == "B") 		{dataLog.stateFlag = "1";}

    // Verif de date pour évité les doublons.
    QDateTime logDate = QDateTime::fromString(dataLog.Date_Heure, qdatetime_format_old);
    //qDebug() << "Log BDD: " << lastLog;
    //qDebug() << "Log fichier: " << logDate;

    if (!isIteratif && logDate <= lastLog) return;


    // Scrapping des données
    QRegularExpressionMatchIterator matchIt;
    QRegularExpressionMatch match;
    QString line;

    indexText++; // ignoré la ligne de résultat
    // Si carte mauvaise extraire info panne
    for(;indexText < (Text.size() -1) && dataLog.stateFlag == "2"; indexText++) {
        line = Text.at(indexText);
        if (reSeparateur.match(line).hasMatch()) break;
        panneText += "\n" + line;
    }
    matchIt = rePanne.globalMatch(panneText);
    if (dataLog.stateFlag =="2") {
        // qDebug() << "Panne: " << panneText;

        // Match 1
        if (matchIt.hasNext()) { // 4. Extraire la panne et sa désignation
            match = matchIt.next();
            dataLog.Code_Panne = match.captured(1).trimmed();
            dataLog.Definition_panne = match.captured(2).trimmed();
        }

        // Match 2
        if (matchIt.hasNext()) {
            match = matchIt.next();
            // 5. Si des valeurs sont trouvé les récuperer
            if (!match.captured(3).isEmpty()) { // Si mesure
                // qDebug() << "mesure";
                dataLog.mesure = match.captured(3).toDouble();
                dataLog.uniteMesure = match.captured(4).trimmed();
                dataLog.limite_mini = match.captured(5).toDouble();
                dataLog.limite_max = match.captured(7).toDouble();
                dataLog.uniteLimite = match.captured(6).trimmed();
            }
            else if (!match.captured(8).isEmpty()) { // Si attendu/reçu
                // qDebug() << "attendu/reçu";
                dataLog.mesure = match.captured(9).toDouble();
                dataLog.limite_mini = match.captured(8).toDouble();
                dataLog.limite_max = match.captured(8).toDouble();
            }
            else if (!match.captured(10).isEmpty()) { // Si relevée/attendue
                // qDebug() << "relevée/attendu";
                dataLog.mesure = match.captured(10).toDouble();
                dataLog.limite_mini = match.captured(11).toDouble();
                dataLog.limite_max = match.captured(11).toDouble();
            }
            else { // Sinon désigner ça comme un commentaire
                // qDebug() << "comm";
                dataLog.Commentaire_panne += match.captured(12).trimmed();
                while (matchIt.hasNext()) {
                    match = matchIt.next();
                    dataLog.Commentaire_panne += "\n" + match.captured(12).trimmed();
                }
            }
        }


        /*
        qDebug() << "=== Nouvelle Entrée de Log ===";
        qDebug() << "Date du test:" << dataLog.Date_Heure;
        qDebug() << "Résultat du test:" << dataLog.Statut << ", stateFlag: " << dataLog.stateFlag;
        qDebug() << "Durée du test:" << dataLog.duree;
        qDebug() << "OF:" << dataLog.OF;
        qDebug() << "AOI:" << dataLog.Code_AOI;
        qDebug() << "Poste:" << dataLog.Poste;
        qDebug() << "Numéro panne:" << dataLog.Code_Panne;
        qDebug() << "Désignation panne:" << dataLog.Definition_panne;
        qDebug() << "Commentaire panne:" << dataLog.Commentaire_panne;
        qDebug() << "Mesure:" << dataLog.mesure << dataLog.uniteMesure;
        qDebug() << "Limite mini:" << dataLog.limite_mini << dataLog.uniteLimite;
        qDebug() << "Limite maxi:" << dataLog.limite_max << dataLog.uniteLimite;
        qDebug() << "FIC entête" << dataEntete.FIC;
        qDebug() << "iFIC entête" << dataEntete.ind_FIC;
        qDebug() << "============================";
        */
    }


    // nommer selon le Poste
    if (mapNomenclature.contains(dataLog.Poste)) {
        dataLog.Poste = mapNomenclature.value(dataLog.Poste);
        // qDebug() << "Poste transformé : " << dataLog.Poste;
    } else {
        throw std::runtime_error("Aucune correspondance trouvée pour : " + dataLog.Poste.toStdString());
    }
    dataLog.Site = reSite.match(dataLog.Poste).captured(1).trimmed();


    // Récuperation de code Article
    float currentYear = currentdate.year();
    dataLog.Code_Article = Recuperation_Code_Article_Recursive(dataLog.Code_AOI, currentYear + 0.5);
    if (dataLog.Code_Article == "") dataLog.Code_Article = dataEntete.Article;


    // remplissage fichier XML
    fichierXml.open(QIODevice::ReadWrite | QIODevice::Text);

    QFile buffer(cheminBufferXml);
    buffer.open(QIODevice::WriteOnly | QIODevice::Text);

    QXmlStreamReader reader(&fichierXml);
    QXmlStreamWriter Nouveau_texte(&buffer);
    Nouveau_texte.setAutoFormatting(true);

    bool LogsElementFound = false;
    bool logAdded = false;

    while (!reader.atEnd()) {
        reader.readNext();

        if (reader.isStartElement()) {
            if (reader.name().toString() == "Logs" && !LogsElementFound) {  // éecriture debut doc et Logs
                Nouveau_texte.writeStartDocument();
                Nouveau_texte.writeStartElement("Logs");
                LogsElementFound = true;
            }
            if (reader.name().toString() == "Log") {    // Réecriture ancienne Log
                Nouveau_texte.writeStartElement("Log");

                reader.readNextStartElement();
                while (reader.name().toString() != "Log") { // Réecriture du contenu des Log
                    // Write the attributes and characters for each element within <Log>
                    Nouveau_texte.writeStartElement(reader.name().toString());
                    for (const QXmlStreamAttribute &attr : reader.attributes()) {
                        Nouveau_texte.writeAttribute(attr.name().toString(), attr.value().toString());
                    }
                    Nouveau_texte.writeCharacters(reader.readElementText());
                    Nouveau_texte.writeEndElement(); // Close the current element

                    reader.readNextStartElement();
                }
                Nouveau_texte.writeEndElement();  // End <Log>
            }
        }
        else if (reader.isEndElement() && reader.name() == "Logs") {    // Ajout  nouvelle Log et fermeture Logs
            if (!logAdded) {
                newLog(Nouveau_texte);
                logAdded = true;
            }

            Nouveau_texte.writeEndElement();
            break;  // Exit the loop after finishing the <Logs> element
        }
    }

    if (reader.hasError()) {
        throw std::runtime_error("Error reading XML: " + reader.errorString().toStdString());
    }

    Nouveau_texte.writeEndDocument();  // End the document in the temporary file
    fichierXml.close();
    buffer.close();

    // Replace the original file with the modified one
    if (!QFile::remove(cheminXml)) {
        throw std::runtime_error("Error deleting xml file for buffer at " + cheminXml.toStdString());
    }
    if (!QFile::rename(cheminBufferXml, cheminXml)) {
        throw std::runtime_error("Error renaming buffer file.xml at " + cheminBufferXml.toStdString());
    }

    // Reset variable
    dataLog.reset();
    panneText = "";
}


void Recherche_Fichier::resolve(QString aoi) {
    if ((!isTroubleshooted(aoi)) &&
        (!isUpdated(aoi)) &&
        trackingMap[aoi].length() >= 2 &&
        trackingMap[aoi][trackingMap[aoi].size()-1] == "B" &&
        trackingMap[aoi][trackingMap[aoi].size()-2] == "M") {

        QSqlQuery query(db_AS400);
        QString sql = QString(R"(
            UPDATE %2.SUIVIE_PANNE_CARTEELECTRONIQUE
            SET STATUT_FLAG = 4
            WHERE NUMERO_AOI = '%1'
        )").arg(aoi).arg(libName);

        query.prepare(sql);
        if (! query.exec()) {
            throw std::runtime_error("Erreur lors de l'exécution de la requête : " + query.lastError().text().toStdString());
        };
    }
}


bool Recherche_Fichier::isExist(QString aoi, QString of) {
    if (!isIteratif) return false;
    QSqlQuery query(db_AS400);
    QString sql = QString("SELECT count(*) FROM %3.SUIVIE_PANNE_CARTEELECTRONIQUE spc WHERE spc.NUMERO_AOI = '%1' AND spc.NUMERO_OF = '%2'")
        .arg(aoi)
        .arg(of)
        .arg(libName);
    query.prepare(sql);

    if (! query.exec()) qWarning() << "Erreur lors de l'exécution de la requête : " << query.lastError().text();
    while (query.next()) {
        int count = query.value(0).toInt();
        if (count > 0) return true;
    }
    return false;
}

bool Recherche_Fichier::isTroubleshooted(QString aoi) {
    QSqlQuery query(db_AS400);
    QString sql = QString("SELECT spc.MODIFICATION_DATE FROM %2.SUIVIE_PANNE_CARTEELECTRONIQUE spc WHERE NUMERO_AOI = '%1'")
        .arg(aoi)
        .arg(libName);
    query.prepare(sql);

    if (! query.exec()) qWarning() << "Erreur lors de l'exécution de la requête : " << query.lastError().text();
    while (query.next()) {
        QString modifDate = query.value(0).toString();
        if (!modifDate.replace(" ", "").isEmpty()) return true;
    }
    return false;
}

bool Recherche_Fichier::isUpdated(QString aoi) {
    QSqlQuery query(db_AS400);
    QString sql = QString("SELECT STATUT_FLAG  FROM %2.SUIVIE_PANNE_CARTEELECTRONIQUE WHERE NUMERO_AOI = '%1'")
        .arg(aoi)
        .arg(libName);
    query.prepare(sql);

    if (! query.exec()) qWarning() << "Erreur lors de l'exécution de la requête : " << query.lastError().text();
    while (query.next()) {
        QString statut = query.value(0).toString();
        if (statut == "4") return true;
    }
    return false;
}

bool Recherche_Fichier::isSimilar(const QString &str1, const QString &str2) {
    int minLength = qMin(str1.length(), str2.length());
    // qDebug() << "AOI    :" << dataLog.Code_AOI;
    // qDebug() << "Entête :" << str1;
    // qDebug() << "Article:" << str2;

    for (int i = 0; i < minLength; ++i) {
        if ((str2[i].isLetter() || str1[i].isLetter()) && i>2) break;
        if (str1[i] != str2[i]) {
            // qDebug() << "Différence trouvée à l'index" << i << ":" << str1[i] << "vs" << str2[i];
            return false;
        }
    }

    // Si toutes les lettres comparées sont identiques, vérifier la longueur des chaînes
    if (str1.length() != str2.length()) {
        // qDebug() << "Les chaînes diffèrent en longueur :" << str1.length() << "vs" << str2.length();
        if (str2.length() == 0) return false;
    }
    // qDebug() << "Les chaînes sont similaire.";
    return true;
}


QString Recherche_Fichier::Recuperation_Code_Article_Recursive(QString Code_Unique, float year) {
    if (year < 2023) return "";
    if (Code_Unique.length() < 5) return dataEntete.Article;

    QString baseName = QString("AOI_DATA_%1").arg(year);
    // qDebug() << baseName;
    baseName.replace(".5", "_2");


    QSqlQuery query(db_liste);
    QString sql = QString(R"(
        SELECT Run.Run_Name
        FROM %1.dbo.Panel Panel
        JOIN %1.dbo.Run Run ON Panel.Assembly_ID = Run.Assembly_ID
        WHERE Panel.Barcode LIKE :code
    )").arg(baseName);

    query.prepare(sql);
    query.bindValue(":code", "%" + Code_Unique + "%");

    if (! query.exec()) qWarning() << "Erreur lors de l'exécution de la requête : " << query.lastError().text();

    while (query.next()) {
        QString runName = query.value(0).toString();
        runName.replace("D:\\QX600/AssemblyInfo/ENERDIS\\", "");
        runName.replace("D:\\QX600/AssemblyInfo/CHAUVIN-ARNOUX\\", "");
        runName.replace("D:\\QX600/AssemblyInfo/METRIX\\", "");
        runName.replace(".csv", "");
        runName = runName.left(runName.indexOf("_"));
        if (isSimilar(dataEntete.Article, runName)) return runName;
    }

    // Appel récursif sur l’année précédente
    return Recuperation_Code_Article_Recursive(Code_Unique, year - 0.5);
}


void Recherche_Fichier::newLog(QXmlStreamWriter &Nouveau_texte) {
    Nouveau_texte.writeStartElement("Log");
    Nouveau_texte.writeStartElement("dateHeure");
    Nouveau_texte.writeCharacters(dataLog.Date_Heure.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("AOI");
    Nouveau_texte.writeCharacters(dataLog.Code_AOI.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("Article");
    Nouveau_texte.writeCharacters(dataLog.Code_Article.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("OF");
    Nouveau_texte.writeCharacters(dataLog.OF.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("FIC");
    Nouveau_texte.writeCharacters(dataEntete.FIC.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("iFIC");
    Nouveau_texte.writeCharacters(dataEntete.ind_FIC.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("panne");
    Nouveau_texte.writeCharacters(dataLog.Code_Panne.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("designationPanne");
    Nouveau_texte.writeCharacters(dataLog.Definition_panne.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("mesure");
    Nouveau_texte.writeCharacters(QString::number(dataLog.mesure).toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("limiteMin");
    Nouveau_texte.writeCharacters(QString::number(dataLog.limite_mini).toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("limiteMax");
    Nouveau_texte.writeCharacters(QString::number(dataLog.limite_max).toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("uniteMesure");
    Nouveau_texte.writeCharacters(dataLog.uniteMesure.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("uniteLimite");
    Nouveau_texte.writeCharacters(dataLog.uniteLimite.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("duree");
    Nouveau_texte.writeCharacters(QString::number(dataLog.duree).toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("poste");
    Nouveau_texte.writeCharacters(dataLog.Poste.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("site");
    Nouveau_texte.writeCharacters(dataLog.Site.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("commentairePanne");
    Nouveau_texte.writeCharacters(dataLog.Commentaire_panne.toUtf8());
    Nouveau_texte.writeEndElement();

    Nouveau_texte.writeStartElement("stateFlag");
    Nouveau_texte.writeCharacters(dataLog.stateFlag.toUtf8());
    Nouveau_texte.writeEndElement();
    Nouveau_texte.writeEndElement();
}


QDateTime Recherche_Fichier::getLastLog() {
    return lastLog;
}


Recherche_Fichier::~Recherche_Fichier() {
    db_AS400.close();
    db_liste.close();
}
