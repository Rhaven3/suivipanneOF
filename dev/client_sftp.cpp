#include "client_sftp.h"

Client_SFTP::Client_SFTP( QUrl P_remote) {
    string remoteTemp = P_remote.toEncoded().toStdString();
    remote = remoteTemp.c_str();

    // start curl
    curl_global_init(CURL_GLOBAL_ALL);
}


curl_off_t Client_SFTP::sftpGetRemoteFileSize()
{
    CURLcode result = CURLE_GOT_NOTHING;
    curl_off_t remoteFileSizeByte = -1;

    CURL *curlhandletemp = curl_easy_init();

    curl_easy_setopt(curlhandletemp, CURLOPT_URL, remote);
    curl_easy_setopt(curlhandletemp, CURLOPT_VERBOSE, 1L);

    curl_easy_setopt(curlhandletemp, CURLOPT_NOPROGRESS, 1);
    curl_easy_setopt(curlhandletemp, CURLOPT_NOBODY, 1);
    curl_easy_setopt(curlhandletemp, CURLOPT_HEADER, 1);
    curl_easy_setopt(curlhandletemp, CURLOPT_FILETIME, 1);

    result = curl_easy_perform(curlhandletemp);
    if(CURLE_OK == result) {
        result = curl_easy_getinfo(curlhandletemp,
                                   CURLINFO_CONTENT_LENGTH_DOWNLOAD_T,
                                   &remoteFileSizeByte);
        if(result)
            return -1;
        qInfo() << "filesize:" << (unsigned long)remoteFileSizeByte << "B";
    }
    curl_easy_cleanup(curlhandletemp);

    return remoteFileSizeByte;
}

size_t Client_SFTP::readfunc(char *ptr, size_t size, size_t nmemb, void *stream)
{
    FILE *f = (FILE *)stream;
    size_t n;

    if(ferror(f))
        return CURL_READFUNC_ABORT;

    n = fread(ptr, size, nmemb, f) * size;

    return n;
}


void Client_SFTP::setID( char *P_id) {
    id = P_id;
}

void Client_SFTP::setPass( char *P_mdp) {
    pass = P_mdp;
}

int Client_SFTP::uploadFile(const char *localFile) {
    CURLcode result = CURLE_GOT_NOTHING;
    FILE *f = NULL;

    curlhandle = curl_easy_init();
    curl_easy_setopt(curlhandle, CURLOPT_URL, remote);
    curl_easy_setopt(curlhandle, CURLOPT_VERBOSE, 1L);

    f = fopen(localFile, "r");
    if(!f) throw std::runtime_error("Ouverture impossible du fichier local: " + string(localFile));

    curl_easy_setopt(curlhandle, CURLOPT_UPLOAD, 1L);
    curl_easy_setopt(curlhandle, CURLOPT_READFUNCTION, readfunc);
    curl_easy_setopt(curlhandle, CURLOPT_READDATA, f);


    // Check si le fichier existe sur le serv
    if (sftpGetRemoteFileSize() != -1) {                    // Append contenu
        curl_easy_setopt(curlhandle, CURLOPT_APPEND, 1L);
    } else {                                                // Sinon Créer fichier et ajouté contenu
        curl_easy_setopt(curlhandle, CURLOPT_NEW_FILE_PERMS, 0664L);
    }

    result = curl_easy_perform(curlhandle);
    curl_easy_cleanup(curlhandle);
    fclose(f);

    if(result != CURLE_OK) {
        qInfo() << remote;
        throw std::runtime_error("Erreur cURL : " + string(curl_easy_strerror(result)));
        return 0;
    }

    qInfo() << "upload of " << string(localFile) << " to sftp://" << sftp_url << " was performed !";
    return 1;
}



Client_SFTP::~Client_SFTP() {
    curl_easy_cleanup(curlhandle);
    curl_global_cleanup();
}
