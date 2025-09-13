# Suivi de Panne
<img width="3840" height="1068" alt="Diargamme de Flux" src="https://github.com/user-attachments/assets/942d8f4d-abfe-403c-9cbd-f3e148d7c373" />

Le projet **Suivi de Pannes** vise à optimiser l'analyse des pannes au dépannage des cartes. Grâce à une interface web intuitive et des outils d'analyse avancés, les dépanneurs peuvent mieux identifier les récurrences et améliorer le bon du premier coup.

(le projet étant basé sur l'architecture d'une entreprise il n'est pas utilisable en dehors de cette dernière)
<img width="1919" height="943" alt="app-view" src="https://github.com/user-attachments/assets/a6a9a1e2-700f-44b8-8b7c-4c019f1086c9" />

## Objectifs
- Améliorer la lecture des pannes grâce à un tableau filtrable et des graphiques interactifs.
- Réduire la récurrence des pannes en facilitant l’analyse des tendances.
- Augmenter l’efficacité des interventions avec un meilleur diagnostic.
- Étendre l'outil sur l'ensemble des sites de production

## Technologies utilisées

 - **QT Creator**  [ IDE ]
	 - C++ 
	 - XML     [ librairie interne Qt ]
		 - QTXml 
		 - QXmlStreamWriter
	- FTP      [ librairie open source ]
		- CURL
		- OpenSSl
		- libshh2
	- vcpkg    [ gestionnaire de librairie ]
- **IBM Db2**     [ BDD ]
- **Webix**       [ Dashboard 
