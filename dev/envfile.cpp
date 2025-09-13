#include "envfile.h"

void loadEnvFile(const string& filename) {
    std::ifstream file(filename);
    if (!file.is_open()) {
        throw std::runtime_error("Erreur : Impossible d'ouvrir le fichier " + filename);
        return;
    }

    string line;
    while (std::getline(file, line)) {
        size_t delimiterPos = line.find('=');
        if (delimiterPos != string::npos) {
            string key = line.substr(0, delimiterPos);
            string value = line.substr(delimiterPos + 1);

            // Définir la variable d'environnement
            setenv(key.c_str(), value.c_str(), 1);
        }
    }

    file.close();
}
