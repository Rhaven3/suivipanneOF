/* eslint-disable */
import * as Config 		from "../Js/Config.js"; 				
import * as Apps 		from "../Js/Apps.js"; 					
import * as Toolbar 	from "../Js/ToolbarButton.js"; 			
import * as Loader 		from "../Js/LoaderFullData.js"; 		
import * as Filter 		from "../Js/PanelFilter.js"; 			
import * as Pager 		from "../Js/Pager.js"; 					
/* eslint-enable */

export function F_Page(P_tabParms)
{
	/* eslint-disable */
	// Appel des class et constructor
	const C_filterPanel 	= new Filter.FilterPanel(P_tabParms);
	const C_toolbar 		= new Toolbar.Toolbar(P_tabParms, C_filterPanel, "Datatable_Panne_Id");
	const C_pager 			= new Pager.Pager;
	const C_loader 			= new Loader.Loader;
	/* eslint-enable */

	/* eslint-disable */
	// URL :  Default Value 
	let V_urlRequest 			= P_tabParms["Host_Adapt"] + "/Webix/Outils/Requete_SQL.php?requete=";
	let V_urlBase 				= P_tabParms["Host_Adapt"] + "/Webix/Apps/GestPrd_SuiviPanneCarteElectronique_Form.php?";
	let V_versionApplication 	= Apps.F_getVersion(P_tabParms["Application"], P_tabParms["Host_Adapt"]);
	/* eslint-enable */
	let V_table 						= "Suivie_panne_carteElectronique";
	let V_combinedQueryNumOF 			= "SELECT DISTINCT numero_of as id, numero_of AS value, 'OF' AS type FROM " + V_table;
	let V_combinedQueryNumFIC 			= "SELECT DISTINCT numero_fic as id, numero_fic AS value FROM " + V_table;
	let V_combinedQueryDepanneur 		= "SELECT DISTINCT MODIFICATION_UTILISATEUR as id, MODIFICATION_UTILISATEUR AS value FROM " + V_table;
	let V_combinedQueryArticle 			= "SELECT DISTINCT NUMERO_ARTICLE as id, NUMERO_ARTICLE AS value FROM " + V_table + " WHERE NUMERO_ARTICLE IS NOT NULL AND NUMERO_ARTICLE <> ''";

	const V_urls = {
		NumOF: V_urlRequest + V_combinedQueryNumOF,
		NumFIC: V_urlRequest + V_combinedQueryNumFIC,
		Depanneur: V_urlRequest + V_combinedQueryDepanneur, 
		Article: V_urlRequest + V_combinedQueryArticle
	};
	//V_listePoleVente = V_arrayListeReferp.filter(P_entry => P_entry.type === "OF");


	// date
	let V_date = new Date;

	// Status
	let V_statusListe = [
		{id: 1, value: "Résolu", 						colors: "C3E4C4"}, // vert
		{id: 2, value: "À dépanner", 					colors: "FBC0BC"}, // rouge
		{id: 3, value: "Dépanner, mais pas repasser", 	colors: "FFDCAA"}, // orange
		{id: 4, value: "Résolu sans dépannage", 		colors: "B5DCFB"}, // bleu
		{id: 5,	value: "Rebuter", 						colors: "CCBDE7"} // violet
	];

	// panne type
	let V_panneTypeLocalisationList = [
		{id: 1, value: "Composant"},
		{id: 2, value: "Soudure"},
		{id: 3, value: "Circuit imprimé"},
		{id: 4, value: "Autre"}
	];

	let V_panneTypeList = [
		[	{id: 1, value: "H.S"}, 					{id: 2, value: "Polarité"}, 		{id: 3, value: "Absent"}, 	{id: 4, value: "Brisé"}	],
		[	{id: 1, value: "Absente"},				{id: 2, value: "Sèche"}, 			{id: 3, value: "Manhatan"}, {id: 4, value: "Pont"}	],
		[	{id: 1, value: "Pont de serigraphie"}, 	{id: 2, value: "Coupure piste"}		],
		[	{id: 1, value: ""},						{id: 2, value: "Faux défaut"}		]
	];


	// Initialisation d'un Tableau pour les switchbuttons + ColorPicker de manière dynamique
	let V_cellsToHighlight = [
		{id: "NUMERO_AOI",		item: "Text", 			name: "AOI", 		index: 0},
		{id: "NUMERO_ARTICLE",	item: "Text", 			name: "Article", 	index: 1},
		{id: "NUMERO_OF",		item: "Multicombo", 	name: "OF", 		index: 7}
	];

	// Tableau contenant les valeurs fournit par les filtres ou les valeurs de l'URL
	let V_tabFilters = new Array(9).fill("");

	// Initialisation du tableau de valeur par defaut
	C_filterPanel.F_UrlInitValue = function ()
	{
		//Ancienne version
		let V_regex = new RegExp("/", "g");
		V_urlBase  = V_urlBase + P_tabParms["Full"].replace(V_regex, "&");
		

		const V_filterKeys = [
			"NumeroAOI", 
			"NumeroArticle", 
			"StatutFlag", 
			"Poste", 
			"Site", 
			"CreationDate",
			"CreationHeure", 
			"NumeroOF", 
			"NumeroFIC", 
			"ModifUtilisateur", 
			"ModificationDate", 
			"ModificationHeure"
		];
		
		V_filterKeys.forEach((P_key, P_index) => 
		{
			if (P_tabParms[P_key] === "" || P_tabParms[P_key] === true || P_tabParms[P_key] === undefined) 
			{
				P_tabParms[P_key] = "";
			}
			V_tabFilters[P_index] = P_tabParms[P_key];
		});

		// Valeur par défaut de status
		V_tabFilters[2] = 2;
	};

	// Méthode permettant de filtrer les données load ou retourne l'url
	C_filterPanel.F_FilterData = function (P_returnUrl = 0)
	{
		// On initialise les valeurs
		let V_url = "";
		let V_params = [
			{value: V_tabFilters[0],  param: "NumeroAOI", 		switchId: "Switch_AOI_Id"},
			{value: V_tabFilters[1],  param: "NumeroArticle", 	switchId: "Switch_Article_Id"},
			{value: V_tabFilters[7],  param: "NumeroOF", 		switchId: "Switch_OF_Id"}
		];


		try
		{
			$$("Datatable_Panne_Id").clearAll();
			$$("Datatable_Panne_Id").refreshColumns(F_MaJColumns());
			$$("Datatable_Panne_Id").adjustRowHeight();
		}
		catch (P_error) { }    // eslint-disable-line
		

		try
		{
			V_url = V_urlBase + "&Type=view";

			V_params.forEach(P_field =>
			{
				if ($$(P_field.switchId).getValue() === 0 && P_field.value !== "") 
				{
				// Ajoute le paramètre dans l'URL
					V_url += `&${P_field.param}=${encodeURIComponent(P_field.value)}`;
				}
			});
		}
		catch (P_error) {  } // eslint-disable-line


		// On ajoute les autres paramètres
		V_url +=
			"&StatutFlag=" + encodeURIComponent(V_tabFilters[2])
			+ "&Poste=" + encodeURIComponent(V_tabFilters[3])
			+ "&Site=" + encodeURIComponent(V_tabFilters[4])
			+ "&CreationDate=" + encodeURIComponent(V_tabFilters[5])
			+ "&CreationHeure=" + encodeURIComponent(V_tabFilters[6])
			+ "&NumeroFIC=" + encodeURIComponent(V_tabFilters[8])
			+ "&ModifUtilisateur=" + encodeURIComponent(V_tabFilters[9])
			+ "&ModificationDate=" + encodeURIComponent(V_tabFilters[10])
			+ "&ModificationHeure=" + encodeURIComponent(V_tabFilters[11]);
			
		// Selon le paramètre d'entre on load ou on retourne l'url 
		if (P_returnUrl === 0)
		{
			$$("Datatable_Panne_Id").load(V_url).then(function()
			{});
		}
		else
		{
			return V_url;
		}
	};

	// Appel de l'initialisation des valeurs du tableau
	C_filterPanel.F_UrlInitValue();
	
	C_filterPanel.F_SetValue("V_affichageType", [
		{ id: "NUMERO_AOI", 				value: "AOI", 						champID: "Text_AOI_Id", 					defaultValue: P_tabParms["NumeroAOI"], 			hidden: false },
		{ id: "NUMERO_ARTICLE", 			value: "Code Article",				champID: "Text_Article_Id",	 				defaultValue: P_tabParms["NumeroArticle"],	 	hidden: false },
		{ id: "STATUT_FLAG",				value: "Statut",					champID: "Combo_Status_Id",					defaultValue: P_tabParms["StatutFlag"],			hidden: false },
		{ id: "POSTE", 						value: "Poste",						champID: "Text_Poste_Id",					defaultValue: P_tabParms["Poste"],				hidden: false },
		{ id: "CREATION_DATE", 				value: "Date de Création",			champID: "Datepicker_Date_Id",				defaultValue: P_tabParms["CreationDate"],		hidden: false },
		{ id: "CREATION_HEURE", 			value: "Heure de Création",			champID: "Datepicker_Date_Id",				defaultValue: P_tabParms["CreationHeure"],		hidden: false },
		{ id: "NUMERO_OF", 					value: "OF",						champID: "Multicombo_OF_Id",				defaultValue: P_tabParms["NumeroOF"],			hidden: false },
		{ id: "FIC", 						value: "FIC",						champID: "Multicombo_FIC_Id",				defaultValue: P_tabParms["NumeroFIC"],			hidden: false },
		{ id: "MODIFICATION_UTILISATEUR",	value: "Depanneur",					champID: "Multicombo_ModifDepanneur_Id",	defaultValue: P_tabParms["ModifUtilisateur"],	hidden: false },
		{ id: "MODIFICATION_DATE", 			value: "Date de modification",		champID: "Datepicker_ModifDate_Id",			defaultValue: P_tabParms["ModificationDate"],	hidden: false },
		{ id: "MODIFICATION_HEURE",			value: "Heure de Modification",		champID: "Datepicker_ModifDate_Id",			defaultValue: P_tabParms["ModificationHeure"],	hidden: false }
	]);

	C_filterPanel.F_SetValue("V_codeString", ``);

	// Méthode permettant de changer de type de vue
	C_toolbar.F_Segmented = function ()
	{
		let V_selectedItem = $$("Datatable_Panne_Id").getSelectedItem();
		

		switch ($$("Segmented_toolbar_Id").getValue()) 
		{
			case "1":
				// On cache le panneau d'historique
				$$("Form_Add_Id").hide();
				$$("Fieldset_Historique_Id").hide();
				$$("Chart_Panne_Id").hide();
				$$("Form_Compteur_Id").hide();
				// On affiche le panneau de filtre
				$$("Button_saveRow_Id").enable();
				$$("Button_addRow_Id").enable();
				$$("Datatable_Panne_Id").show();
				$$("Panel_filtre_Id").show();
				$$("Form_Detail_Id").show();
				$$("Form_Detail_Id").resize();
				break;
			case "2":
				$$("Form_Add_Id").hide();
				$$("Form_Detail_Id").hide();
				$$("Chart_Panne_Id").hide();
				$$("Form_Compteur_Id").hide();
				// On affiche le panneau d'historique
				$$("Datatable_Panne_Id").show();
				$$("Panel_filtre_Id").show();
				$$("Button_saveRow_Id").enable();
				$$("Button_addRow_Id").enable();
				$$("Fieldset_Historique_Id").show();
				$$("Fieldset_Historique_Id").resize();
				$$("Datatable_HistoriquePanne_Id").clearAll();
				$$("Datatable_HistoriquePanne_Id").load(F_UrlHistoriquePanne(
					V_selectedItem.NUMERO_ARTICLE,
					V_selectedItem.PANNE
				));
				break;
			case "3":
				$$("Form_Add_Id").hide();
				$$("Form_Detail_Id").hide();
				$$("Fieldset_Historique_Id").hide();
				$$("Datatable_Panne_Id").hide();
				$$("Panel_filtre_Id").hide();
				$$("Button_saveRow_Id").disable();
				$$("Button_addRow_Id").disable();
				// On affiche le panneau des tableaux et des compteurs
				$$("Chart_Panne_Id").show();
				$$("Form_Compteur_Id").show();
				break;
		}
	};

	// Méthode permettant de retourner à l'écran précedent
	C_toolbar.F_BackApp = function ()
	{
	};

	// Méthode permettant d'ajouter une ligne
	C_toolbar.F_AddRow = function ()
	{
		$$("Form_Add_Id").show();
		$$("Form_Add_Id").clearValidation();
		$$("Form_Add_Id").clear();
		$$("Form_Detail_Id").hide();
		$$("Fieldset_Historique_Id").hide();
	};

	// Méthode permettant de visualiser le détail d'une ligne
	C_toolbar.F_ViewRow = function () 
	{
	};

	// Méthode permettant de sauvegarder une ligne
	C_toolbar.F_SaveRow = function () 
	{ 
		let C_date = new Date;
		let V_date = C_date.getFullYear() + "-" + (parseInt(C_date.getMonth()) + 1).toString().padStart(2, "0") + "-" + C_date.getDate().toString().padStart(2, "0");
		let V_heure = C_date.getHours().toString().padStart(2, "0") + ":" + C_date.getMinutes().toString().padStart(2, "0") + ":" + C_date.getSeconds().toString().padStart(2, "0");

		if ($$("Form_Add_Id").isVisible()) 
		{
			if (! $$("Form_Add_Id").validate()) return webix.message("Veuillez remplir tous les champs obligatoires.");

			webix.ajax().sync().post(V_urlBase + "&Type=add", {
				poste: $$("Text_Poste_Add_Id").getValue(),
				fic: $$("Text_Fic_Add_Id").getValue(),
				ific: $$("Text_iFic_Add_Id").getValue(),
				article: $$("Text_Article_Add_Id").getValue(),
				aoi: $$("Text_NumAOI_Add_Id").getValue(),
				of: $$("Text_NumOF_Add_Id").getValue(),
				duree: $$("Text_Duree_Add_Id").getValue(),
				mesure: $$("Mesure_Add_Id").getValue(),
				unite: $$("Unite_Add_Id").getValue(),
				limitemin: $$("LimitMi_Add_Id").getValue(),
				limitemax: $$("LimitMa_Add_Id").getValue(),
				unitelimite: $$("UniteLim_Add_Id").getValue(),
				statut: $$("Combo_Status_Add_Id").getValue(),
				panne: $$("Text_Panne_Add_Id").getValue(),
				desiPanne: $$("DesiPanne_Add").getValue(),
				composant: $$("Text_Composant_Add_Id").getValue(),
				typePanne: `${$$("Radio_TypePanneAdd_Id").getValue()}${$$("Combo_TypePanneAdd_Id").getValue()}`,
				commentaire: $$("Textarea_CommentPanne_Add_Id").getValue(),
				user: P_tabParms["Profil"],
				heure: V_heure,
				date: V_date
			}, function(P_response)
			{
				let V_response = JSON.parse(P_response);
				if (V_response.status !== "success") return webix.message("Le système a rencontré une erreur lors de l'enregistrement des informations"), "error";
				webix.message(V_response.message, V_response.status);
				$$("Datatable_Panne_Id").add({
					user: P_tabParms["Profil"],
					NUMERO_AOI: $$("Text_NumAOI_Add_Id").getValue(),
					NUMERO_ARTICLE: $$("Text_Article_Add_Id").getValue(),
					NUMERO_OF: $$("Text_NumOF_Add_Id").getValue(),
					PANNE: $$("Text_Panne_Add_Id").getValue(),
					DATE_HEURE: V_date + " " + V_heure,
					POSTE: `VP : ${$$("Text_Poste_Add_Id").getValue()}`,
					FIC: `${$$("Text_iFic_Add_Id").getValue()} : ${$$("Text_Fic_Add_Id").getValue()}`,
					DUREE: `${Math.floor(parseInt($$("Text_Duree_Add_Id").getValue()) / 60)} min ${parseInt($$("Text_Duree_Add_Id").getValue()) % 60} sec`,
					MESURE: `${$$("Mesure_Add_Id").getValue()}\t${$$("Unite_Add_Id").getValue()}`,
					LIMITE: `${$$("LimitMi_Add_Id").getValue()}\t/\t${$$("LimitMa_Add_Id").getValue()}\t${$$("UniteLim_Add_Id").getValue()}`,
					DESIGNATION_PANNE: $$("DesiPanne_Add").getValue(),
					STATUT_FLAG: $$("Combo_Status_Add_Id").getValue(),
					COMPOSANT: $$("Text_Composant_Add_Id").getValue(),
					TYPE_PANNE: `${$$("Radio_TypePanneAdd_Id").getValue()}${$$("Combo_TypePanneAdd_Id").getValue()}`,
					COMMENTAIRE_PANNE: $$("Textarea_CommentPanne_Add_Id").getValue(),
					CREATION_UTILISATEUR: P_tabParms["Profil"],
					MODIFICATION_UTILISATEUR: P_tabParms["Profil"]
				});
			});
			return;
		}
		let V_id = $$("Datatable_Panne_Id").getSelectedItem()["ID"];
		let V_aoi = $$("Datatable_Panne_Id").getSelectedItem()["NUMERO_AOI"];
		let V_state = $$("Combo_Status_Detail_Id").getValue();
		let V_commentaire = $$("Textarea_CommentPanne_Detail_Id").getValue();
		let V_panneType = $$("Radio_TypePanne_Id").getValue() + $$("Combo_TypePanne_Id").getValue();
		let V_composant = $$("Text_Composant_Detail_Id").getInputNode().value;
		
		// Modif Entrée, auto statut 3(dépanner mais pas repasser) sauf si statut 1(résolu) ou 4(résolu sans dépannage) ou 5(rebuter)
		if (! ("1" === V_state || "4" === V_state || "5" === V_state)) V_state = "3";

		webix.ajax().sync().post(V_urlBase + "&Type=update", {
			id: V_id,
			user: P_tabParms["Profil"],
			state: V_state,
			commentaire: V_commentaire,
			panneType: V_panneType,
			composant: V_composant,
			heure: V_heure,
			date: V_date,
			aoi: V_aoi
		}, function(P_response)
		{
			let V_response = JSON.parse(P_response);
			if (V_response.id !== V_id || V_response.status !== "success") return webix.message("Le système a rencontré une erreur lors de l'enregistrement des informations"), "error";
			webix.message(V_response.message, V_response.status);

			if (V_state !== "1" && V_state !== "4")
			{
				$$("Datatable_Panne_Id").updateItem($$("Datatable_Panne_Id").getSelectedId(), {
					user: P_tabParms["Profil"],
					STATUT_FLAG: V_state,
					COMMENTAIRE_PANNE: V_commentaire,
					MODIFICATION_UTILISATEUR: P_tabParms["Profil"],
					TYPE_PANNE: V_panneType,
					COMPOSANT: V_composant,
					MOD_DATE_HEURE: V_date + " " + V_heure, //eslint-disable-line
				});
				return;
			}

			// On met à jour les Item de la datatable ou l'aoi = V_aoi
			$$("Datatable_Panne_Id").data.each(function(P_item)
			{
				if (P_item.NUMERO_AOI !== V_aoi) return;

				$$("Datatable_Panne_Id").updateItem(P_item.id, {
					user: P_tabParms["Profil"],
					STATUT_FLAG: V_state,
					COMMENTAIRE_PANNE: V_commentaire,
					MODIFICATION_UTILISATEUR: P_tabParms["Profil"],
					TYPE_PANNE: V_panneType,
					COMPOSANT: V_composant,
					MODIFICATION_DATE: V_date,
					MODIFICATION_HEURE: V_heure
				});
			});
		});	
	};

	// Méthode permettant de modifier une ligne
	C_toolbar.F_EditRow = function ()
	{
	};

	// Méthode permettant de supprimer une ligne
	C_toolbar.F_DeleteRow = function ()
	{
	};

	// Méthode permettant d'afficher les fichiers d'une ligne
	C_toolbar.F_FolderRow = function () 
	{
	};

	// Méthode permettant l'import
	C_toolbar.F_ImportToExcel = function ()
	{
	};

	// Méthode permettant l'export vers excel
	C_toolbar.F_ExportToExcel = function ()
	{
	};
	// Méthode permettant d'ouvrir l'arbre
	C_toolbar.F_OpenAllTree = function () 
	{
	};

	// Méthode permettant de fermer l'arbre
	C_toolbar.F_CloseAllTree = function () 
	{
	};

	// Méthode permettant de grouper par type
	C_toolbar.F_GroupAllTree = function () 
	{
	};

	// Méthode permettant d'aller à l'écran suivant
	C_toolbar.F_NextApp = function ()
	{
	};

	try
	{
		// Toolbar
		let V_headerDatatable = C_toolbar.V_toolbar;

		// Panneau latéral "Filtre(s)"
		let V_panelFiltre = C_filterPanel.V_panelFilter;
		V_panelFiltre.body.body.rows = 
		[
			{
				view: "fieldset",
				id: "Fieldset_Information_Id",
				body: {
					rows: [
						{
							view: "fieldset",
							label: "Recherche",
							body: {
								rows: [
									{
										cols: [
											F_InitText("Text_AOI_Id", "Numéro AOI:", "", false, {
												onChange: function() 
												{
													webix.UIManager.setFocus($$("Text_AOI_Id"));
													V_tabFilters = C_toolbar.F_SelectIfColorOrFilter("Text_AOI_Id", V_tabFilters, 0);
												}
											}),
											Apps.F_DefineSwitchAndColor("Text_AOI_Id", Config.V_colorFilter[1][1], "Datatable_Panne_Id", F_MaJColumns(), C_filterPanel.F_FilterData(1))
										]
									}
								]
							}
						},
						{
							view: "fieldset",
							label: "Recherches Avancées",
							body: {
								rows: [
									{
										cols: [
											F_InitText("Text_Article_Id", "Article:", "", false, {
												onChange: function() 
												{
													webix.UIManager.setFocus($$("Text_Article_Id"));
													V_tabFilters = C_toolbar.F_SelectIfColorOrFilter("Text_Article_Id", V_tabFilters, 1);
												}
											}),
											Apps.F_DefineSwitchAndColor("Text_Article_Id", Config.V_colorFilter[2][1], "Datatable_Panne_Id", F_MaJColumns(), C_filterPanel.F_FilterData(1))
										]
									},
									{
										cols: [
											F_InitMulticombo("Multicombo_OF_Id", "Numéro OF:", V_urls.NumOF, "", {
												onChange: function() 
												{
													webix.UIManager.setFocus($$("Multicombo_OF_Id"));
													V_tabFilters = C_toolbar.F_SelectIfColorOrFilter("Multicombo_OF_Id", V_tabFilters, 7);
												},
												onItemClick: function()
												{
													webix.UIManager.setFocus($$("Multicombo_OF_Id"));
												}
											}),
											Apps.F_DefineSwitchAndColor("Multicombo_OF_Id", Config.V_colorFilter[3][1], "Datatable_Panne_Id", F_MaJColumns(), C_filterPanel.F_FilterData(1))
										]
									},
									{
										view: "multicombo",
										id: "Multicombo_Status_Id",
										label: "Status:",
										labelPosition: "top",
										value: 2,
										align: "center",
										keepText: true,
										button: false,
										options: V_statusListe,
										sizeToContent: true,
										on: {
											onChange: function() 
											{
												webix.UIManager.setFocus($$("Multicombo_Status_Id"));
												V_tabFilters = C_toolbar.F_SelectIfColorOrFilter("Multicombo_Status_Id", V_tabFilters, 2);
											},
											onItemClick: function()
											{
												webix.UIManager.setFocus($$("Multicombo_Status_Id"));
											}
										}
									},
									F_InitText("Text_Poste_Id", "Poste:", "", false, {
										onChange: function() 
										{
											webix.UIManager.setFocus($$("Text_Poste_Id"));
											V_tabFilters = C_toolbar.F_SelectIfColorOrFilter("Text_Poste_Id", V_tabFilters, 3);
										}
									}),
									F_InitMulticombo("Multicombo_FIC_Id", "Numéro FIC:", V_urls.NumFIC, "", {
										onChange: function() 
										{
											webix.UIManager.setFocus($$("Multicombo_FIC_Id"));
											V_tabFilters = C_toolbar.F_SelectIfColorOrFilter("Multicombo_FIC_Id", V_tabFilters, 8);
										},
										onItemClick: function()
										{
											webix.UIManager.setFocus($$("Multicombo_FIC_Id"));
										}
									}),
									F_InitMulticombo("Multicombo_ModifDepanneur_Id", "Dépanneur.se:", V_urls.Depanneur, "", {
										onChange: function() 
										{
											webix.UIManager.setFocus($$("Multicombo_ModifDepanneur_Id"));
											V_tabFilters = C_toolbar.F_SelectIfColorOrFilter("Multicombo_ModifDepanneur_Id", V_tabFilters, 9);
										},
										onItemClick: function()
										{
											webix.UIManager.setFocus($$("Multicombo_ModifDepanneur_Id"));
										}
									}),
									{
										view: "datepicker",
										id: "Datepicker_Date_Id",
										label: "Date:",
										labelPosition: "top",
										align: "center",
										format: "%Y/%m/%d %H:%i",
										timepicker: true,
										on: {
											onChange: function() 
											{
												webix.UIManager.setFocus($$("Datepicker_Date_Id"));
												if ($$("Datepicker_Date_Id").getValue() === null)
												{
													V_tabFilters[5] =  "";
													V_tabFilters[6] = "";
													C_filterPanel.F_DynamiqueFilterData();
												}
												else
												{
													V_tabFilters[5] = $$("Datepicker_Date_Id").getValue().getFullYear() + "-" + (parseInt($$("Datepicker_Date_Id").getValue().getMonth()) + 1).toString().padStart(2, "0") + "-" + $$("Datepicker_Date_Id").getValue().getDate().toString().padStart(2, "0");
													V_tabFilters[6] = $$("Datepicker_Date_Id").getValue().getHours().toString().padStart(2, "0") + ":" + $$("Datepicker_Date_Id").getValue().getMinutes().toString().padStart(2, "0") + ":00";
													C_filterPanel.F_DynamiqueFilterData();
												}
											}
										}
									},
									{
										view: "datepicker",
										id: "Datepicker_ModifDate_Id",
										label: "Date de Modification:",
										labelPosition: "top",
										align: "center",
										format: "%Y/%m/%d %H:%i",
										timepicker: true,
										on: {
											onChange: function() 
											{
												webix.UIManager.setFocus($$("Datepicker_ModifDate_Id"));
												if ($$("Datepicker_ModifDate_Id").getValue() === null)
												{
													V_tabFilters[10] =  "";
													V_tabFilters[11] = "";
													C_filterPanel.F_DynamiqueFilterData();
												}
												else
												{
													V_tabFilters[10] = $$("Datepicker_ModifDate_Id").getValue().getFullYear() + "-" + (parseInt($$("Datepicker_ModifDate_Id").getValue().getMonth()) + 1).toString().padStart(2, "0") + "-" + $$("Datepicker_ModifDate_Id").getValue().getDate().toString().padStart(2, "0");
													V_tabFilters[11] = $$("Datepicker_ModifDate_Id").getValue().getHours().toString().padStart(2, "0") + ":" + $$("Datepicker_ModifDate_Id").getValue().getMinutes().toString().padStart(2, "0") + ":00";
													C_filterPanel.F_DynamiqueFilterData();
												}
											}
										}
									}
								]
							}
						}
					]
				}
			}
		];

		// Multiview : Datatable
		let V_multiview = 
		{
			view: "multiview",
			id: "Multiview_Panne_Id",
			cells: [
				{
					view: "datatable",
					id: "Datatable_Panne_Id",
					select: "row",
					rowHeight: 44,
					headermenu:
					{
						width: 250,
						height: 300,
						autoheight: false,
						scroll: true,
						spans: true,
						fillspace: true
					},
					dragColumn: true,
					sort: "multi",
					hover: "myhover",
					clipboard: true,
					delimiter: { rows: "\n", cols: "," },
					resizeColumn: true,
					pager: "Pager_Id",
					css: "webix_data_border",
					spans: true,
					columns: F_MaJColumns(),
					datafetch: 90,
					loadahead: 45,
					on:
					{
						onBeforeLoad: function()
						{
							webix.extend(this, webix.ProgressBar);
							this.refreshColumns(F_MaJColumns());
							this.showProgress({});										
						},
						onAfterLoad: function()
						{
							let V_rowIndex = 1; // Initialisation de l'index de ligne
							let V_lastRowItem = null;
							// Ajout d'un index personnalisé à chaque ligne
							this.eachRow(function(P_rowId) 
							{
								try
								{
									let V_rowItem = this.getItem(P_rowId);
									if (V_lastRowItem === null)
									{
										V_lastRowItem = V_rowItem;
									}

									if  (V_lastRowItem.id !== V_rowItem.id)
									{
										
										V_rowIndex++;
									}

									if (V_lastRowItem.id !== V_rowItem.id)
									{
										V_lastRowItem = V_rowItem;
									}

									this.getItem(P_rowId).rowIndex = V_rowIndex;

									if (V_rowItem.rowIndex % 2 !== 0) 
									{
										this.addRowCss(P_rowId, "odd-row");
									}
								} 
								catch (error) { }	// eslint-disable-line
							});
							
							this.refresh();  // Rafraîchir le tableau pour afficher les indices

							if (!this.count())
								this.showOverlay("Désolé, il n'y a pas de données");
							else
								this.hideOverlay();

							C_toolbar.F_ActivateFullLoad("Datatable_Panne_Id", "Button_fullLoad_Id", "Toolbar_header_Id");
						},
						onBeforeSelect: function()
						{
							// lié la table article au formulaire et à la table accessoire avant selection d'un élément
							$$("Form_Detail_Id").bind($$("Datatable_Panne_Id"));
						},
						onItemClick()
						{
							let V_article = $$("Datatable_Panne_Id").getSelectedItem().NUMERO_ARTICLE;

							// Actualise l'historique des pannes
							if ($$("Fieldset_Historique_Id").isVisible()) 
							{
								$$("Datatable_HistoriquePanne_Id").clearAll();
								$$("Datatable_HistoriquePanne_Id").load(F_UrlHistoriquePanne(
									V_article,
									$$("Datatable_Panne_Id").getSelectedItem().PANNE
								));
							}
							else
							{
								$$("Form_Add_Id").hide();
								$$("Form_Detail_Id").show();
							}
						}
					},
					url: C_filterPanel.F_FilterData(1)
				},
				{
					id: "Chart_Panne_Id",
					hidden: true,
					padding: {top: 0, bottom: 50},
					url: "test",
					rows: [
						{
							view: "chart",
							type: "bar",
							value: "#n#",
							label: "#n#",
							xAxis: {title: "Top 10 des pannes", template: "#panne#" },
							barWidth: 50,
							radius: 0,
							gradient: "falling",
							url: V_urlRequest + `SELECT '[' || TRIM(NUMERO_ARTICLE) || '] '  || PANNE AS PANNE, count(PANNE) AS N FROM prod_file.SUIVIE_PANNE_CARTEELECTRONIQUE 
								WHERE PANNE != '' GROUP BY PANNE, NUMERO_ARTICLE ORDER BY N DESC LIMIT 10`
						}
					]
				}
			]
		};

		// Loader du sous fichier
		let V_footerDatatable = C_loader.V_loader;

		// Bar de pagination
		let V_pager = C_pager.V_pager;


		// Datatable Historique des pannes
		let V_historiquePanne =
		{
			view: "fieldset",
			id: "Fieldset_Historique_Id",
			label: "Historique des Pannes:",
			autoheight: true,
			hidden: true,
			body: {
				view: "datatable",
				id: "Datatable_HistoriquePanne_Id",
				select: false,
				rowHeight: 165,
				rowLineHeight: 33,
				headermenu: {
					width: 250,
					height: 300,
					autoheight: false,
					spans: true,
					fillspace: true
				},
				// fixedRowHeight: false,
				dragColumn: true,
				sort: "multi",
				hover: "myhover",
				clipboard: true,
				delimiter: { rows: "\n", cols: "," },
				resizeColumn: true,
				css: "webix_data_border",
				columns: [
					{
						id: "fic",
						header: [{ text: "FIC", mode: "text" }],
						adjust: true,
						sort: "server",
						maxWidth: 110,
						fillspace: true,
						autoheight: true,
						template: "#numero_fic# <br> <i>Ind.<b>#indice_fic#</b></i>"
					},
					{
						id: "composant",
						header: [{ text: "Composant", mode: "text" }],
						adjust: true,
						sort: "server",
						maxWidth: 150,
						fillspace: true,
						autoheight: true,
						template: function(P_obj)
						{
							let V_regex = /(\S+)\.\s*-\s*(\S+)\s*\[\s*([^\]]+)\s*\]/;
							let V_match = P_obj.composant.match(V_regex);
							if (V_match)
							{	
								let V_repere = V_match[1];      
								let V_composant = V_match[2];   
								let V_casier = V_match[3]; 
								let V_return = "<b>" + V_repere + "</b>.\t  [ " + V_casier + " ]<br>" + V_composant;
								return V_return;
							}
							return P_obj.composant;
						}
					},
					{
						id: "type_panne",
						header: [{ text: "Type Panne", mode: "text" }],
						adjust: true,
						sort: "server",
						maxWidth: 160,
						fillspace: true,
						autoheight: true,
						template: function(P_obj)
						{	
							let V_panneType = P_obj.type_panne.split("");
							let V_panneTypeFinal = "<u>" + V_panneTypeLocalisationList[V_panneType[0]].value + "</u> : <br>" + V_panneTypeList[V_panneType[0]][V_panneType[1]].value; // eslint-disable-line
							return V_panneTypeFinal;
						}
					},
					{
						id: "commentaire_panne",
						header: [{ text: "Commentaire", mode: "text" }],
						adjust: true,
						sort: "server",
						minWidth: 200,
						fillspace: true,
						autoheight: true,
						cssFormat: function()
						{
							return {
								"white-space": "normal !important",
								"word-wrap": "break-word"
							};
						}
					}
				]
			}
		};


		// Compteur
		let V_compteur = {
			view: "form",
			id: "Form_Compteur_Id",
			scroll: "xy",
			autoheight: true,
			hidden: true,
			on: {
				onViewShow: function()
				{
					F_UpdateCompteur();
				}	
			},
			elements: [
				{
					cols: [
						{
							view: "combo",
							id: "Combo_CompteurArticle_Id",
							labelPosition: "left",
							options: V_urls.Article,
							on: {
								onChange: function()
								{
									F_UpdateCompteur();
								}
							}
						},
						{
							view: "radio",
							id: "Radio_CompteurArticle_Id",
							labelPosition: "top",
							label: "Choisir un article ?",
							value: 1,
							options: [
								{id: 1, value: "oui"},
								{id: 2, value: "non"}
							],
							on: {
								onChange: function() 
								{
									F_UpdateCompteur();
								}
							}
						}
					]
				},
				{
					cols: [
						{
							view: "fieldset",
							label: "Compteur:",
							autoheight: true,
							body: {
								rows: [
									{
										cols: [
											F_InitText("Text_CompteurBPC_Id", "Bon du Premier Coup:")
										]
									},
									{
										cols: [
											F_InitText("Text_CompteurPanneCarte_Id", "Ratio Panne/Carte:", "ratio"),
											{
												rows: [
													{
														view: "text",
														id: "Text_CompteurPanne_Id",
														name: "npassage",
														label: "Passage.s",
														disabled: true
													},
													{
														view: "text",
														id: "Text_CompteurPanne_Id",	
														name: "npanne",
														label: "Panne.s",
														disabled: true
													}
												]
											}
										]
									}
								]
							}
						},
						{
							view: "radio",
							id: "Radio_CompteurDuree_Id",
							labelPosition: "top",
							label: "Depuis ?",
							value: -1,
							options: [
								{id: -1, value: "Tout"},
								{id: 7, value: "1 semaine"},
								{id: 30, value: "1 mois"},
								{id: 91, value: "3 mois"},
								{id: 365, value: "1 an"}
							],
							vertical: true,
							on: {
								onChange: function() 
								{
									F_UpdateCompteur();
								}
							}
						}					
					]
				},
				{
					cols: [
						{
							view: "fieldset",
							body: {
								rows: [
									F_InitText("Text_CompteurArticle_Id", "Articles:", "article"),
									F_InitText("Text_CompteurPanne_Id", "Pannes:", "a_depanner"),
									F_InitText("Text_CompteurRepasser_Id", "Dépanner mais pas repassé:", "depanner_pas_repasser")
								]
							}
						},
						{}
					]
				}
				
				
			]
		};
		
		function F_UpdateCompteur()
		{
			let V_isAll = $$("Radio_CompteurArticle_Id")?.getValue();
			let V_duree = $$("Radio_CompteurDuree_Id")?.getValue();
			V_duree = parseInt(V_duree, 10);
			let V_article = $$("Combo_CompteurArticle_Id")?.getValue();
			let V_textCompteurBPC = $$("Text_CompteurBPC_Id");
			let V_compteur = $$("Form_Compteur_Id");
			let V_comboArticle = $$("Combo_CompteurArticle_Id");
			
			if (V_isAll !== "1")
			{
				V_article = "";
				V_comboArticle?.disable();
			}
			else
			{
				V_comboArticle?.enable();
			}

			// Mise à jour du compteur BPC
			webix.ajax().get(F_UrlBPC(V_duree, V_article), function(P_response)
			{
				let V_result = JSON.parse(P_response);
				V_textCompteurBPC?.setValue(V_result[0].ratio_bon_du_premier_coup);
			});
			V_textCompteurBPC?.refresh();
			
			// Mise à jour du compteur Panne/Carte
			V_compteur?.define("url", F_UrlCompteur(V_article, V_duree));
			V_compteur?.refresh();
		}


		// Formulaire et Détail
		let V_form =
		{
			view: "form",
			id: "Form_Detail_Id",
			scroll: "xy",
			autoheight: true,
			hidden: true, // form caché par défaut, visible à la selection d'un item de la table article
			elements: [
				{
					rows: [
						{
							view: "fieldset",
							id: "Fieldset_InfoGlobal_Id",
							label: "Informations Globales",
							body: {
								cols: [
									F_InitText("Poste_Detail", "Poste:", "POSTE"),
									F_InitText("Fic_Detail", "FIC:", "FIC")
								]
							}
						},
						{
							view: "fieldset",
							id: "Fieldset_DetailMesure_id",
							label: "Données Mesures",
							body: {
								rows: [
									{
										cols: [
											F_InitText("Duree_Detail_Id", "Durée:", "DUREE"),
											F_InitText("Mesure_Detail_Id", "Mesure:", "MESURE")
										]
									},
									F_InitText("Limit_Detail_Id", "Limite Min/Max:", "LIMITE")
								]
							}
						},
						{
							view: "combo",
							id: "Combo_Status_Detail_Id",
							name: "STATUT_FLAG",
							label: "Status:",
							labelPosition: "top",
							align: "center",
							keepText: true,
							button: false,
							sizeToContent: true,
							options: V_statusListe
						},
						{
							view: "fieldset",
							id: "Fieldset_Detail_id",
							label: "Détail",
							body: { 
								rows: [
									F_InitText("DesiPanne_Detail", "Désignation Panne", "DESIGNATION_PANNE"),
									{
										view: "text",
										id: "Text_Composant_Detail_Id",
										name: "COMPOSANT",
										label: "Composant:",
										labelPosition: "top",
										labelAlign: "left",
										suggest: F_InitSuggestComposant("datatable")
									},
									{
										cols: [
											{
												rows: [
													{
														view: "radio", 
														id: "Radio_TypePanne_Id",
														label: "Type de Pannes:",
														labelPosition: "top",
														vertical: true,
														options: V_panneTypeLocalisationList,
														on: {
															onChange: function() 
															{
																let V_value = $$("Radio_TypePanne_Id").getValue();

																$$("Combo_TypePanne_Id").define("options", V_panneTypeList[V_value - 1]);
																$$("Combo_TypePanne_Id").setValue("1");
															}
														}
													},
													{
														view: "combo",
														id: "Combo_TypePanne_Id",
														name: "TYPE_PANNE",
														labelPosition: "left",
														on: {
															onChange: function()
															{
																let V_value = $$("Combo_TypePanne_Id").getValue();
																if (V_value.length > 1) 
																{
																	let V_comboValue = V_value.split("");
																	$$("Radio_TypePanne_Id").setValue(V_comboValue[0]);
																	$$("Combo_TypePanne_Id").define("options", V_panneTypeList[V_comboValue[0] - 1]);
																	$$("Combo_TypePanne_Id").setValueHere(parseInt(V_comboValue[1]));
																}
																else if (V_value === "")
																{
																	$$("Radio_TypePanne_Id").setValue("4");
																}
															}
														}
													}
												]
											},
											F_InitTextarea("Textarea_CommentPanne_Detail_Id", "Commentaire Panne:", "COMMENTAIRE_PANNE", false)
										]
									}
								]
							}
						},
						{
							view: "fieldset",
							id: "Fieldset_Appendice_id",
							label: "Appendice:",
							body: {
								cols: [
									F_InitText("CreationDate", "Date de Création:", "DATE_HEURE"),
									F_InitText("ModificationDate", "Date de Modification:", "MOD_DATE_HEURE")
								]
							}
						}
					]
				}
			]
		};

		// Formulaire d'ajout
		let V_addform =
		{
			view: "form",
			id: "Form_Add_Id",
			scroll: "xy",
			autoheight: true,
			hidden: true, // form caché par défaut, visible à la selection d'un item de la table article
			elements: [
				{
					rows: [
						{
							view: "fieldset",
							id: "Fieldset_AddInfoGlobal_Id",
							label: "Informations Globales",
							body: {
								rows: [
									{
										cols: [
											{
												view: "text",
												id: "Text_Poste_Add_Id",
												name: "POSTE",
												label: "Poste:",
												labelPosition: "top",
												labelAlign: "left",
												required: true
											},
											{
												view: "text",
												id: "Text_Fic_Add_Id",
												name: "FIC",
												label: "FIC:",
												labelPosition: "top",
												labelAlign: "left",
												required: true
											},
											{
												view: "text",
												id: "Text_iFic_Add_Id",
												name: "IFIC",
												label: "Ind:",
												labelPosition: "top",
												labelAlign: "left",
												required: true
											}
										]
									},
									{
										cols: [
											{
												view: "text",
												id: "Text_Article_Add_Id",
												name: "ARTICLE",
												label: "Article:",
												labelPosition: "top",
												labelAlign: "left",
												required: true
											},
											{
												view: "text",
												id: "Text_NumAOI_Add_Id",
												name: "NUMERO_AOI",
												label: "Numéro AOI:",
												labelPosition: "top",
												labelAlign: "left",
												required: true
											},
											{
												view: "text",
												id: "Text_NumOF_Add_Id",
												name: "NUMERO_OF",
												label: "Numéro OF:",
												labelPosition: "top",
												labelAlign: "left",
												required: true
											}
										]
									}
								]
							}
						},
						{
							view: "fieldset",
							id: "Fieldset_AddMesure_id",
							label: "Données Mesures",
							body: {
								rows: [
									{
										cols: [
											{
												view: "text",
												id: "Text_Duree_Add_Id",
												name: "DUREE",
												label: "Durée (seconde):",
												labelPosition: "top",
												labelAlign: "left",
												validate: webix.rules.isNumber,
												required: true
											},
											F_InitText("Mesure_Add_Id", "Mesure:", "MESURE", false),
											F_InitText("Unite_Add_Id", "Unité:", "UNITE", false)
										]
									},
									{
										cols: [
											F_InitText("LimitMi_Add_Id", "Limite Min:", "LIMITEMI", false),
											F_InitText("LimitMa_Add_Id", "Limite Max:", "LIMITEMA", false),
											F_InitText("UniteLim_Add_Id", "Unité Limite:", "UNITELIM", false)
										]
									}
								]
							}
						},
						{
							view: "combo",
							id: "Combo_Status_Add_Id",
							name: "STATUT_FLAG",
							label: "Status:",
							labelPosition: "top",
							align: "center",
							keepText: true,
							button: false,
							required: true,
							sizeToContent: true,
							options: V_statusListe
						},
						{
							view: "fieldset",
							id: "Fieldset_Add_id",
							label: "Détail",
							body: { 
								rows: [
									{
										cols: [
											// F_InitText("Text_Panne_Add_Id", "Panne:", "PANNE", false),
											{
												view: "text",
												id: "Text_Panne_Add_Id",
												name: "PANNE",
												label: "Panne:",
												labelPosition: "top",
												labelAlign: "left",
												maxWidth: 150
											},
											F_InitText("DesiPanne_Add", "Désignation Panne", "DESIGNATION_PANNE", false)
										]
									},
									{
										view: "text",
										id: "Text_Composant_Add_Id",
										name: "COMPOSANT",
										label: "Composant:",
										labelPosition: "top",
										labelAlign: "left",
										suggest: F_InitSuggestComposant("addform")
									},
									{
										cols: [
											{
												rows: [
													{
														view: "radio", 
														id: "Radio_TypePanneAdd_Id",
														label: "Type de Pannes:",
														labelPosition: "top",
														vertical: true,
														options: V_panneTypeLocalisationList,
														on: {
															onChange: function() 
															{
																let V_value = $$("Radio_TypePanneAdd_Id").getValue();

																$$("Combo_TypePanneAdd_Id").define("options", V_panneTypeList[V_value - 1]);
																$$("Combo_TypePanneAdd_Id").setValue("1");
															}
														}
													},
													{
														view: "combo",
														id: "Combo_TypePanneAdd_Id",
														name: "TYPE_PANNE",
														labelPosition: "left",
														on: {
															onChange: function()
															{
																let V_value = $$("Combo_TypePanneAdd_Id").getValue();
																if (V_value.length > 1) 
																{
																	let V_comboValue = V_value.split("");
																	$$("Radio_TypePanneAdd_Id").setValue(V_comboValue[0]);
																	$$("Combo_TypePanneAdd_Id").define("options", V_panneTypeList[V_comboValue[0] - 1]);
																	$$("Combo_TypePanneAdd_Id").setValueHere(parseInt(V_comboValue[1]));
																}
																else if (V_value === "")
																{
																	$$("Radio_TypePanneAdd_Id").setValue("4");
																}
															}
														}
													}
												]
											},
											F_InitTextarea("Textarea_CommentPanne_Add_Id", "Commentaire Panne:", "COMMENTAIRE_PANNE", false)
										]
									}
								]
							}
						},
						{
							view: "button",
							id: "Button_Add_Id",
							value: "Ajouter",
							on: {
								onItemClick: function()
								{
									C_toolbar.F_SaveRow();
								}
							}
						}
					]
				}
			],
			on: {
				onChange: function() 
				{
					this.validate();
				}
			}
		};

		// Gestion du cache ou boutton
		webix.ready(function()
		{
			C_toolbar.F_ActivateFullLoad("Datatable_Panne_Id", "Button_fullLoad_Id", "Toolbar_header_Id");


			//Ajout reload to switcher Auto
			V_cellsToHighlight.forEach(function (P_item)
			{
				$$("Switch_" + P_item.name + "_Id").attachEvent("onItemClick", 
					function()
					{
						$$("Switch_" + P_item.name + "_Id").define("value", $$("Switch_" + P_item.name + "_Id").getValue() === 0 ? 1 : 0);
						$$("Switch_" + P_item.name + "_Id").refresh();

						if ($$(P_item.item + "_" + P_item.name + "_Id").getValue() !== "")
						{
							V_tabFilters = C_toolbar.F_SelectIfColorOrFilter(P_item.item + "_" + P_item.name + "_Id", V_tabFilters, P_item.index);
						}
					});
				$$("Switch_" + P_item.name + "_Id").attachEvent("onChange", 
					function()
					{
						if ($$(P_item.item + "_" + P_item.name + "_Id").getValue() !== "")
						{
							V_tabFilters = C_toolbar.F_SelectIfColorOrFilter(P_item.item + "_" + P_item.name + "_Id", V_tabFilters, P_item.index);
						}
					});
			});
		});

		// Code principal de l'application
		let V_codeDeApplicationWebix =
		{
			rows: 
			[
				V_headerDatatable,
				{
					type: "wide",
					cols: 
					[
						V_panelFiltre,
						{
							rows: 
							[
								V_multiview,
								V_footerDatatable,
								V_pager
							]
						},
						{
							view: "resizer"
						},				
						V_historiquePanne,		
						V_form,
						V_addform,
						V_compteur
					]
				}
			]
		};

		return V_codeDeApplicationWebix;
	}
	catch (P_error)
	{
		console.error(P_error);	 // eslint-disable-line
	}

	function F_InitColumns(P_id, P_headerText, P_mode, P_headerMenuVisible = true, P_minwith = 120, P_fillspace = true, P_cssFormat = null, P_listOptions = null, P_adjust = false, P_sort = "server", P_autoheight = true,  P_champSql = "", P_champGroupSql = "")
	{
		let V_config = 
		{
			id: P_id,
			header: [{ text: P_headerText, mode: P_mode }],
			headermenu: P_headerMenuVisible,
			adjust: P_adjust,
			sort: P_sort,
			minWidth: P_minwith,
			fillspace: P_fillspace,
			autoheight: P_autoheight,
			champSql: P_champSql,
			champGroupSql: P_champGroupSql
		};

		if (P_listOptions !== null)
		{
			V_config.options = P_listOptions;
		}

		if (P_cssFormat !== null)
		{
			V_config.cssFormat = function(P_value, P_obj, P_row, P_col) // eslint-disable-line
			{
				return  Apps.F_HighlightCell(P_obj, P_col, V_cellsToHighlight);
			};
		}

		if (P_mode === "date")
		{
			V_config.header[0].mode = "text";
			V_config.format = Apps.F_DateFormatter;
			V_config.template = function (P_obj, P_common) // eslint-disable-line
			{
				if (P_obj[P_id] === "9999-12-31")
				{
					return "";
				}

				return Apps.F_DateFormatter(P_obj[P_id]);
			};
		}

		if (P_mode === "euro")
		{
			V_config.header[0].mode = "text";
			V_config.css = {"text-align": "right"};
			V_config.template = function (P_obj, P_common) // eslint-disable-line
			{
				if (parseInt(P_obj[P_id]) === 0)
				{
					return "";
				}
				else
				{
					let V_number = webix.Number.format(P_obj[P_id], 
						{
							groupDelimiter: " ",
							groupSize: 3,
							decimalDelimiter: ",", 
							decimalSize: 2,
							minusPosition: "before",
							minusSign: "-"  
						});

					V_number += "€";

					return V_number;
				}
			};
		}
		return V_config;
	}

	function F_MaJColumns() 
	{
		let V_configColumns = "";
		
		V_configColumns = [
			F_InitColumns("NUMERO_AOI", "AOI", "text", true, 110, true, true),
			F_InitColumns("NUMERO_ARTICLE", "Article", "text", true, 110, true, true),
			F_InitColumns("NUMERO_OF", "OF", "text", true, 110, true, true),
			{
				id: "PANNE",
				header: [{ text: "Panne", mode: "text" }],
				adjust: true,
				sort: "server",
				minWidth: 60,
				fillspace: true,
				autoheight: true,
				cssFormat: function(P_value, P_obj)
				{
					switch (P_obj.STATUT_FLAG)
					{
						case "1": // Résolu
							return {"background-color": `#${V_statusListe[0].colors}!important`}; // Vert
						case "2": // À dépanner
							return {"background-color": `#${V_statusListe[1].colors}!important`}; // rouge
						case "3": // Dépanner mais pas repasser
							return {"background-color": `#${V_statusListe[2].colors}!important`}; // orange
						case "4": // Résolu sans dépannage
							return {"background-color": `#${V_statusListe[3].colors}!important`}; // bleu
						case "5": // Rebuter
							return {"background-color": `#${V_statusListe[4].colors}!important`}; // violet
					}
				}
			},
			{
				id: "DATE",
				header: [{ text: "Date", mode: "text" }],
				adjust: true,
				sort: "server",
				minWidth: 110,
				fillspace: true,
				autoheight: true,
				hidden: true
			}
		];
		return V_configColumns;
	}

	function F_InitText(P_id, P_label, P_name = "", P_state = true, P_on) 
	{
		const V_configText = {
			view: "text",
			id: P_id,
			name: P_name,
			label: P_label,
			labelPosition: "top",
			labelAlign: "left",
			disabled: P_state,
			sizeToContent: true,
			on: P_on
		};

		return V_configText;
	}

	function F_InitTextarea(P_id, P_label, P_name = "", P_state = true) 
	{
		const V_configText = {
			view: "textarea",
			id: P_id,
			name: P_name,
			label: P_label,
			labelPosition: "top",
			labelAlign: "left",
			sizeToContent: true,
			disabled: P_state
		};

		return V_configText;
	}

	function F_InitMulticombo(P_id, P_label, P_options = [], P_placeholder = "", P_on) 
	{
		const V_configMulticombo = {
			view: "multicombo",
			id: P_id,
			label: P_label,
			labelPosition: "top",
			placeholder: P_placeholder,
			align: "center",
			keepText: true,
			button: false,
			sizeToContent: true,
			options: P_options,
			on: P_on
		};

		return V_configMulticombo;
	}

	function F_UrlHistoriquePanne(P_article, P_panne)
	{
		if (!P_article) 
		{
			P_article = "";
		}
		if (!P_panne)
		{
			P_panne = "";
		}

		let V_url = V_urlRequest + "SELECT DISTINCT type_panne, commentaire_panne, composant, INDICE_FIC, NUMERO_FIC FROM Suivie_panne_carteElectronique WHERE (Statut_flag = 1 OR Statut_flag = 4) AND Numero_article = '" + P_article + "' AND Panne = '" + P_panne + "' AND type_panne != ''";
		return V_url;
	}
	

	function F_UrlCompteur(P_article = "", P_duree = -1)
	{
		let V_date = new Date;
		V_date.setDate(V_date.getDate() - P_duree); // Calculer la date
		let V_dateFormatted = V_date.getFullYear() + "-" + (V_date.getMonth() + 1).toString().padStart(2, "0") + "-" + V_date.getDate().toString().padStart(2, "0");


		let V_url = V_urlRequest + `
		SELECT 
    		NPANNE.NPANNE,
    		NPASSAGE.NPASSAGE,
    		round((NPANNE.NPANNE * 1.0 / NPASSAGE.NPASSAGE), 5) * 100 AS RATIO,
    		tot.ARTICLE,
    		tot.DEPANNER_PAS_REPASSER,
    		tot.A_DEPANNER 
		FROM 
			(SELECT count(DISTINCT NUMERO_ARTICLE) AS article, count(CASE WHEN spc.STATUT_FLAG = 2 THEN 1 END) AS A_DEPANNER, count(CASE WHEN spc.STATUT_FLAG = 3 THEN 1 END) AS DEPANNER_PAS_REPASSER FROM SUIVIE_PANNE_CARTEELECTRONIQUE spc) AS TOT,`;
		
		if (P_duree === -1)
		{
			V_dateFormatted = "0001-01-01"; // Si la durée est -1, on prend une date très ancienne
		}

		if (!P_article || P_article === "")
		{
			V_url += `
			(SELECT COUNT(id) AS NPASSAGE 
			 FROM SUIVIE_PANNE_CARTEELECTRONIQUE WHERE cast(CREATION_DATE AS date) >= '` + V_dateFormatted + `') AS NPASSAGE,
    		(SELECT COUNT(id) AS NPANNE 
			 FROM SUIVIE_PANNE_CARTEELECTRONIQUE 
			 WHERE (STATUT_FLAG = 2 OR STATUT_FLAG = 3 OR STATUT_FLAG = 5) AND cast(CREATION_DATE AS date) >= '` + V_dateFormatted + `') AS NPANNE
			`;
		}
		else
		{
			V_url += `
    		(SELECT COUNT(id) AS NPASSAGE 
			 FROM SUIVIE_PANNE_CARTEELECTRONIQUE 
			 WHERE NUMERO_ARTICLE = '` + P_article + `' AND cast(CREATION_DATE AS date) >= '` + V_dateFormatted + `') AS NPASSAGE, 
    		(SELECT COUNT(id) AS NPANNE 
			 FROM SUIVIE_PANNE_CARTEELECTRONIQUE 
			 WHERE (STATUT_FLAG = 2 OR STATUT_FLAG = 3 OR STATUT_FLAG = 5) AND NUMERO_ARTICLE = '` + P_article + `' AND cast(CREATION_DATE AS date) >= '` + V_dateFormatted + `') AS NPANNE
			`;
		}

		return V_url;
	}
	

	function F_UrlBPC(P_duree = -1, P_article = "") 
	{
		let V_date = new Date;
		V_date.setDate(V_date.getDate() - P_duree); // Calculer la date
		let V_dateFormatted = V_date.getFullYear() + "-" + (V_date.getMonth() + 1).toString().padStart(2, "0") + "-" + V_date.getDate().toString().padStart(2, "0");

		if (P_duree === -1)
		{
			V_dateFormatted = "0001-01-01"; // Si la durée est -1, on prend une date très ancienne
		}
		
		let V_url = V_urlRequest + `
		SELECT 
    		(COUNT(DISTINCT CASE WHEN (BPC.STATUT_FLAG = 1 OR BPC.STATUT_FLAG = 4) THEN BPC.numero_AOi END) * 1.0 / NUllIF(count(DISTINCT N.N), 0)) * 100 AS RATIO_BON_DU_PREMIER_COUP 
		FROM 
			(SELECT sn.NUMERO_AOI AS N FROM SUIVIE_PANNE_CARTEELECTRONIQUE sn WHERE CAST(sn.CREATION_DATE AS timestamp) >= date('` + V_dateFormatted + `')) AS N,
			(
				SELECT s.NUMERO_AOI, s.NUMERO_ARTICLE, s.STATUT_FLAG, s.CREATION_DATE || ' ' || s.CREATION_HEURE AS min_date FROM SUIVIE_PANNE_CARTEELECTRONIQUE s 
				JOIN (SELECT NUMERO_AOI, MIN(CREATION_DATE || ' ' || CREATION_HEURE) AS min_date FROM SUIVIE_PANNE_CARTEELECTRONIQUE GROUP BY NUMERO_AOI) min_dates 
				ON s.NUMERO_AOI = min_dates.NUMERO_AOI AND (s.CREATION_DATE || ' ' || s.CREATION_HEURE) = min_dates.min_date 
				WHERE cast(MIN_DATE AS timestamp) >= Date('` + V_dateFormatted + `')`;
		
		if (P_article && P_article !== "")
		{
			V_url += ` AND s.NUMERO_ARTICLE = '` + P_article + `'`;
		}
		V_url += `) AS BPC`;

		return V_url;
	}

	function F_InitSuggestComposant(P_opt) 
	{
		let V_suggestComposant = {
			body: {
				template: "#repere#.  - #composant# [ #casier# ]",
				dataFeed: function(P_value) 
				{
					let V_url = "";
					if (P_opt === "datatable") 
					{
						V_url = F_UrlComposant($$("Datatable_Panne_Id").getSelectedItem().NUMERO_ARTICLE, P_value, 0, 50);										
					}
					if (P_opt === "addform")
					{
						V_url = F_UrlComposant($$("Text_Article_Add_Id").getValue(), P_value, 0, 50);
					}
					return webix.ajax(V_url);
				}
			}
		};
		return V_suggestComposant;
	}
	
	function F_UrlComposant(P_article, P_value, P_offset, P_limit) 
	{
		if (!P_article)
		{
			P_article = "";
		}
		// Formatage de la date de référence
		let V_dateEFF = V_date.getFullYear().toString() +
                    V_date.getMonth().toString().padStart(2, "0") +
                    V_date.getDate().toString().padStart(2, "0");

		// Ajout des paramètres de pagination dans l'URL
		let V_url = V_urlRequest +
		"SELECT * FROM ( " +
        "SELECT trim(LIGTXT.TEXD) || ' - ' || trim(ARTTOT.NARL) || ' [ ' || trim(ctal) || ' ]' AS id, " +
		"LIGTXT.TEXD AS repere, ARTTOT.NARL AS composant, ctal AS casier " +
        "FROM S65AAE3E.EURO4CHAU.ARTTOT ARTTOT, S65AAE3E.EURO4CHAU.CARTEC CARTEC, " +
        "S65AAE3E.TEUR4CHAU.LIGTXT LIGTXT, S65AAE3E.EURO4CHAU.NOMLIG NOMLIG, " +
        "(SELECT DISTINCT STODEP.NART, STODEP.CDRP FROM S65AAE3E.EURO4CHAU.STODEP STODEP WHERE (STODEP.CUSN='01')) as stokdep " +
        "WHERE ARTTOT.NART = NOMLIG.NART " +
        "AND ((NOMLIG.DDEF <= " + V_dateEFF + ") " +
        "AND (NOMLIG.NOME = '" + P_article + "') " +
        "AND (LIGTXT.TYTX = 'COM') " +
        "AND (LIGTXT.FATX = 'NOM') " +
        "AND (NOMLIG.NINO = ligtxt.CLTX) " +
        "AND (NOMLIG.DFEF > " + V_dateEFF + ") " +
        "AND (CARTEC.TRCT = 'DEP')) " +
        "AND stokdep.nart = arttot.nart " +
        "AND rrct = concat(concat(cdrp,'/'),arttot.nart) " +
		") AS sub ";

		if (P_value !== "")
		{
			V_url += "WHERE sub.id LIKE '%" + P_value + "%' ";
		}
		V_url += "ORDER BY sub.id LIMIT " + P_limit + " OFFSET " + P_offset;

		return V_url;
	}
}


// Initialisation de valeur au lancement de l'écran : Warning OnChange
export function F_InitValues(P_tabParms)   // eslint-disable-line
{
	$$("Button_saveRow_Id").enable();
	$$("Button_addRow_Id").enable();
	// $$("Segmented_toolbar_Id").disableOption(3);
	$$("Segmented_toolbar_Id").disableOption(4);
}
