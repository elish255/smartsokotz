export type Region = { name: string; districts: string[]; minimumFee: number; districtMinimums?: Record<string, number> };

// Dar es Salaam is deliberately first. Delivery uses offline district/region estimates from Kariakoo.
// Rate is TZS 2,000 per estimated kilometre.
export const TANZANIA_REGIONS: Region[] = [
  { name: "Dar es Salaam", minimumFee: 5000, districtMinimums: { Ilala: 5000, Kinondoni: 7000, Temeke: 10000, Ubungo: 7000, Kigamboni: 12000 }, districts: ["Ilala", "Kinondoni", "Temeke", "Ubungo", "Kigamboni"] },
  { name: "Arusha", minimumFee: 15000, districts: ["Arusha City", "Arumeru", "Karatu", "Longido", "Monduli", "Ngorongoro"] },
  { name: "Dodoma", minimumFee: 15000, districts: ["Bahi", "Chamwino", "Chemba", "Dodoma City", "Kondoa", "Kongwa", "Mpwapwa"] },
  { name: "Geita", minimumFee: 25000, districts: ["Bukombe", "Chato", "Geita", "Mbogwe", "Nyang'hwale"] },
  { name: "Iringa", minimumFee: 22000, districts: ["Iringa Municipal", "Iringa District", "Kilolo", "Mafinga Town", "Mufindi"] },
  { name: "Kagera", minimumFee: 30000, districts: ["Biharamulo", "Bukoba Municipal", "Bukoba District", "Karagwe", "Kyerwa", "Muleba", "Ngara"] },
  { name: "Katavi", minimumFee: 35000, districts: ["Mlele", "Mpanda Municipal", "Nsimbo", "Tanganyika"] },
  { name: "Kigoma", minimumFee: 35000, districts: ["Buhigwe", "Kakonko", "Kasulu District", "Kasulu Town", "Kibondo", "Kigoma District", "Kigoma-Ujiji", "Uvinza"] },
  { name: "Kilimanjaro", minimumFee: 22000, districts: ["Hai", "Moshi District", "Moshi Municipal", "Mwanga", "Rombo", "Same", "Siha"] },
  { name: "Lindi", minimumFee: 30000, districts: ["Kilwa", "Lindi District", "Lindi Municipal", "Liwale", "Nachingwea", "Ruangwa"] },
  { name: "Manyara", minimumFee: 25000, districts: ["Babati District", "Babati Town", "Hanang", "Kiteto", "Mbulu", "Simanjiro"] },
  { name: "Mara", minimumFee: 30000, districts: ["Bunda", "Butiama", "Musoma District", "Musoma Municipal", "Rorya", "Serengeti", "Tarime District", "Tarime Town"] },
  { name: "Mbeya", minimumFee: 28000, districts: ["Chunya", "Kyela", "Mbarali", "Mbeya City", "Mbeya District", "Rungwe", "Busokelo"] },
  { name: "Morogoro", minimumFee: 18000, districts: ["Gairo", "Kilombero", "Kilosa", "Malinyi", "Morogoro Municipal", "Morogoro District", "Mvomero", "Ulanga"] },
  { name: "Mtwara", minimumFee: 32000, districts: ["Masasi District", "Masasi Town", "Mtwara District", "Mtwara Municipal", "Nanyumbu", "Newala District", "Newala Town", "Tandahimba"] },
  { name: "Mwanza", minimumFee: 26000, districts: ["Ilemela", "Kwimba", "Magu", "Misungwi", "Nyamagana", "Sengerema", "Ukerewe"] },
  { name: "Njombe", minimumFee: 30000, districts: ["Ludewa", "Makambako Town", "Makete", "Njombe District", "Njombe Town", "Wanging'ombe"] },
  { name: "Pwani", minimumFee: 15000, districts: ["Bagamoyo", "Chalinze", "Kibaha District", "Kibaha Town", "Kisarawe", "Mafia", "Mkuranga", "Rufiji"] },
  { name: "Rukwa", minimumFee: 38000, districts: ["Kalambo", "Nkasi", "Sumbawanga District", "Sumbawanga Municipal"] },
  { name: "Ruvuma", minimumFee: 34000, districts: ["Mbinga District", "Mbinga Town", "Namtumbo", "Nyasa", "Songea District", "Songea Municipal", "Tunduru"] },
  { name: "Shinyanga", minimumFee: 28000, districts: ["Bariadi", "Busega", "Maswa", "Shinyanga District", "Shinyanga Municipal", "Kishapu"] },
  { name: "Simiyu", minimumFee: 30000, districts: ["Bariadi District", "Bariadi Town", "Busega", "Itilima", "Meatu", "Maswa"] },
  { name: "Singida", minimumFee: 30000, districts: ["Ikungi", "Iramba", "Manyoni", "Mkalama", "Singida District", "Singida Municipal"] },
  { name: "Songwe", minimumFee: 32000, districts: ["Ileje", "Mbozi", "Momba", "Songwe"] },
  { name: "Tabora", minimumFee: 34000, districts: ["Igunga", "Kaliua", "Nzega District", "Nzega Town", "Sikonge", "Tabora Municipal", "Urambo", "Uyui"] },
  { name: "Tanga", minimumFee: 26000, districts: ["Bumbuli", "Handeni District", "Handeni Town", "Kilindi", "Korogwe District", "Korogwe Town", "Lushoto", "Mkinga", "Muheza", "Pangani", "Tanga City"] },
  { name: "Zanzibar North", minimumFee: 45000, districts: ["Kaskazini A", "Kaskazini B"] },
  { name: "Zanzibar South", minimumFee: 45000, districts: ["Kati"] },
  { name: "Zanzibar Urban/West", minimumFee: 42000, districts: ["Magharibi A", "Magharibi B", "Mjini"] },
  { name: "Pemba North", minimumFee: 48000, districts: ["Wete", "Micheweni"] },
  { name: "Pemba South", minimumFee: 48000, districts: ["Chake Chake", "Mkoani"] },
];

export function getRegion(name: string) { return TANZANIA_REGIONS.find(r => r.name === name); }
