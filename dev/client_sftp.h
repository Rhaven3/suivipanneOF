#ifndef CLIENT_SFTP_H
#define CLIENT_SFTP_H
#include <curl/curl.h>
#include <stdlib.h>
#include <stdio.h>
#include <QtDebug>
#include <QUrl>
#include "config.h"

using std::string;

class Client_SFTP
{
    char
        *id,
        *pass;
    const char
        *remote;
    CURL
        *curlhandle     = NULL;

    curl_off_t          sftpGetRemoteFileSize();
    static size_t       readfunc(char *ptr, size_t size, size_t nmemb, void *stream);

public:
    Client_SFTP( QUrl remote);

    void                setID( char *id);
    void                setPass( char *mdp);

    int                 uploadFile(const char *localFile);

    ~Client_SFTP();
};

#endif // CLIENT_SFTP_H
