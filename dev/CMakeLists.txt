cmake_minimum_required(VERSION 3.16)

project(script_logifier LANGUAGES CXX)

set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(QT NAMES Qt6 Qt5 REQUIRED COMPONENTS Core)
find_package(Qt${QT_VERSION_MAJOR} REQUIRED COMPONENTS Core)
find_package(Qt${QT_VERSION_MAJOR} REQUIRED COMPONENTS Sql)
find_package(CURL REQUIRED)

add_executable(script_logifier
  main.cpp
  recherche_fichier.cpp recherche_fichier.h
  client_sftp.cpp client_sftp.h
  vcpkg.json
  .env

  envfile.h envfile.cpp
  config.h
  config.cpp

)
target_link_libraries(script_logifier PRIVATE Qt${QT_VERSION_MAJOR}::Core)
target_link_libraries(script_logifier PRIVATE Qt${QT_VERSION_MAJOR}::Sql)
target_link_libraries(script_logifier PRIVATE CURL::libcurl)

include(GNUInstallDirs)
install(TARGETS script_logifier
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
