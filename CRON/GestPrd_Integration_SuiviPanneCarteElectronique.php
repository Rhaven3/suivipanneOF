<?php
$V_connector = $V_connectorEtemptation = $V_cheminFichier = $V_sqlInsert = $V_i = null;
$V_arrayContent = array();
$V_arrayContent['status'] = '';
$V_arrayContent['message'] = '';
$V_arrayContent['num_error'] = 0;

if (isset($argv[2]))
{
	$_POST['Type'] = explode('=', $argv[2])[1];
}

if (isset($_POST['Type']))
{
	if ($_POST['Type'] === 'PROD' || $_GET['Type'] === 'PROD')
	{
		$V_cheminFichier = '/www/phpserver/htdocs';
	}
	else
	{
		$V_cheminFichier = '/www/phpservdev/htdocs/Webix/BNEIL';
	}
}

if (isset($_GET['Type']))
{
	if ($_GET['Type'] === 'PROD')
	{
		$V_cheminFichier = '/www/phpserver/htdocs';
	}
	else
	{
		$V_cheminFichier = '/www/phpservdev/htdocs/Webix/BNEIL';
	}
}

if ($V_cheminFichier !== '')
{
	if (isset($argv[1]))
	{
		include_once $V_cheminFichier . '/Webix/Outils/Apps.php';
		include_once $V_cheminFichier . '/Webix/Outils/Config.php';
		include_once $V_cheminFichier . '/Webix/Outils/Connexion_BDD.php';
		$V_arrayContent['status'] = 'loading';
		$V_arrayContent['message'] = '';
		$V_arrayContent['connector'] = $V_connector;
		$V_arrayContent['id'] = $argv[1];
		F_updateStatusCron($V_arrayContent);
		$V_arrayContent['status'] = 'success';
		$V_arrayContent['message'] = '';
	}
	else
	{
		include_once '../../Outils/Apps.php';
		include_once '../../Outils/Config.php';
		include_once '../../Outils/Connexion_BDD.php';
	}

	try
	{;
		$V_xmlFilePath = $V_cheminFichier . '/Webix/Tmp/SuiviPanne_' . date('Y-m-d') . '.xml';
		// Transfert BDD
		$V_params = [];
		$V_tableSuiviPanne = 'Suivie_panne_carteElectronique';
		$V_requeteSql = 'INSERT INTO ' . $V_tableSuiviPanne . ' (
		SVP_POST, SVP_SITE, SVP_PANN, SVP_STAT,
		NUM_AOI, NUM_ART, NUM_OF, NUM_FIC, IND_FIC,
		DUREE_PANN, MESR_PANN, MESR_LIMIN, MESR_LIMAX, UNIT_MESR, UNIT_LIM,
		DESI_PANN, COMM_PANN,
		CRT_DATE, CRT_HEUR
		) VALUES ';
		$V_sqlValueClause = [];
		
		// Charger le fichier XML
		$V_xmlSuiviPanne = simplexml_load_file($V_xmlFilePath);

		if (! file_exists($V_xmlFilePath) || ! $V_xmlSuiviPanne)
		{
			$V_arrayContent['status'] = 'success';
			$V_arrayContent['message'] = 'Le fichier xml n\'existe pas';
		}
		elseif (! property_exists($V_xmlSuiviPanne, 'Log'))
		{
			$V_arrayContent['message'] = 'fichier xml vide';
		}
		else
		{
			$V_nbrPanne = 0;

			// Validation helper function
			function F_validateField($V_value, $V_type, $V_length, $V_fieldName, $V_nullable = false)
			{
				if ($V_nullable && ($V_value === null || $V_value === '')) {
					return;
				}
				switch ($V_type) {
					case 'char':
						if (mb_strlen($V_value) > $V_length) {
							throw new Exception('Le champ ' . $V_fieldName . ' dépasse la longueur maximale de $V_length caractères. val:' . $V_value);
						}
						break;
					case 'int':
						if (! is_numeric($V_value) || intval($V_value) !== $V_value) {
							throw new Exception('Le champ ' . $V_fieldName . ' doit être un entier. val:' . $V_value);
						}
						break;
					case 'smallint':
						if (! is_numeric($V_value) || intval($V_value) !== $V_value || $V_value < -32768 || $V_value > 32767) {
							throw new Exception('Le champ ' . $V_fieldName . ' doit être un SMALLINT valide. val:' . $V_value);
						}
						break;
					case 'decimal':
						if (! is_numeric($V_value))
						{
							throw new Exception('Le champ ' . $V_fieldName . ' doit être un nombre décimal. val:' . $V_value);
						}
						$V_parts = explode('.', $V_value);
						if (strlen($V_parts[0]) > $V_length - 7)
						{
							throw new Exception('Le champ ' . $V_fieldName . ' dépasse la longueur maximale de $V_length chiffres. val:' . $V_value);
						}
						break;
				}
			}

			foreach ($V_xmlSuiviPanne->Log as $V_xmlLog) // phpcs:ignore
			{
				$V_dateHeure = explode(' ', $V_xmlLog->dateHeure);
				$V_date = addslashes(trim(date('Y-m-d', strtotime(str_replace('/', '-', $V_dateHeure[0])))));
				$V_heure = addslashes(date('H:i:s', strtotime($V_dateHeure[1])));

				// phpcs:disable
				

				// Extraction et validation
				$V_poste = trim($V_xmlLog->poste);
				// F_validateField($V_poste, 'char', 6, 'POSTE');

				$V_site = trim($V_xmlLog->site);
				// F_validateField($V_site, 'char', 2, 'SITE');

				$V_panne = trim($V_xmlLog->panne);
				// F_validateField($V_panne, 'char', 7, 'PANNE');

				$V_statutFlag = trim($V_xmlLog->stateFlag);
				// F_validateField($V_statutFlag, 'char', 1, 'STATUT_FLAG');

				$V_numAoi = trim($V_xmlLog->AOI);
				// F_validateField($V_numAoi, 'char', 40, 'NUMERO_AOI');

				$V_numArticle = trim($V_xmlLog->Article);
				// F_validateField($V_numArticle, 'char', 15, 'NUMERO_ARTICLE');

				$V_numOf = trim($V_xmlLog->OF);
				// F_validateField($V_numOf, 'char', 25, 'NUMERO_OF');

				$V_numFic = trim($V_xmlLog->FIC);
				// F_validateField($V_numFic, 'char', 15, 'NUMERO_FIC');

				$V_indFic = trim($V_xmlLog->iFIC);
				// F_validateField($V_indFic, 'char', 2, 'INDICE_FIC');

				$V_duree = trim($V_xmlLog->duree);
				// F_validateField($V_duree, 'smallint', 0, 'DUREE');

				$V_mesure = trim($V_xmlLog->mesure);
				// F_validateField($V_mesure, 'char', 10, 'MESURE');

				$V_limiteMin = trim($V_xmlLog->limiteMin);
				// F_validateField($V_limiteMin, 'decimal', 10, 'LIMITE_MIN');

				$V_limiteMax = trim($V_xmlLog->limiteMax);
				// F_validateField($V_limiteMax, 'decimal', 10, 'LIMITE_MAX');

				$V_uniteMesure = trim($V_xmlLog->uniteMesure);
				// F_validateField($V_uniteMesure, 'char', 4, 'UNITE_MESURE');

				$V_uniteLimite = trim($V_xmlLog->uniteLimite);
				// F_validateField($V_uniteLimite, 'char', 4, 'UNITE_LIMITE');

				$V_designationPanne = trim($V_xmlLog->designationPanne);
				// F_validateField($V_designationPanne, 'char', 5000, 'DESIGNATION_PANNE');

				$V_commentairePanne = trim($V_xmlLog->commentairePanne);
				// F_validateField($V_commentairePanne, 'char', 5000, 'COMMENTAIRE_PANNE');

				// Ajout des paramètres
				$V_params[] = $V_poste;
				$V_params[] = $V_site;
				$V_params[] = $V_panne;
				$V_params[] = $V_statutFlag;
				$V_params[] = $V_numAoi;
				$V_params[] = $V_numArticle;
				$V_params[] = $V_numOf;
				$V_params[] = $V_numFic;
				$V_params[] = $V_indFic;
				$V_params[] = $V_duree;
				$V_params[] = $V_mesure;
				$V_params[] = (float)$V_limiteMin;
				$V_params[] = (float)$V_limiteMax;
				$V_params[] = $V_uniteMesure;
				$V_params[] = $V_uniteLimite;
				$V_params[] = $V_designationPanne;
				$V_params[] = $V_commentairePanne;
				$V_params[] = $V_date;   // formate la date pour l'IBM DB2
				$V_params[] = $V_heure;  // format l'heure pour l'IBM DB
				$V_sqlValueClause[] = '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
				// phpcs:enable

				$V_nbrPanne++;
			}
			//transfert bdd
			$V_requeteSql .= implode(', ', $V_sqlValueClause);
			
			$V_stmt = odbc_prepare($V_connector, $V_requeteSql);
			$V_executeSql = odbc_execute($V_stmt, $V_params);

			$V_arrayContent['message'] = $V_nbrPanne . ' passages de cartes on étaient récupérés';

			if (! $V_stmt)
			{
				throw new Exception('Erreur lors de la préparation de la requête SQL (l.' . __LINE__ . ')');
			}
			if(! $V_executeSql)
			{
				throw new Exception('Erreur lors de l\'execution de la requête SQL (l.' . __LINE__ . ')');
			}
		}

		// Suppresion du fichier xml
		if (file_exists($V_xmlFilePath))
		{
			unlink($V_xmlFilePath)
			or throw new Exception('Erreur lors de la suppression du fichier "' . $V_xmlFilePath . '" (l.' . __LINE__ . ')');
		}

		$V_arrayContent['status'] = 'success';
	}
	catch (Exception $V_error)
	{
		// Transmission des informations.
		$V_arrayContent['status'] = 'error';
		$V_arrayContent['message'] = 'Exception reçue : ' . $V_error->getMessage();
	}

	if (isset($argv[1]))
	{
		$V_arrayContent['message'] = $V_arrayContent['message'];
		F_updateStatusCron($V_arrayContent);
		include_once $V_cheminFichier . '/Webix/Outils/Deconnexion_BDD.php';
	}
	else
	{
		include_once '../../Outils/Deconnexion_BDD.php';
	}

	echo json_encode(array('status' => $V_arrayContent['status'], 'message' => $V_arrayContent['message']), JSON_UNESCAPED_UNICODE);
}
