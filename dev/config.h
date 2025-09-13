#ifndef CONFIG_H
#define CONFIG_H

#include <QString>
#include <QCoreApplication>
#include <QDir>
#include <QSettings>
#include <QStringList>
#include <QMap>

#define ENV_PATH                QDir(QCoreApplication::applicationDirPath()).filePath(".env").toStdString()
#define ENV_VAR1                "SFTP_ID"
#define ENV_VAR1_2              "SFTP_PASS"
#define ENV_VAR2                "DB_USERNAME1"
#define ENV_VAR3                "DB_PASSWORD1"
#define ENV_VAR4                "DB_NAME1"
#define ENV_VAR5                "DB_USERNAME2"
#define ENV_VAR6                "DB_PASSWORD2"
#define ENV_VAR7                "DB_NAME2"
#define ENV_VAR8 				"LIB_NAME"

void getSettings(const QString &filePath, QSettings::Format format);

extern QStringList log_poste;
extern QString
    file_name,
    file_path,
    file_format,
    log_path,
    log_format,
    log_nomenclature,
    qdate_format,
    qdatetime_format,
    qdatetime_format_old,
    sftp_url;

QMap<QString, QString> parseNomenclature(const QString &nomenclature);
extern QMap<QString, QString> mapNomenclature;
#endif // CONFIG_H
