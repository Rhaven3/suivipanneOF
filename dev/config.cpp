#include "config.h"


// setup des variables du fichier config.ini
QString file_name;
QString file_path;
QString file_format;
QString log_path;
QString log_format;
QStringList log_poste;
QString log_nomenclature;
QString qdate_format;
QString qdatetime_format;
QString qdatetime_format_old;
QString sftp_url;
QMap<QString, QString> mapNomenclature;


void getSettings(const QString &filePath, QSettings::Format format) {
    QSettings settings(filePath, format);

    file_name = settings.value("File/name").toString();
    file_path = settings.value("File/path").toString() + file_name;
    file_format = settings.value("File/format").toString();
    log_path = settings.value("Log/path").toString();
    log_format = settings.value("Log/format").toString();
    log_poste = settings.value("Log/poste").toString().split(",");
    log_nomenclature = settings.value("Log/nomenclature").toString();
    qdate_format = settings.value("DateTime/qdate_format").toString();
    qdatetime_format = settings.value("DateTime/qdatetime_format").toString();
    qdatetime_format_old = settings.value("DateTime/qdatetime_format_old").toString();
    sftp_url = settings.value("SFTP/url").toString() + file_name;

    mapNomenclature = parseNomenclature(log_nomenclature);
}


QMap<QString, QString> parseNomenclature(const QString &nomenclature) {
    QMap<QString, QString> mapping;

    // Découper par virgules
    QStringList pairs = nomenclature.split(',');

    for (const QString &pair : pairs) {
        // Découper chaque paire par "/"
        QStringList keyValue = pair.split('/');
        if (keyValue.size() == 2) {
            QString key = keyValue[0].trimmed();
            QString value = keyValue[1].trimmed();
            mapping.insert(key, value);
        }
    }

    return mapping;
}
