export const fieldsMockData = [
    {
        label: 'Kaavaprosessin kokoluokka',
        name: 'kaavaprosessin_kokoluokka',
        display: 'basic'

    },
    {
        label: 'Sitova tavoite',
        name: 'yksikon_sitova_tavoite',
        display: 'basic',
        choices: [
            {
                value: true,
                label: 'Kyllä'
            },
            {
                value: false,
                label: 'Ei'
            },
            {
                value: null,
                label: 'Ei tietoa'
            }
        ]
    },
    {
        label: 'Pinonumero',
        name: 'pinonumero',
        display: 'basic'

    },
    {
        label: 'Hankenumero',
        name: 'hankenumero',
        display: 'basic'

    },
    {
        label: 'Diaarinumero',
        name: 'diaarinumero',
        display: 'basic'

    },
    {
        label: 'Kaavanumero',
        name: 'kaavanumero',
        display: 'basic'
    },
    {
        label: 'Projektityyppi',
        name: 'projektityyppi',
        value: 'asemakaava',
        display: 'basic'
    },

    {
        label: 'Liikennesuunnitelma',
        name: 'kaavan_liikennesuunnitelma',
        choices: [
            {
                label: 'Ei laadita',
                value: 'ei_laadita'
            },
            {
                label: 'laaditaan (A projektiluokka)',
                value: 'laaditaan_a_projektiluokka'
            },
            {
                label: 'laaditaan (B projektiluokka)',
                value: 'laaditaan_b_projektiluokka'
            },
            {
                label: 'laaditaan (C projektiluokka)',
                value: 'laaditaan_c_projektiluokka'
            }
        ],
        display: 'basic'
    },
    {
        label: 'Kaavan hyväksyjätaho',
        name: 'kaavan_hyvaksyjataho',
        display: 'basic'
    }, {
        label: 'Onko kiinteistön maanomistajana Helsingin kaupunki',
        name: 'maanomistus_kaupunki',
        display: 'contract',
        choices: [
            {
                value: true,
                label: 'Kyllä'
            },
            {
                value: false,
                label: 'Ei'
            },
            {
                value: null,
                label: 'Ei tietoa'
            }
        ]
    },
    {
        label: 'Onko kiinteistön maanomistajana valtio',
        name: 'maanomistus_valtio',
        display: 'contract',
        choices: [
            {
                value: true,
                label: 'Kyllä'
            },
            {
                value: false,
                label: 'Ei'
            },
            {
                value: null,
                label: 'Ei tietoa'
            }
        ]
    },
    {
        label: 'Onko kiinteistön maanomistajana yksityinen',
        name: 'maanomistus_yksityinen',
        display: 'contract',
        choices: [
            {
                value: true,
                label: 'Kyllä'
            },
            {
                value: false,
                label: 'Ei'
            },
            {
                value: null,
                label: 'Ei tietoa'
            }
        ]
    },
    {
        label: 'Maankäyttösopimuksen tarve on arvioitava',
        name: 'maankayttosopimus_tarve',
        display: 'contract',
        choices: [
            {
                value: true,
                label: 'Kyllä'
            },
            {
                value: false,
                label: 'Ei'
            },
            {
                value: null,
                label: 'Ei tietoa'
            }
        ]
    },
    {
        label: 'Maankäyttösopimusmenettely',
        name: 'maankayttosopimus_menettely',
        display: 'contract',
        choices: [
            {
              label: 'Ei tarvita',
              value: 'ei_tarvita'
            },
            {
              label: 'Tarvitaan (ei valmis)',
              value: 'tarvitaan_ei_valmis'
            },
            {
              label: 'Tarvitaan (esisopimus tehty)',
              value: 'tarvitaan_esisopimus_tehty'
            },
            {
              label: 'Tarvitaan (sopimus allekirjoitettu)',
              value: 'tarvitaan_sopimus_allekirjoitettu'
            }
          ]
    },
    {
        label: 'Strategiakytkentä',
        name: 'strategiset_tavoitteet_17_21',
        display: 'strategy',
        choices: [
            {
              label: '1.1 Asuntotuotannon edistäminen',
              value: '11_asuntotuotannon_edistaminen'
            },
            {
              label: '1.2 Liikkumisen sujuvuus ja kestävät kulkumuodot',
              value: '12_liikkumisen_sujuvuus_ja_kestavat_kulkumuodot'
            },
            {
              label: '1.3 Keskustan elinvoimaisuuden kehittäminen',
              value: '13_keskustan_elinvoimaisuuden_kehittaminen'
            },
            {
              label: '1.4 Moderni ilmastovastuu',
              value: '14_moderni_ilmastovastuu'
            },
            {
              label: '1.5 Elävät, omaleimaiset ja turvalliset kaupunginosat',
              value: '15_elavat_omaleimaiset_ja_turvalliset_kaupungi8b14'
            },
            {
              label: '1.6 Segregaation ehkäisy',
              value: '16_segregaation_ehkaisy'
            },
            {
              label: '2.1 Monipuoliset sijaintipaikat yrityksille',
              value: '21_monipuoliset_sijaintipaikat_yrityksille'
            },
            {
              label: '2.2 Kumppanuus ja osallisuus toimintatapana vahvistuvat',
              value: '22_kumppanuus_ja_osallisuus_toimintatapana_vah0cb8'
            },
            {
              label: '2.3 Hallitusti nopeampaan ja ketterämpään toimintakulttuuriin',
              value: '23_hallitusti_nopeampaan_ja_ketterampaan_toimib9d7'
            },
            {
              label: '2.5 Palveluita uudistetaan asukaslähtöisesti',
              value: '25_palveluita_uudistetaan_asukaslahtoisesti'
            },
            {
              label: '3.1 Omaisuudenhallintaa toteutetaan elinkaaritaloudellisesti',
              value: '31_omaisuudenhallintaa_toteutetaan_elinkaarita50a6'
            },
            {
              label: '3.2 Investointien vaikuttavuus ja oikea-aikaisuus',
              value: '32_investointien_vaikuttavuus_ja_oikea_aikaisuus'
            },
            {
              label: '3.3 Tuottavuuden parantaminen',
              value: '33_tuottavuuden_parantaminen'
            },
            {
              label: '3.4 Kiinteistökannan laadun parantaminen',
              value: '34_kiinteistokannan_laadun_parantaminen'
            },
            {
              label: '4.1 Vahvistetaan kaupungin asemaa metropolialueena',
              value: '41_vahvistetaan_kaupungin_asemaa_metropolialueena'
            }
          ]
    },
    {
        label: 'Asuminen, yhteensä',
        name: 'asuminen_yhteensa',
        display: 'floor-area-information',
        unit: 'k-m2'
    },
    {
        label: 'Toimitila, yhteensä',
        name: 'toimitila_yhteensa',
        display: 'floor-area-information',
        unit: 'k-m2'
    },
    {
        label: 'Julkiset, yhteensä',
        name: 'julkiset_yhteensa',
        display: 'floor-area-information',
        unit: 'k-m2'
    },
    {
        label: 'Muut, yhteensä',
        name: 'muut_yhteensa',
        display: 'floor-area-information',
        unit: 'k-m2'
    },
    {
        label: 'Suunnittelualueen kuvaus',
        name: 'suunnittelualueen_kuvaus',
        display: 'description'
    },
    {
        label: 'Aloituskokouksen päivämäärä',
        name: 'aloituskokous_suunniteltu_pvm',
        display: 'timetable',
        type: 'date'
    },
    {
        label: 'Projektikortin kuva',
        name: 'projektikortin_kuva',
        display: 'photo'
    },
    {

        label: 'Milloin periaatteet-vaiheen esilläolo alkaa',
        name: 'milloin_periaatteet_esillaolo_alkaa',
        display: 'timetable',
        type: 'date'

    },
    {
        label: 'OAS Esilläoloaineiston määräaika',
        name: 'oas_esillaolo_aineiston_maaraaika',
        display: 'timetable',
        type: 'date'
    },
    {
        label: 'Ehdotuksen nähtävilläolo alkaa',
        name: 'milloin_ehdotuksen_nahtavilla_alkaa_pieni',
        display: 'timetable',
        type: 'date'
    },
    {
        label: 'Muutoksenhakutilanne hallinto-oikeudessa',
        name: 'muutoksenhakutilanne_hallinto_oikeus',
        type: 'choice',
        display: 'timetable',
        choices: [
            {
              label: 'Ei tarkistettu',
              value: 'ei_tarkistettu'
            },
            {
              label: 'Valitus hallinto-oikeudessa',
              value: 'valitus_hallinto_oikeudessa'
            },
            {
              label: 'Ei valitusta hallinto-oikeudessa',
              value: 'ei_valitusta_hallinto_oikeudessa'
            },
            {
              label: 'Valitus ratkaistu hallinto-oikeudessa',
              value: 'valitus_ratkaistu_hallinto_oikeudessa'
            }
          ]

    },
    {
        label: 'Muutoksenhakutilanne korkeimmassa hallinto-oikeudessa',
        name: 'muutoksenhakutilanne_kho',
        type: 'choice',
        display: 'timetable',
        choices: [
            {
              label: 'Ei tarkistettu',
              value: 'ei_tarkistettu'
            },
            {
              label: 'Haettu valituslupaa korkeimmasta hallinto-oikeudesta',
              value: 'haettu_valituslupaa_korkeimmasta_hallinto_oikeb7fd'
            },
            {
              label: 'Valitus korkeimmassa hallinto-oikeudessa',
              value: 'valitus_korkeimmassa_hallinto_oikeudessa'
            },
            {
              label: 'Ei valitusta korkeimmassa hallinto-oikeudessa',
              value: 'ei_valitusta_korkeimmassa_hallinto_oikeudessa'
            },
            {
              label: 'Valitus ratkaistu korkeimmassa hallinto-oikeudessa',
              value: 'valitus_ratkaistu_korkeimmassa_hallinto_oikeudessa'
            }
          ]

        },
        {
            label: 'Vastuuhenkilö',
            name: 'vastuuhenkilo',
            type: 'string',
            display: 'contact'
        },
        {
            label: 'Vastuuyksikkö tai -tiimi',
            name: 'vastuuyksikko',
            display: 'contact',
            type: 'choice',
            choices: [
                {
                  label: 'Asemakaavakoordinointiyksikkö ',
                  value: 'asemakaavakoordinointiyksikko'
                },
                {
                  label: 'Asemakaavaprosessitiimi',
                  value: 'asemakaavaprosessitiimi'
                },
                {
                  label: 'Eteläinen alueyksikkö',
                  value: 'etelainen_alueyksikko'
                },
                {
                  label: 'Itäinen alueyksikkö',
                  value: 'itainen_alueyksikko'
                },
                {
                  label: 'Itäinen täydennysrakentaminen',
                  value: 'itainen_taydennysrakentaminen'
                },
                {
                  label: 'Kaarela-Vihdintie -tiimi',
                  value: 'kaarela_vihdintie_tiimi'
                },
                {
                  label: 'Kalasatama-Malmi tiimi',
                  value: 'kalasatama_malmi_tiimi'
                },
                {
                  label: 'Kantakaupunkitiimi',
                  value: 'kantakaupunkitiimi'
                },
                {
                  label: 'Kaupunkiuudistustiimi',
                  value: 'kaupunkiuudistustiimi'
                },
                {
                  label: 'Keskustatiimi',
                  value: 'keskustatiimi'
                },
                {
                  label: 'Koivusaari-Lauttasaari -tiimi',
                  value: 'koivusaari_lauttasaari_tiimi'
                },
                {
                  label: 'Kruunuvuorenranta-Vartiosaari -tiimi',
                  value: 'kruunuvuorenranta_vartiosaari_tiimi'
                },
                {
                  label: 'Länsisatamatiimi',
                  value: 'lansisatamatiimi'
                },
                {
                  label: 'Läntinen alueyksikkö',
                  value: 'lantinen_alueyksikko'
                },
                {
                  label: 'Läntinen täydennysrakentaminen',
                  value: 'lantinen_taydennysrakentaminen'
                },
                {
                  label: 'Pasila-tiimi',
                  value: 'pasila_tiimi'
                },
                {
                  label: 'Pohjoinen alueyksikkö',
                  value: 'pohjoinen_alueyksikko'
                },
                {
                  label: 'Pohjoinen täydennysrakentaminen',
                  value: 'pohjoinen_taydennysrakentaminen'
                },
                {
                  label: 'Vuosaari-Vartiokylänlahti -tiimi',
                  value: 'vuosaari_vartiokylanlahti_tiimi'
                }
              ]

        },
        {
            label: 'Suunnittelualueen rajaus',
            value: 'suunnittelualueen_rajaus',
            display: 'geometry'
        },
        {
        label: 'Kaava on tullut voimaan',
        name: 'voimaantulo_pvm',
        display: 'timetable',
        type: 'date'
        }

    ]
