#ifndef RECHERCHE_FICHIER_H
#define RECHERCHE_FICHIER_H
#include <QFile>
#include <QFileInfo>
#include <QDate>
#include <QDateTime>
#include <QXmlStreamWriter>
#include <QtXml/QtXml>
#include <QtXml/QDomDocument>
#include <QTextStream>
#include <QtSql/QSqlDatabase>
#include <Qtsql/QSqlQuery>
#include <QtDebug>
#include <QRegularExpression>
#include <QRegularExpressionMatch>
#include <QRegularExpressionMatchIterator>
#include <QSqlError>
#include <QMap>
#include "config.h"
#include "envfile.h"

struct DataEntete{
    QString
        Article             = "",
        FIC                 = "",
        ind_FIC             = "";
};

struct DataLog{
    QString
        Statut              = "",
        stateFlag           = "",
        OF                  = "",
        Code_AOI            = "",
        Code_Article        = "",
        Code_Panne          = "",
        Date_Heure          = "",
        Site                = "",
        Poste               = "",
        Definition_panne    = "",
        Commentaire_panne   = "",
        uniteMesure         = "",
        uniteLimite         = "";
    double
        mesure              = 0,
        limite_mini         = 0,
        limite_max          = 0;
    unsigned int
        duree               = 0;

    void reset() {
        Statut             = "";
        stateFlag          = "";
        OF                 = "";
        Code_AOI           = "";
        Code_Article       = "";
        Code_Panne         = "";
        Date_Heure         = "";
        Site               = "";
        Poste              = "";
        Definition_panne   = "";
        Commentaire_panne  = "";
        uniteMesure        = "";
        uniteLimite        = "";
        mesure             = 0;
        limite_mini        = 0;
        limite_max         = 0;
        duree              = 0;
    }
};


class Recherche_Fichier
{
private:
    bool
        isIteratif = false;
    QDate
        currentdate         = QDate::currentDate();
    QDateTime
        lastLog;
    QString
        Chemin,
        cheminXml,
        cheminBufferXml,
        dbName1,
        dbName2,
        libName;
    QFile
        fichier,
        fichierXml;
    QFileInfo
        fichierInfo;
    QSqlDatabase
        db_liste            = QSqlDatabase::addDatabase("QODBC"),
        db_AS400            = QSqlDatabase::addDatabase("QODBC", "odbc");
    // données logs
    DataEntete dataEntete;
    DataLog dataLog;
    QStringList
        Text;
    short
        indexText           = 0;
    QString
        panneText;
    QRegularExpression
        reSeparateur        = QRegularExpression(R"([-–—\x97]{99})"),
        reEntete            = QRegularExpression(R"(^(\S+).+, (FIC\S+)\D+(\d+))"),
        reDateTime          = QRegularExpression(R"(L'article a été testé le\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+à\s+(\d{2}:\d{2}:\d{2}))"),
        reResultatTest      = QRegularExpression{R"(\s+[-–—\x97]\s+(\d+)\D+(\d+))"},
        reLigneResult       = QRegularExpression(R"(\$(\S+)\s+(\S+)\s+(\S+)[^\[]+\[([^\]]+))"),
        // La panne et les valeurs ou commentaire
        rePanne             = QRegularExpression(R"(^([^-]+)\s+-\s+(.+)|\s*[Mm]esure[^\d-]+(\S+) *(\S*)\s*[Ll]imite mi[^\d-]+(\S+) *(\S*)\s*[Ll]imite ma[^\d-]+(\S+)|^[Aa]t+endu[^\d-]+(\S+)\s+^[Rr]e[çc]u[^\d-]+(\S+)|^\s*[Vv]aleur r[^\d-]+(\S+)\s*[Vv]aleur a[^\d-]+(\S+)|^(.+))", QRegularExpression::MultilineOption),
        reSite              = QRegularExpression(R"(^([^\d]*))");
    QMap<QString, QStringList>
        trackingMap;

    QString Recuperation_Code_Article_Recursive(QString Code_Unique, float year);
    bool 	isExist(QString aoi, QString of);
    bool 	isTroubleshooted(QString aoi);
    bool 	isUpdated(QString aoi);
    bool    isSimilar(const QString &str1, const QString &str2);
    void    recup_infoCarte();
    void	resolve(QString aoi);
    void    newLog(QXmlStreamWriter &Nouveau_texte);
public:
    Recherche_Fichier(QString, QString, QDate, bool);
    void rf_start();

    QDateTime getLastLog();
    ~Recherche_Fichier();
};




#endif // RECHERCHE_FICHIER_H
