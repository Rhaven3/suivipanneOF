#ifndef ENVFILE_H
#define ENVFILE_H

#ifdef _WIN32
#define setenv(name, value, overwrite) _putenv_s(name, value)
#endif

#include <fstream>
#include <cstdlib>
#include "config.h"

using std::string;


void loadEnvFile(const string& filename);

#endif // ENVFILE_H
