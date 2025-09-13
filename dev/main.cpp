#include <QCoreApplication>
#include <QFile>
#include <QDate>
#include <QFileInfo>
#include <QCommandLineOption>
#include <QCommandLineParser>
#include "Recherche_Fichier.h"
#include "client_sftp.h"
#include "config.h"
using std::string;
QFile logFile;

void rechercheFichier_iteratif(const QString &poste, const QDate &dateRec, int rec);
void myMessageHandler(QtMsgType type, const QMessageLogContext &context, const QString &msg);

int fileNumber;

int main(int argc, char *argv[])
{
    QCoreApplication a(argc, argv);
    a.setApplicationName("SuiviPanne");
    a.setOrganizationName("Chauvin Arnoux");

    getSettings(a.applicationDirPath() + "/config.ini", QSettings::IniFormat);
    QString filePath = a.applicationDirPath() + "/log.txt";
    logFile.setFileName(filePath);
    QFile logFile(filePath);
    if (!logFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
        qWarning() << "Impossible d'ouvrir le fichier:" << filePath;
    }
    QTextStream logStream(&logFile);
    QString firstLine = logStream.readLine();
    logFile.close();

    QRegularExpression reDate(R"(\[([^\]]+)\.)");
    QRegularExpressionMatch match = reDate.match(firstLine);
    QDateTime currentDateTime = QDateTime::currentDateTime();
    QDateTime expirationDate;
    if (match.hasMatch()) {
        expirationDate = QDateTime::fromString(match.captured(1).trimmed(), qdatetime_format).addMonths(1);
    }

    // Comparaison : si la date d'expiration est antérieure à la date actuelle, le fichier est "vieux"
    // qDebug() << "Date actuel :" << currentDateTime.toString();
    // qDebug() << "Date d'expiration :" << expirationDate.toString();
    if (expirationDate <= currentDateTime) {
        if (logFile.remove()) {
            qInfo() << "Fichier log supprimé avec succès:" << filePath;
        } else {
            qDebug() << "Échec de la suppression du fichier log:" << filePath;
            qDebug() << "Erreur:" << logFile.errorString();
        }
    }
    qInstallMessageHandler(myMessageHandler);

    QDate
        currentDate = QDate::currentDate();
    QString
        currentDateString = currentDate.toString(qdate_format);
    int rec = 0;


    // Gestion des arguments
    QCommandLineParser parser;
    parser.setApplicationDescription("Le programme recupere les releves de pannes quotidien d'une liste de dossier de poste pour le transferer vers un serveur SFTP.");
    parser.addHelpOption(); // Ajoute automatiquement -h/--help

    QCommandLineOption recursiveOption(
        QStringList() << "r" << "recursive",
        "Nombre de jours en arriere pour la recherche.",
        "jours"
        );
    parser.addOption(recursiveOption);
    parser.process(a);

    if (parser.isSet(recursiveOption)) {
        rec = parser.value(recursiveOption).toInt();
        qInfo() << "Recursion setup pour" << rec << "jours en arriere";
    }


    try {
        for(int i=0;i < log_poste.size();i++){
            // au jour pour le jour
            rechercheFichier_iteratif(log_poste.at(i), currentDate, rec);
        }
        qInfo() << fileNumber << "logfile was found and transferred to " << file_path << "_" << currentDateString << file_format << "! " ;


        // Transfer SFTP
        string
            filePathString =  file_path.toStdString() + "_" + currentDateString.toStdString() + file_format.toStdString();
        const char
            *filePath = filePathString.c_str();

        loadEnvFile(string(ENV_PATH));
        const char* secretKeyId = std::getenv(ENV_VAR1);
        const char* secretKey = std::getenv(ENV_VAR1_2);
        if (!secretKeyId) throw std::runtime_error(ENV_VAR1 " not defined !");
        if (!secretKey) throw std::runtime_error(ENV_VAR1_2 " not defined !");

        QUrl url(QString("sftp://") + QUrl::toPercentEncoding(QString(secretKeyId)) + QString(":") + QUrl::toPercentEncoding(QString(secretKey)) + sftp_url + QString("_") + currentDateString + file_format);
        //qDebug() << strUrl.data();
        Client_SFTP as400(url);
        //qDebug() << filePath2;
        as400.uploadFile(filePath);


        // supprimer le fichier
        if (remove(filePath) != 0) {
            throw std::runtime_error("Erreur lors de la suppression du fichier: \"" + file_path.toStdString() + "_" + currentDateString.toStdString() + file_format.toStdString() + "\"");
        } else {
            qInfo() << "File '" + file_path + "_" + currentDateString + file_format + "' deleted succesfully !";
        }
    }
    catch (const std::exception &e) {
        qCritical() << e.what();
    }
    return 0;
}


void rechercheFichier_iteratif(const QString &poste, const QDate &dateRec, int rec) {
    bool isIteratif = false;
    if (rec>0) isIteratif = true;

    for (int i = 0; i <= rec; ++i) {
        QDate date = QDate::currentDate().addDays(-i);
        QString filePath = QString("%1%2\\%3%4")
                               .arg(log_path)
                               .arg(poste)
                               .arg(date.toString(qdate_format))
                               .arg(log_format);
        if (QFile::exists(filePath)) {
            qInfo() << "Fichier existe, poste:" << poste << "date:" << date.toString(qdate_format);
            fileNumber++;
            Recherche_Fichier fichier(filePath, poste, date, isIteratif);
            fichier.rf_start();
        }
    }
}


void myMessageHandler(QtMsgType type, const QMessageLogContext &context, const QString &msg)
{
    if (!logFile.isOpen()) {
        if (!logFile.open(QIODevice::Append | QIODevice::Text)) {
            throw std::runtime_error("Cannot open log file for writing.\n");
            return;
        }
    }

    // Formatage du message avec la date/heure, le type de message et le contexte
    QString txt;
    switch (type) {
    case QtDebugMsg:
        txt = QString("DEBUG: %1").arg(msg);
        break;
    case QtInfoMsg:
        txt = QString("INFO : %1").arg(msg);
        break;
    case QtWarningMsg:
        txt = QString("WARN : %1").arg(msg);
        break;
    case QtCriticalMsg:
        txt = QString("CRITICAL : %1").arg(msg);
        break;
    case QtFatalMsg:
        txt = QString("FATAL : %1").arg(msg);
        break;
    }

    QString contextInfo = QString(" (%1:%2, %3)")
                              .arg(context.file ? context.file : "")
                              .arg(context.line)
                              .arg(context.function ? context.function : "");

    QString finalMessage = QString("[%1] %2 %3\n")
                               .arg(QDateTime::currentDateTime().toString("yyyy-MM-dd hh:mm:ss.zzz"))
                               .arg(txt)
                               .arg(contextInfo);

    // Écriture dans le fichier
    QTextStream out(&logFile);
    out << finalMessage;
    out.flush();  // Pour être certain que la sortie est écrite

    // En option, afficher également sur la console standard sauf Warning
    if (type != QtWarningMsg) {
        fprintf(stderr, "%s", finalMessage.toLocal8Bit().constData());
    }

    if (type == QtFatalMsg) {
        abort();  // Pour QtFatalMsg, on arrête l'application
    }
}
