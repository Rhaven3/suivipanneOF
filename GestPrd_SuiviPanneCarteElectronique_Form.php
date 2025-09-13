<?php
include_once '../Outils/Apps.php';
$V_response = $V_recup = array();
$V_response['data'] = array();
$V_connector = null;
$V_sqlNbr = $V_sql = $V_sortGet = $V_orWhereOrAnd = '';
$V_isPrepared = false;

include_once '../Outils/Config.php';
include_once '../Outils/Connexion_BDD.php';

try
{
	if ($V_connector)
	{
		switch($_GET['Type'])
		{
			case 'view':
				$V_response['start'] = 0;
				if (isset($_GET['start']))
				{
					$V_response['start'] = $_GET['start'];
				}

				$V_response['fetch'] = 90;
				if (isset($_GET['count']))
				{
					$V_response['fetch'] = $_GET['count'];
				}
				// Requêtes pour remplir la Datatable
				$V_sql = "SELECT ID, NUMERO_AOI, NUMERO_ARTICLE, NUMERO_OF , PANNE, 
					CREATION_DATE || '\t' || CREATION_HEURE AS date_heure, MODIFICATION_DATE  || '\t' || MODIFICATION_HEURE  AS mod_date_heure , CREATION_DATE AS date,
					SITE || ' : ' || POSTE AS POSTE, INDICE_FIC || ' : ' || NUMERO_FIC AS FIC, 
					CAST(FLOOR(duree / 60) AS VARCHAR(10)) || ' min ' || CAST(MOD(duree, 60) AS VARCHAR(10)) || ' sec' AS DUREE, 
					MESURE || UNITE_MESURE AS MESURE, ROUND(LIMITE_MIN, 0) || '\t/\t' || ROUND(LIMITE_MAX, 0) || '\t' || UNITE_LIMITE AS limite, 
					DESIGNATION_PANNE, STATUT_FLAG, COMPOSANT, TYPE_PANNE, COMMENTAIRE_PANNE, MODIFICATION_UTILISATEUR
					FROM SUIVIE_PANNE_CARTEELECTRONIQUE";
				$V_orWhereOrAnd = ' where ';


				// Gestion des filtres
				$V_conditions = [];
				$V_filtersConfig = [
					'NumeroAOI' => 'Numero_aoi LIKE $%%%s%%$',
					'NumeroArticle' => 'Numero_Article LIKE $%%%s%%$',
					'StatutFlag' => 'Statut_flag IN (%s)',
					'Poste' => 'Poste LIKE $%%%s%%$',
					'Site' => 'Site IN (%s)',
					'CreationDate' => 'Creation_date IN (%s)',
					'CreationHeure' => 'Creation_heure >= %s',
					'NumeroOF' => 'Numero_of IN (%s)',
					'NumeroFIC' => 'Numero_fic IN (%s)',
					'ModifUtilisateur' => 'Modification_utilisateur IN (%s)',
					'ModificationDate' => 'Modification_date >= %s',
					'ModificationHeure' => 'Modification_heure IN (%s)'
				];

				foreach ($V_filtersConfig as $V_key => $V_value) {
					if(isset($_GET[$V_key])) {
						$V_rawValue = trim($_GET[$V_key]);
						if(! empty($V_rawValue)) {
							if($V_key === 'NumeroAOI' || $V_key === 'NumeroArticle' || $V_key === 'Poste') {
								// Escape single quotes to prevent SQL errors
								$V_escapedValue = str_replace("'", '', $V_rawValue);
								$V_value = str_replace('$', "'", $V_value);
								$V_conditions[] = sprintf($V_value, $V_escapedValue);
							} else {
								$V_parsedValues = F_parsingWhenIn($V_rawValue);
								$V_conditions[] = sprintf($V_value, $V_parsedValues);
							}
						}
					}
				}
				
				

				if(! empty($V_conditions))
				{
					$V_orWhereOrAnd .= implode(' AND ', $V_conditions);
					$V_sql .= $V_orWhereOrAnd;
				}
				

				// sqlNbr
				$V_sqlNbr = 'select count(*) AS NBR from (' . $V_sql . ') a';
				$V_sortGet = '';
				if (isset($_GET['sort']))
				{
					$V_j = 0;
					foreach($_GET['sort'] as $V_keySort => $V_valueSort)
					{
						if ($V_j > 0)
						{
							$V_sortGet .= ', ';
						}

						$V_sortGet .= '[' . $V_keySort . '] ' . ' ' . $V_valueSort;
						++$V_j;
					}
				}
				

				if ($V_sortGet === '')
				{
					$V_sql .= ' order by 6 desc';
				}
				else
				{
					$V_sortGet = str_replace('[NUMERO_AOI]', '2', $V_sortGet);
					$V_sortGet = str_replace('[NUMERO_ARTICLE]', '3', $V_sortGet);
					$V_sortGet = str_replace('[NUMERO_OF]', '4', $V_sortGet);
					$V_sortGet = str_replace('[PANNE]', '5', $V_sortGet);
					$V_sortGet = str_replace('[DATE]', '6', $V_sortGet);
					$V_sql .= ' order by ' . $V_sortGet;
					// print_r($V_sortGet);
				}

				$V_sql .= ' LIMIT ' . $V_response['fetch'] . ' OFFSET ' . $V_response['start'];
				break;
			case 'update':
				// Échappement des entrées utilisateur
				$V_state = trim($_POST['state']);
    			$V_commentaire = trim($_POST['commentaire']);
    			$V_panneType = trim($_POST['panneType']);
    			$V_composant = trim($_POST['composant']);
    			$V_user = trim($_POST['user']);
    			$V_date = trim($_POST['date']);
    			$V_heure = trim($_POST['heure']);
    			$V_aoi = trim($_POST['aoi']);
    			$V_id = intval(trim($_POST['id']));
				$V_entryArray = array($V_state, $V_commentaire, $V_panneType, $V_composant, $V_user, $V_date, $V_heure);

    			// Construction de la requête SQL
    			$V_sql = 'UPDATE Suivie_panne_carteElectronique SET
    			          Statut_flag = ?,
    			          Commentaire_panne = ?,
    			          Type_panne = ?,
    			          Composant = ?,
    			          Modification_utilisateur = ?,
    			          Modification_date = ?,
    			          Modification_heure = ?';

    			// Si statut = 1 (résolu), mettre à jour tous les suivis du même article
    			if (($V_state === '1' || $V_state === '4') && ! empty($V_aoi)) {
					$V_entryArray[] = $V_aoi;
    			    $V_sql .= ' WHERE Numero_aoi = ?';
    			} else {
    			    // Sinon mettre à jour uniquement l'enregistrement sélectionné
					$V_entryArray[] = $V_id;
    			    $V_sql .= ' WHERE id = ?';
    			}
				$V_preparedConnector = odbc_prepare($V_connector, $V_sql);
				$V_isPrepared = true;

				break;
			case 'add':
				$V_entryArray = array(
					trim($_POST['aoi']),
					trim($_POST['article']),
					trim($_POST['of']),
					trim($_POST['panne']),
					trim($_POST['poste']),
					trim($_POST['fic']),
					trim($_POST['ific']),
					intval(trim($_POST['duree'])),
					floatval(str_replace(',', '.', trim($_POST['mesure']))),
					trim($_POST['unite']),
					floatval(str_replace(',', '.', trim($_POST['limitemin']))),
					floatval(str_replace(',', '.', trim($_POST['limitemax']))),
					trim($_POST['unitelimite']),
					trim($_POST['desiPanne']),
					trim($_POST['statut']),
					trim($_POST['composant']),
					trim($_POST['typePanne']),
					trim($_POST['commentaire']),
					trim($_POST['user']),
					trim($_POST['user']),
					trim($_POST['date']),
					trim($_POST['heure'])
				);
				
				$V_sql = 'INSERT INTO Suivie_panne_carteElectronique (
					Numero_aoi, 
					Numero_article, 
					Numero_of, 
					Panne, 
					Site,
					Poste, 
					Numero_fic,
					Indice_fic, 
					Duree, 
					Mesure, 
					Unite_mesure, 
					Limite_min, 
					Limite_max, 
					Unite_limite, 
					Designation_panne, 
					Statut_flag, 
					Composant, 
					Type_panne, 
					Commentaire_panne, 
					Creation_utilisateur, 
					Modification_utilisateur,
					Creation_date, 
					Creation_heure
				) VALUES (?,?,?,?,\'VP\',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

				$V_preparedConnector = odbc_prepare($V_connector, $V_sql);
				$V_isPrepared = true;
				break;
		}
		// var_dump('requete sql: ' . $V_sql . '<br>');

		if ($V_connector)
		{
			if ($V_sql !== '' && $V_isPrepared)
			{
				$V_exc = odbc_execute($V_preparedConnector, $V_entryArray);
			}
			elseif ($V_sql !== '')
			{
				$V_exc = odbc_exec($V_connector, $V_sql);
			}
			else
			{
				$V_exc = null;
			}
		}
		else
		{
			throw new Exception('Connexion BDD défaillante');
		}

		if($V_exc)
		{
			switch($_GET['Type'])
			{
				case 'view':
					if ($V_connector)
					{
						$V_excNbr = odbc_exec($V_connector, $V_sqlNbr);
						if($V_excNbr)
						{
							$V_response['total_count'] = odbc_fetch_array($V_excNbr)['NBR'];
						}
						else
						{
							throw new Exception('Erreur lors de la récupération des informations');
						}
					}
					else
					{
						throw new Exception('Erreur ! Lors de la connection a la base de donnée');
					}

					$V_nbrRow = 0;
					while($V_row = odbc_fetch_array($V_exc))
					{
						if ($V_row !== null)
						{
							$V_row = array_map('F_replaceNull', $V_row);
							$V_response['data'][$V_nbrRow] = $V_row;
							$V_nbrRow++;
						}
					}
					$V_response['status'] = 'success';
					$V_response['message'] = '';
					break;
				case 'update':
					if (trim($_POST['state']) === '1' || trim($_POST['state']) === '4')
					{
						$V_response['data'][0]['NUMERO_AOI'] = $_POST['aoi'];
					}
					$V_response['data'][0]['ID'] = $_POST['id'];
					$V_response['status'] = 'success';
					$V_response['message'] = 'L\'enregistrement des données est un succès';
					break;
				case 'add':
					$V_response['status'] = 'success';
					$V_response['message'] = 'L\'enregistrement des données est un succès';
					break;
			}
		}
		else
		{
			switch($_GET['Type'])
			{
				case 'view':
					throw new Exception('Le système a rencontré une erreur lors de l\'affichage des informations');
				case 'update':
					throw new Exception('Le sytème a rencontré une erreur lors de l\'enregistrement des informations');
				case 'add':
					throw new Exception('Le sytème a rencontré une erreur lors de l\'ajout des informations');
			}
		}
	}
}
catch (Exception $V_e)
{
	$V_response['data'] = array();
	$V_response['id'] = null;
	$V_response['message'] = $V_e->getMessage();
	$V_response['status'] = 'error';
}

include_once '../Outils/Deconnexion_BDD.php';

switch($_GET['Type'])
{
	case 'view':
		echo json_encode(array('data' => $V_response['data'], 'pos' => $V_response['start'], 'total_count' => $V_response['total_count'], 'status' => $V_response['status'], 'message' => $V_response['message']), JSON_UNESCAPED_UNICODE);
		break;
	case 'add':
		echo json_encode(array('status' => $V_response['status'], 'message' => $V_response['message']), JSON_UNESCAPED_UNICODE);
		break;
	case 'update':
		echo json_encode(array('id' => $V_response['data'][0]['ID'], 'status' => $V_response['status'], 'message' => $V_response['message']), JSON_UNESCAPED_UNICODE);
	//case 'delete':
	//	echo json_encode(array('id' => $V_response['id'], 'status' => $V_response['status'], 'message' => $V_response['message']), JSON_UNESCAPED_UNICODE);
	//	break;
}

function F_parsingWhenIn($V_string)
{
	$V_parsed = explode(',', $V_string);
	$V_string2 = '';

	foreach ($V_parsed as $V_key => $V_value)
	{
		$V_string2 .= "'" . $V_value . "'";
		if ($V_key + 1 < count($V_parsed))
		{
			$V_string2 .= ',';
		}
	}
	return $V_string2;
}
