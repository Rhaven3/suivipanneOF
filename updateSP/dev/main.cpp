#include <QCoreApplication>
#include <QDir>
#include <QFile>
#include <QXmlStreamReader>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QDebug>
#include <QStringList>
#include <QDateTime>
#include <iostream>
#include <string>

void parseXMLAndInsertIntoDB(const QString &filePath, QSqlDatabase &db, QString &dbName) {
    QFile file(filePath);
    if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
        qWarning() << "Cannot open file" << filePath;
        return;
    }

    QXmlStreamReader xmlReader(&file);
    QSqlQuery query(db);

    while (!xmlReader.atEnd()) {
        QXmlStreamReader::TokenType token = xmlReader.readNext();

        if (token == QXmlStreamReader::StartElement) {
            if (xmlReader.name() == "Log") {
                // Initialize variables for each field
                 QString dateHeure = "", AOI = "", Article = "", OF = "", FIC = "", iFIC = "", panne = "", designationPanne = "",
                    mesure = "", limiteMin = "", limiteMax = "", uniteMesure = "", uniteLimite = "", duree = "", poste = "", site = "", commentairePanne = "", stateFlag = "";

                while (!(xmlReader.tokenType() == QXmlStreamReader::EndElement && xmlReader.name() == "Log")) {
                    token = xmlReader.readNext();
                    if (token == QXmlStreamReader::StartElement) {
                        QString elementName = xmlReader.name().toString();
                        QString elementText = xmlReader.readElementText();

                        if (!elementText.isEmpty()) {
                            if (elementName == "dateHeure") {
                                dateHeure = elementText;
                            } else if (elementName == "AOI") {
                                AOI = elementText;
                            } else if (elementName == "Article") {
                                Article = elementText;
                            } else if (elementName == "OF") {
                                OF = elementText;
                            } else if (elementName == "FIC") {
                                FIC = elementText;
                            } else if (elementName == "iFIC") {
                                iFIC = elementText;
                            } else if (elementName == "panne") {
                                panne = elementText;
                            } else if (elementName == "designationPanne") {
                                designationPanne = elementText;
                            } else if (elementName == "mesure") {
                                mesure = elementText;
                            } else if (elementName == "limiteMin") {
                                limiteMin = elementText;
                            } else if (elementName == "limiteMax") {
                                limiteMax = elementText;
                            } else if (elementName == "uniteMesure") {
                                uniteMesure = elementText;
                            } else if (elementName == "uniteLimite") {
                                uniteLimite = elementText;
                            } else if (elementName == "duree") {
                                duree = elementText;
                            } else if (elementName == "poste") {
                                poste = elementText;
                            } else if (elementName == "site") {
                                site = elementText;
                            } else if (elementName == "commentairePanne") {
                                commentairePanne = elementText;
                            } else if (elementName == "stateFlag") {
                                stateFlag = elementText;
                            }
                        }

                    }
                }

                // Prepare SQL statement
                query.prepare(QString("INSERT INTO ") + dbName + QString(".SUIVIE_PANNE_CARTEELECTRONIQUE (POSTE, SITE, PANNE, STATUT_FLAG, NUMERO_AOI, NUMERO_ARTICLE, NUMERO_OF, NUMERO_FIC, INDICE_FIC, MESURE, LIMITE_MIN, LIMITE_MAX, UNITE_MESURE, UNITE_LIMITE, DUREE, DESIGNATION_PANNE, COMMENTAIRE_PANNE, CREATION_DATE, CREATION_HEURE) "
                              "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"));

                // Convert and bind values here
                QDateTime dateTime = QDateTime::fromString(dateHeure, "d/M/yyyy hh:mm:ss");
                query.addBindValue(poste);
                query.addBindValue(site);
                query.addBindValue(panne.toInt());
                query.addBindValue(stateFlag.toInt());
                query.addBindValue(AOI);
                query.addBindValue(Article);
                query.addBindValue(OF);
                query.addBindValue(FIC);
                query.addBindValue(iFIC.toInt());
                query.addBindValue(mesure.toDouble());
                query.addBindValue(limiteMin.toDouble());
                query.addBindValue(limiteMax.toDouble());
                query.addBindValue(uniteMesure);
                query.addBindValue(uniteLimite);
                query.addBindValue(duree.toInt());
                query.addBindValue(designationPanne);
                query.addBindValue(commentairePanne);
                query.addBindValue(dateTime.date().toString("yyyy-MM-dd")); // Format for DB
                query.addBindValue(dateTime.time().toString("hh:mm:ss"));   // Format for DB

                qDebug() << "=================================================";
                // Debugging output: Display bound values
                QList<QVariant> boundValues = query.boundValues();
                qDebug() << "Bound Values:";
                for (int i = 0; i < boundValues.size(); ++i) {
                    qDebug() << "Value" << i << ":" << boundValues.at(i).toString();
                }

                // Execute query
                if (!query.exec()) {
                    qWarning() << "Error inserting into database:" << query.lastError();
                } else {
                    qDebug() << "Insertion successful!";
                }
            }
        }
    }

    if (xmlReader.hasError()) {
        qWarning() << "XML error:" << xmlReader.errorString();
    }

    file.close();
}

int main(int argc, char *argv[]) {
    QCoreApplication a(argc, argv);

    // Get database name from arguments
    QStringList args = a.arguments();
    if (args.size() < 2) {
        qWarning() << "Usage: program_name <filesPath> <database_name>";
        return -1;
    }
    QString filesPath = args.at(1);
    QString dbName = args.at(2);

    // Prompt for username and password
    std::string username, password;
    std::cout << "Enter database username: ";
    std::getline(std::cin, username);
    std::cout << "Enter database password: ";
    std::getline(std::cin, password);

    // Setup database connection
    QSqlDatabase db = QSqlDatabase::addDatabase("QODBC");
    db.setDatabaseName(dbName);
    db.setUserName(QString::fromStdString(username));
    db.setPassword(QString::fromStdString(password));
    if (!db.open()) {
        qWarning() << "Error opening database:" << db.lastError();
        return -1;
    }

    // Directory path to read XML files from (change this to the desired directory path)
    QDir directory(filesPath);
    QStringList filters;
    filters << "SuiviPanne_*.xml";
    directory.setNameFilters(filters);

    // Iterate over XML files
    QStringList xmlFiles = directory.entryList();
    foreach (QString fileName, xmlFiles) {
        QString filePath = directory.absoluteFilePath(fileName);
        parseXMLAndInsertIntoDB(filePath, db, dbName);
    }

    db.close();
    return 0;
}
