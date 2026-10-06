/* Catálogo por defecto — generado desde "Calculo canalizaciones de telecomunicaciones REV1.xlsx".
   Los administradores lo modifican desde admin.html (los cambios se guardan aparte). */
window.DEFAULT_CATALOG = {
 "version": "1.1",
 "updated": "2026-10-06",
 "fillOptions": [
  {
   "value": 0.25,
   "label": "(estándar inicial de diseño; recomendado por TIA-569-E) / (initial design standard; recommended by TIA-569-E)"
  },
  {
   "value": 0.3,
   "label": "(Canalización al 60% de llenado) / (Pathway at 60% filling)"
  },
  {
   "value": 0.4,
   "label": "(Poco crecimiento futuro, canalización al 80% de llenado) / (reduced future growth, pathway at 80% filling)"
  },
  {
   "value": 0.5,
   "label": "(SIN crecimiento futuro, canalización al 100% de llenado) / (NO future growth, pathway at 100% filling)"
  }
 ],
 "cableMedia": [
  {
   "id": "utp",
   "name": "U/UTP - F/UTP",
   "short": "UTP",
   "allowInConduit": true,
   "cables": [
    {
     "name": "U/UTP Cat 5e",
     "od_in": 0.189
    },
    {
     "name": "U/UTP Cat 6",
     "od_in": 0.243
    },
    {
     "name": "U/UTP Cat 6a",
     "od_in": 0.245
    },
    {
     "name": "F/UTP Cat 5e",
     "od_in": 0.272
    },
    {
     "name": "F/UTP Cat 6",
     "od_in": 0.28
    },
    {
     "name": "F/UTP Cat 6a",
     "od_in": 0.303
    }
   ]
  },
  {
   "id": "fo_in",
   "name": "FO MM - SM Indoor",
   "short": "F.O. IN",
   "allowInConduit": true,
   "cables": [
    {
     "name": "6 hilos",
     "od_in": 0.18
    },
    {
     "name": "12 hilos",
     "od_in": 0.23
    },
    {
     "name": "24 hilos",
     "od_in": 0.3
    },
    {
     "name": "48 hilos",
     "od_in": 0.66
    },
    {
     "name": "72 hilos",
     "od_in": 0.79
    },
    {
     "name": "96 hilos",
     "od_in": 0.91
    },
    {
     "name": "144 hilos",
     "od_in": 0.89
    }
   ]
  },
  {
   "id": "fo_inout",
   "name": "FO MM - SM Indoor/Outdoor",
   "short": "F.O. IN/OUT",
   "allowInConduit": true,
   "cables": [
    {
     "name": "6 hilos",
     "od_in": 0.24
    },
    {
     "name": "12 hilos",
     "od_in": 0.28
    },
    {
     "name": "24 hilos",
     "od_in": 0.32
    },
    {
     "name": "48 hilos",
     "od_in": 0.66
    },
    {
     "name": "72 hilos",
     "od_in": 0.8
    },
    {
     "name": "96 hilos",
     "od_in": 0.95
    },
    {
     "name": "144 hilos",
     "od_in": 1.02
    }
   ]
  },
  {
   "id": "coax",
   "name": "Coaxial",
   "short": "Coaxial",
   "allowInConduit": true,
   "cables": [
    {
     "name": "RG-6",
     "od_in": 0.272
    },
    {
     "name": "RG-6Q",
     "od_in": 0.3
    }
   ]
  },
  {
   "id": "multipar",
   "name": "Multipar telefónico / Multipair",
   "short": "Multipar",
   "allowInConduit": true,
   "cables": [
    {
     "name": "25 pares",
     "od_in": 0.355
    },
    {
     "name": "50 pares",
     "od_in": 0.51
    },
    {
     "name": "100 pares",
     "od_in": 0.685
    }
   ]
  },
  {
   "id": "innerduct",
   "name": "Innerduct",
   "short": "Innerduct",
   "allowInConduit": false,
   "cables": [
    {
     "name": "0.75\"",
     "od_in": 1.075
    },
    {
     "name": "1\"",
     "od_in": 1.34
    },
    {
     "name": "1 1/2\"",
     "od_in": 1.93
    },
    {
     "name": "2\"",
     "od_in": 2.4
    }
   ]
  }
 ],
 "pathwayTypes": [
  {
   "id": "canasta",
   "name": "Canasta / Wire mesh",
   "usableFactor": 0.5,
   "basis": "ANSI/TIA-569-E 9.7.1.1 y BICSI TDMM 14: 50 % del área útil como máximo"
  },
  {
   "id": "aeroducto",
   "name": "Aeroducto / Metal wireway",
   "usableFactor": 0.2,
   "basis": "NEC 2020 Art. 376.22(A): 20 % del área"
  },
  {
   "id": "escalera",
   "name": "Escalera / Ladder tray",
   "usableFactor": 0.5,
   "basis": "ANSI/TIA-569-E 9.7.1.1 y BICSI TDMM 14"
  },
  {
   "id": "fibra",
   "name": "Ducto para fibra / Fiber duct",
   "usableFactor": 0.5,
   "basis": "Panduit FiberRunner"
  }
 ],
 "pathwayProducts": [
  {
   "id": "canasta-panduit-1",
   "typeId": "canasta",
   "brand": "Panduit",
   "label": "2\"(50mm) X 4\"(100mm)",
   "partNumber": "PWB2X4˜",
   "width_mm": 100,
   "height_mm": 50,
   "totalArea_mm2": 5000
  },
  {
   "id": "canasta-panduit-2",
   "typeId": "canasta",
   "brand": "Panduit",
   "label": "2\"(50mm) X 6\"(150mm)",
   "partNumber": "PWB2X6˜",
   "width_mm": 150,
   "height_mm": 50,
   "totalArea_mm2": 7500
  },
  {
   "id": "canasta-panduit-3",
   "typeId": "canasta",
   "brand": "Panduit",
   "label": "4\"(100mm) X 4\"(100mm)",
   "partNumber": "PWB4X4˜",
   "width_mm": 100,
   "height_mm": 100,
   "totalArea_mm2": 10000
  },
  {
   "id": "canasta-panduit-4",
   "typeId": "canasta",
   "brand": "Panduit",
   "label": "4\"(100mm) X 6\"(150mm)",
   "partNumber": "PWB4X6˜",
   "width_mm": 150,
   "height_mm": 100,
   "totalArea_mm2": 15000
  },
  {
   "id": "canasta-panduit-5",
   "typeId": "canasta",
   "brand": "Panduit",
   "label": "2\"(50mm) X 12\"(300mm)",
   "partNumber": "PWB2X12˜",
   "width_mm": 300,
   "height_mm": 50,
   "totalArea_mm2": 15000
  },
  {
   "id": "canasta-panduit-6",
   "typeId": "canasta",
   "brand": "Panduit",
   "label": "2\"(50mm) X 18\"(450mm)",
   "partNumber": "PWB2X18˜",
   "width_mm": 450,
   "height_mm": 50,
   "totalArea_mm2": 22500
  },
  {
   "id": "canasta-panduit-7",
   "typeId": "canasta",
   "brand": "Panduit",
   "label": "4\"(100mm) X 12\"(300mm)",
   "partNumber": "PWB4X12˜",
   "width_mm": 300,
   "height_mm": 100,
   "totalArea_mm2": 30000
  },
  {
   "id": "canasta-panduit-8",
   "typeId": "canasta",
   "brand": "Panduit",
   "label": "2\"(50mm) X 24\"(600mm)",
   "partNumber": "PWB2X24˜",
   "width_mm": 600,
   "height_mm": 50,
   "totalArea_mm2": 30000
  },
  {
   "id": "canasta-panduit-9",
   "typeId": "canasta",
   "brand": "Panduit",
   "label": "4\"(100mm) X 18\"(450mm)",
   "partNumber": "PWB4X18˜",
   "width_mm": 450,
   "height_mm": 100,
   "totalArea_mm2": 45000
  },
  {
   "id": "canasta-panduit-10",
   "typeId": "canasta",
   "brand": "Panduit",
   "label": "4\"(100mm) X 24\"(600mm)",
   "partNumber": "PWB4X24˜",
   "width_mm": 600,
   "height_mm": 100,
   "totalArea_mm2": 60000
  },
  {
   "id": "canasta-cablofil-1",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "1\"(30mm) X 2\"(50mm)",
   "partNumber": "CF30/50",
   "width_mm": 50,
   "height_mm": 30,
   "totalArea_mm2": 1400.0
  },
  {
   "id": "canasta-cablofil-2",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "2\"(54mm) X 2\"(50mm)",
   "partNumber": "CF54/50",
   "width_mm": 50,
   "height_mm": 54,
   "totalArea_mm2": 2599.99
  },
  {
   "id": "canasta-cablofil-3",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "1\"(30mm) X 4\"(100mm)",
   "partNumber": "CF30/100",
   "width_mm": 100,
   "height_mm": 30,
   "totalArea_mm2": 2799.99
  },
  {
   "id": "canasta-cablofil-4",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "1\"(30mm) X 6\"(150mm)",
   "partNumber": "CF30/150",
   "width_mm": 150,
   "height_mm": 30,
   "totalArea_mm2": 4199.99
  },
  {
   "id": "canasta-cablofil-5",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "2\"(54mm) X 4\"(100mm)",
   "partNumber": "CF54/100",
   "width_mm": 100,
   "height_mm": 54,
   "totalArea_mm2": 5199.99
  },
  {
   "id": "canasta-cablofil-6",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "1\"(30mm) X 8\"(200mm)",
   "partNumber": "CF30/200",
   "width_mm": 200,
   "height_mm": 30,
   "totalArea_mm2": 5599.99
  },
  {
   "id": "canasta-cablofil-7",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "2\"(54mm) X 6\"(150mm)",
   "partNumber": "CF54/150",
   "width_mm": 150,
   "height_mm": 54,
   "totalArea_mm2": 7799.98
  },
  {
   "id": "canasta-cablofil-8",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "1\"(30mm) X 12\"(300mm)",
   "partNumber": "CF30/300",
   "width_mm": 300,
   "height_mm": 30,
   "totalArea_mm2": 8399.98
  },
  {
   "id": "canasta-cablofil-9",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "4\"(105mm) X 4\"(100mm)",
   "partNumber": "CF105/100",
   "width_mm": 100,
   "height_mm": 105,
   "totalArea_mm2": 10303.21
  },
  {
   "id": "canasta-cablofil-10",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "2\"(54mm) X 8\"(200mm)",
   "partNumber": "CF54/200",
   "width_mm": 200,
   "height_mm": 54,
   "totalArea_mm2": 10399.98
  },
  {
   "id": "canasta-cablofil-11",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "4\"(105mm) X 6\"(150mm)",
   "partNumber": "CF105/150",
   "width_mm": 150,
   "height_mm": 105,
   "totalArea_mm2": 15451.58
  },
  {
   "id": "canasta-cablofil-12",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "2\"(54mm) X 12\"(300mm)",
   "partNumber": "CF54/300",
   "width_mm": 300,
   "height_mm": 54,
   "totalArea_mm2": 15599.97
  },
  {
   "id": "canasta-cablofil-13",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "4\"(105mm) X 8\"(200mm)",
   "partNumber": "CF105/200",
   "width_mm": 200,
   "height_mm": 105,
   "totalArea_mm2": 20599.96
  },
  {
   "id": "canasta-cablofil-14",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "2\"(54mm) X 16\"(400mm)",
   "partNumber": "CF54/400",
   "width_mm": 400,
   "height_mm": 54,
   "totalArea_mm2": 20799.96
  },
  {
   "id": "canasta-cablofil-15",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "6\"(150mm) X 6\"(150mm)",
   "partNumber": "CF150/150",
   "width_mm": 150,
   "height_mm": 150,
   "totalArea_mm2": 22199.96
  },
  {
   "id": "canasta-cablofil-16",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "2\"(54mm) X 18\"(450mm)",
   "partNumber": "CF54/450",
   "width_mm": 450,
   "height_mm": 54,
   "totalArea_mm2": 23399.95
  },
  {
   "id": "canasta-cablofil-17",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "2\"(54mm) X 20\"(500mm)",
   "partNumber": "CF54/500",
   "width_mm": 500,
   "height_mm": 54,
   "totalArea_mm2": 25999.95
  },
  {
   "id": "canasta-cablofil-18",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "6\"(150mm) X 8\"(200mm)",
   "partNumber": "CF150/200",
   "width_mm": 200,
   "height_mm": 150,
   "totalArea_mm2": 29599.94
  },
  {
   "id": "canasta-cablofil-19",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "4\"(105mm) X 12\"(300mm)",
   "partNumber": "CF105/300",
   "width_mm": 300,
   "height_mm": 105,
   "totalArea_mm2": 30903.16
  },
  {
   "id": "canasta-cablofil-20",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "2\"(54mm) X 24\"(600mm)",
   "partNumber": "CF54/600",
   "width_mm": 600,
   "height_mm": 54,
   "totalArea_mm2": 31199.94
  },
  {
   "id": "canasta-cablofil-21",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "4\"(105mm) X 16\"(400mm)",
   "partNumber": "CF105/400",
   "width_mm": 400,
   "height_mm": 105,
   "totalArea_mm2": 41199.92
  },
  {
   "id": "canasta-cablofil-22",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "6\"(150mm) X 12\"(300mm)",
   "partNumber": "CF150/300",
   "width_mm": 300,
   "height_mm": 150,
   "totalArea_mm2": 44399.91
  },
  {
   "id": "canasta-cablofil-23",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "4\"(105mm) X 18\"(450mm)",
   "partNumber": "CF105/450",
   "width_mm": 450,
   "height_mm": 105,
   "totalArea_mm2": 46348.29
  },
  {
   "id": "canasta-cablofil-24",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "4\"(105mm) X 20\"(500mm)",
   "partNumber": "CF105/500",
   "width_mm": 500,
   "height_mm": 105,
   "totalArea_mm2": 51503.12
  },
  {
   "id": "canasta-cablofil-25",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "6\"(150mm) X 16\"(400mm)",
   "partNumber": "CF150/400",
   "width_mm": 400,
   "height_mm": 150,
   "totalArea_mm2": 59199.88
  },
  {
   "id": "canasta-cablofil-26",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "4\"(105mm) X 24\"(600mm)",
   "partNumber": "CF105/600",
   "width_mm": 600,
   "height_mm": 105,
   "totalArea_mm2": 61799.88
  },
  {
   "id": "canasta-cablofil-27",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "6\"(150mm) X 18\"(450mm)",
   "partNumber": "CF150/450",
   "width_mm": 450,
   "height_mm": 150,
   "totalArea_mm2": 66599.87
  },
  {
   "id": "canasta-cablofil-28",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "6\"(150mm) X 20\"(500mm)",
   "partNumber": "CF150/500",
   "width_mm": 500,
   "height_mm": 150,
   "totalArea_mm2": 73999.85
  },
  {
   "id": "canasta-cablofil-29",
   "typeId": "canasta",
   "brand": "Cablofil",
   "label": "6\"(150mm) X 24\"(600mm)",
   "partNumber": "CF150/600",
   "width_mm": 600,
   "height_mm": 150,
   "totalArea_mm2": 88799.82
  },
  {
   "id": "aeroducto-genérico-1",
   "typeId": "aeroducto",
   "brand": "Genérico",
   "label": "Aeroducto / Metal wireway 2,5\"X2,5\"",
   "partNumber": "",
   "width_mm": 63.5,
   "height_mm": 63.5,
   "totalArea_mm2": 4032.25
  },
  {
   "id": "aeroducto-genérico-2",
   "typeId": "aeroducto",
   "brand": "Genérico",
   "label": "Aeroducto / Metal wireway 3\"X3\"",
   "partNumber": "",
   "width_mm": 76.2,
   "height_mm": 76.2,
   "totalArea_mm2": 5806.44
  },
  {
   "id": "aeroducto-genérico-3",
   "typeId": "aeroducto",
   "brand": "Genérico",
   "label": "Aeroducto / Wireway 4\"X4\"",
   "partNumber": "",
   "width_mm": 101.6,
   "height_mm": 101.6,
   "totalArea_mm2": 10322.56
  },
  {
   "id": "aeroducto-genérico-4",
   "typeId": "aeroducto",
   "brand": "Genérico",
   "label": "Aeroducto / Wireway 6\"X6\"",
   "partNumber": "",
   "width_mm": 152.4,
   "height_mm": 152.4,
   "totalArea_mm2": 23225.76
  },
  {
   "id": "escalera-genérico-1",
   "typeId": "escalera",
   "brand": "Genérico",
   "label": "Escalera / Ladder tray 100mm (4\")",
   "partNumber": "",
   "width_mm": 100,
   "height_mm": 150,
   "totalArea_mm2": 15000
  },
  {
   "id": "escalera-genérico-2",
   "typeId": "escalera",
   "brand": "Genérico",
   "label": "Escalera / Ladder tray 150mm (6\")",
   "partNumber": "",
   "width_mm": 150,
   "height_mm": 150,
   "totalArea_mm2": 22500
  },
  {
   "id": "escalera-genérico-3",
   "typeId": "escalera",
   "brand": "Genérico",
   "label": "Escalera / Ladder tray 230mm (9\")",
   "partNumber": "",
   "width_mm": 230,
   "height_mm": 150,
   "totalArea_mm2": 34500
  },
  {
   "id": "escalera-genérico-4",
   "typeId": "escalera",
   "brand": "Genérico",
   "label": "Escalera / Ladder tray 300mm (12\")",
   "partNumber": "",
   "width_mm": 300,
   "height_mm": 150,
   "totalArea_mm2": 45000
  },
  {
   "id": "escalera-genérico-5",
   "typeId": "escalera",
   "brand": "Genérico",
   "label": "Escalera / Ladder tray 380mm (15\")",
   "partNumber": "",
   "width_mm": 380,
   "height_mm": 150,
   "totalArea_mm2": 57000
  },
  {
   "id": "escalera-genérico-6",
   "typeId": "escalera",
   "brand": "Genérico",
   "label": "Escalera / Ladder tray 460mm (18\")",
   "partNumber": "",
   "width_mm": 460,
   "height_mm": 150,
   "totalArea_mm2": 69000
  },
  {
   "id": "escalera-genérico-7",
   "typeId": "escalera",
   "brand": "Genérico",
   "label": "Escalera / Ladder tray 610mm (24\")",
   "partNumber": "",
   "width_mm": 610,
   "height_mm": 150,
   "totalArea_mm2": 91500
  },
  {
   "id": "fibra-panduit-1",
   "typeId": "fibra",
   "brand": "Panduit",
   "label": "FiberRunner 2\" X 2\"",
   "partNumber": "HS2X2YL6NM",
   "width_mm": 50.8,
   "height_mm": 50.8,
   "totalArea_mm2": 2195
  },
  {
   "id": "fibra-panduit-2",
   "typeId": "fibra",
   "brand": "Panduit",
   "label": "FiberRunner 4\" X 4\"",
   "partNumber": "FR4X4YL6",
   "width_mm": 101.6,
   "height_mm": 101.6,
   "totalArea_mm2": 11354
  },
  {
   "id": "fibra-panduit-3",
   "typeId": "fibra",
   "brand": "Panduit",
   "label": "FiberRunner 6\" X 4\"",
   "partNumber": "FR6X4YL6",
   "width_mm": 152.4,
   "height_mm": 101.6,
   "totalArea_mm2": 15354
  },
  {
   "id": "fibra-panduit-4",
   "typeId": "fibra",
   "brand": "Panduit",
   "label": "FiberRunner 12\" X 4\"",
   "partNumber": "FR12X4YL6",
   "width_mm": 304.8,
   "height_mm": 101.6,
   "totalArea_mm2": 32903
  },
  {
   "id": "fibra-panduit-5",
   "typeId": "fibra",
   "brand": "Panduit",
   "label": "FiberRunner 24\" X 4\"",
   "partNumber": "FR24X4YL10",
   "width_mm": 609.6,
   "height_mm": 101.6,
   "totalArea_mm2": 63613
  }
 ],
 "conduitTypes": [
  {
   "id": "EMT",
   "name": "Electrical Metal Tubing (EMT)",
   "minSize": 0.75,
   "enabled": true,
   "sizes": [
    {
     "trade": 0.5,
     "id_in": 0.622
    },
    {
     "trade": 0.75,
     "id_in": 0.824
    },
    {
     "trade": 1,
     "id_in": 1.049
    },
    {
     "trade": 1.25,
     "id_in": 1.38
    },
    {
     "trade": 1.5,
     "id_in": 1.61
    },
    {
     "trade": 2,
     "id_in": 2.067
    },
    {
     "trade": 2.5,
     "id_in": 2.731
    },
    {
     "trade": 3,
     "id_in": 3.356
    },
    {
     "trade": 3.5,
     "id_in": 3.834
    },
    {
     "trade": 4,
     "id_in": 4.334
    }
   ]
  },
  {
   "id": "IMC",
   "name": "Intermediate Metal Conduit (IMC)",
   "minSize": 0.75,
   "enabled": true,
   "sizes": [
    {
     "trade": 0.5,
     "id_in": 0.66
    },
    {
     "trade": 0.75,
     "id_in": 0.864
    },
    {
     "trade": 1,
     "id_in": 1.105
    },
    {
     "trade": 1.25,
     "id_in": 1.448
    },
    {
     "trade": 1.5,
     "id_in": 1.683
    },
    {
     "trade": 2,
     "id_in": 2.15
    },
    {
     "trade": 2.5,
     "id_in": 2.557
    },
    {
     "trade": 3,
     "id_in": 3.176
    },
    {
     "trade": 3.5,
     "id_in": 3.671
    },
    {
     "trade": 4,
     "id_in": 4.166
    }
   ]
  },
  {
   "id": "RMC",
   "name": "Rigid Metal Conduit (RMC)",
   "minSize": 0.75,
   "enabled": true,
   "sizes": [
    {
     "trade": 0.5,
     "id_in": 0.632
    },
    {
     "trade": 0.75,
     "id_in": 0.836
    },
    {
     "trade": 1,
     "id_in": 1.063
    },
    {
     "trade": 1.25,
     "id_in": 1.394
    },
    {
     "trade": 1.5,
     "id_in": 1.624
    },
    {
     "trade": 2,
     "id_in": 2.083
    },
    {
     "trade": 2.5,
     "id_in": 2.489
    },
    {
     "trade": 3,
     "id_in": 3.09
    },
    {
     "trade": 3.5,
     "id_in": 3.57
    },
    {
     "trade": 4,
     "id_in": 4.05
    },
    {
     "trade": 5,
     "id_in": 5.073
    },
    {
     "trade": 6,
     "id_in": 6.093
    }
   ]
  },
  {
   "id": "RNC40",
   "name": "Rigid PVC Conduit (RNC) Sch 40 & HDPE",
   "minSize": 0.75,
   "enabled": true,
   "sizes": [
    {
     "trade": 0.5,
     "id_in": 0.602
    },
    {
     "trade": 0.75,
     "id_in": 0.804
    },
    {
     "trade": 1,
     "id_in": 1.029
    },
    {
     "trade": 1.25,
     "id_in": 1.36
    },
    {
     "trade": 1.5,
     "id_in": 1.59
    },
    {
     "trade": 2,
     "id_in": 2.047
    },
    {
     "trade": 2.5,
     "id_in": 2.445
    },
    {
     "trade": 3,
     "id_in": 3.042
    },
    {
     "trade": 3.5,
     "id_in": 3.521
    },
    {
     "trade": 4,
     "id_in": 3.998
    },
    {
     "trade": 5,
     "id_in": 5.016
    },
    {
     "trade": 6,
     "id_in": 6.031
    }
   ]
  },
  {
   "id": "RNC80",
   "name": "Rigid PVC Conduit (RNC) Sch 80",
   "minSize": 0.75,
   "enabled": true,
   "sizes": [
    {
     "trade": 0.5,
     "id_in": 0.526
    },
    {
     "trade": 0.75,
     "id_in": 0.722
    },
    {
     "trade": 1,
     "id_in": 0.936
    },
    {
     "trade": 1.25,
     "id_in": 1.255
    },
    {
     "trade": 1.5,
     "id_in": 1.476
    },
    {
     "trade": 2,
     "id_in": 1.913
    },
    {
     "trade": 2.5,
     "id_in": 2.29
    },
    {
     "trade": 3,
     "id_in": 2.864
    },
    {
     "trade": 3.5,
     "id_in": 3.326
    },
    {
     "trade": 4,
     "id_in": 3.786
    },
    {
     "trade": 5,
     "id_in": 4.768
    },
    {
     "trade": 6,
     "id_in": 5.709
    }
   ]
  },
  {
   "id": "FMC",
   "name": "Flexible Metal Conduit (FMC)",
   "minSize": 0.75,
   "enabled": true,
   "sizes": [
    {
     "trade": 0.375,
     "id_in": 0.384
    },
    {
     "trade": 0.5,
     "id_in": 0.635
    },
    {
     "trade": 0.75,
     "id_in": 0.824
    },
    {
     "trade": 1,
     "id_in": 1.02
    },
    {
     "trade": 1.25,
     "id_in": 1.275
    },
    {
     "trade": 1.5,
     "id_in": 1.538
    },
    {
     "trade": 2,
     "id_in": 2.04
    },
    {
     "trade": 2.5,
     "id_in": 2.5
    },
    {
     "trade": 3,
     "id_in": 3
    },
    {
     "trade": 3.5,
     "id_in": 3.5
    },
    {
     "trade": 4,
     "id_in": 4
    }
   ]
  },
  {
   "id": "RNCA",
   "name": "Type A Rigid PVC Conduit (RNC)",
   "minSize": 0.75,
   "enabled": false,
   "sizes": [
    {
     "trade": 0.5,
     "id_in": 0.7
    },
    {
     "trade": 0.75,
     "id_in": 0.91
    },
    {
     "trade": 1,
     "id_in": 1.175
    },
    {
     "trade": 1.25,
     "id_in": 1.5
    },
    {
     "trade": 1.5,
     "id_in": 1.72
    },
    {
     "trade": 2,
     "id_in": 2.155
    },
    {
     "trade": 2.5,
     "id_in": 2.635
    },
    {
     "trade": 3,
     "id_in": 3.23
    },
    {
     "trade": 3.5,
     "id_in": 3.69
    },
    {
     "trade": 4,
     "id_in": 4.18
    }
   ]
  },
  {
   "id": "RNCEB",
   "name": "Type EB PVC Conduit (RNC)",
   "minSize": 2,
   "enabled": false,
   "sizes": [
    {
     "trade": 2,
     "id_in": 2.221
    },
    {
     "trade": 3,
     "id_in": 3.33
    },
    {
     "trade": 3.5,
     "id_in": 3.804
    },
    {
     "trade": 4,
     "id_in": 4.289
    },
    {
     "trade": 5,
     "id_in": 5.316
    },
    {
     "trade": 6,
     "id_in": 6.336
    }
   ]
  },
  {
   "id": "ENT",
   "name": "Electrical Nonmetallic Tubing (ENT)",
   "minSize": 0.75,
   "enabled": false,
   "sizes": [
    {
     "trade": 0.5,
     "id_in": 0.56
    },
    {
     "trade": 0.75,
     "id_in": 0.76
    },
    {
     "trade": 1,
     "id_in": 1
    },
    {
     "trade": 1.25,
     "id_in": 1.34
    },
    {
     "trade": 1.5,
     "id_in": 1.57
    },
    {
     "trade": 2,
     "id_in": 2.02
    }
   ]
  },
  {
   "id": "LFMC",
   "name": "Liquidtight Flexible Metal (LFMC)",
   "minSize": 0.75,
   "enabled": false,
   "sizes": [
    {
     "trade": 0.375,
     "id_in": 0.494
    },
    {
     "trade": 0.5,
     "id_in": 0.632
    },
    {
     "trade": 0.75,
     "id_in": 0.83
    },
    {
     "trade": 1,
     "id_in": 1.054
    },
    {
     "trade": 1.25,
     "id_in": 1.395
    },
    {
     "trade": 1.5,
     "id_in": 1.588
    },
    {
     "trade": 2,
     "id_in": 2.033
    },
    {
     "trade": 2.5,
     "id_in": 2.493
    },
    {
     "trade": 3,
     "id_in": 3.085
    },
    {
     "trade": 3.5,
     "id_in": 3.52
    },
    {
     "trade": 4,
     "id_in": 4.02
    }
   ]
  },
  {
   "id": "LFNCA",
   "name": "Liquidtight Flexible Nonmetallic (LFNC-A)",
   "minSize": 0.75,
   "enabled": false,
   "sizes": [
    {
     "trade": 0.375,
     "id_in": 0.495
    },
    {
     "trade": 0.5,
     "id_in": 0.63
    },
    {
     "trade": 0.75,
     "id_in": 0.825
    },
    {
     "trade": 1,
     "id_in": 1.043
    },
    {
     "trade": 1.25,
     "id_in": 1.383
    },
    {
     "trade": 1.5,
     "id_in": 1.603
    },
    {
     "trade": 2,
     "id_in": 2.063
    }
   ]
  },
  {
   "id": "LFNCB",
   "name": "Liquidtight Flexible Nonmetallic (LFNC-B)",
   "minSize": 0.75,
   "enabled": false,
   "sizes": [
    {
     "trade": 0.375,
     "id_in": 0.494
    },
    {
     "trade": 0.5,
     "id_in": 0.632
    },
    {
     "trade": 0.75,
     "id_in": 0.83
    },
    {
     "trade": 1,
     "id_in": 1.054
    },
    {
     "trade": 1.25,
     "id_in": 1.395
    },
    {
     "trade": 1.5,
     "id_in": 1.588
    },
    {
     "trade": 2,
     "id_in": 2.033
    }
   ]
  }
 ],
 "necFill": {
  "one": 0.53,
  "two": 0.31,
  "more": 0.4
 },
 "jamRatio": {
  "min": 2.8,
  "max": 3.2,
  "factor": 1.05
 },
 "conduitLimits": {
  "maxLength_m": 30,
  "maxBends": 2
 },
 "managerTypes": [
  {
   "id": "h_front",
   "name": "Horizontal — solo frontal / single-sided",
   "brand": "Panduit",
   "products": [
    {
     "label": "1RU, front only",
     "partNumber": "NMF1",
     "area_in2": 3.3
    },
    {
     "label": "1RU, front only",
     "partNumber": "WMPFSE",
     "area_in2": 3.5
    },
    {
     "label": "2RU, front only, w/ bend rad. clips",
     "partNumber": "WMPHF2E",
     "area_in2": 5.9
    },
    {
     "label": "2RU, front only",
     "partNumber": "WMPF1E",
     "area_in2": 7.6
    },
    {
     "label": "2RU, front only",
     "partNumber": "NMF2",
     "area_in2": 9.8
    },
    {
     "label": "3RU, front only",
     "partNumber": "NMF3",
     "area_in2": 17.3
    },
    {
     "label": "4RU, front only",
     "partNumber": "NMF4",
     "area_in2": 24.3
    }
   ]
  },
  {
   "id": "h_dual",
   "name": "Horizontal — doble lado / dual-sided",
   "brand": "Panduit",
   "products": [
    {
     "label": "1RU, front/rear",
     "partNumber": "NM1",
     "area_in2": 7.4
    },
    {
     "label": "1RU, front/rear",
     "partNumber": "WMPSE",
     "area_in2": 9.8
    },
    {
     "label": "2RU, front/rear, w/ bend rad. clips",
     "partNumber": "WMPH2E",
     "area_in2": 16.5
    },
    {
     "label": "2RU, front/rear",
     "partNumber": "WMP1E",
     "area_in2": 18.2
    },
    {
     "label": "2RU, front/rear",
     "partNumber": "NM2",
     "area_in2": 20.9
    },
    {
     "label": "3RU, front/rear",
     "partNumber": "NM3",
     "area_in2": 39.3
    },
    {
     "label": "4RU, front/rear",
     "partNumber": "NM4",
     "area_in2": 56.2
    }
   ]
  },
  {
   "id": "v_front",
   "name": "Vertical — solo frontal / single-sided",
   "brand": "Panduit",
   "products": [
    {
     "label": "4.9\" wide, 45RU, front only",
     "partNumber": "WMPVF45E",
     "area_in2": 17.3
    },
    {
     "label": "6.7\" wide, 45RU, front only",
     "partNumber": "WMPVHCF45E",
     "area_in2": 30.7
    },
    {
     "label": "6\" wide, front only",
     "partNumber": "PR2VFD06",
     "area_in2": 66.1
    },
    {
     "label": "8\" wide, front only",
     "partNumber": "PR2VFD08",
     "area_in2": 92.5
    },
    {
     "label": "10\" wide, front only",
     "partNumber": "PR2VFD10",
     "area_in2": 118.9
    },
    {
     "label": "12\" wide, front only",
     "partNumber": "PR2VFD12",
     "area_in2": 145.2
    }
   ]
  },
  {
   "id": "v_dual",
   "name": "Vertical — doble lado / dual-sided",
   "brand": "Panduit",
   "products": [
    {
     "label": "4.9\" wide, 45RU",
     "partNumber": "WMPV45E",
     "area_in2": 34.6
    },
    {
     "label": "6.7\" wide, 45RU",
     "partNumber": "WMPVHC45E",
     "area_in2": 61.4
    },
    {
     "label": "6\" wide",
     "partNumber": "PR2VD06",
     "area_in2": 110.4
    },
    {
     "label": "8\" wide",
     "partNumber": "PR2VD08",
     "area_in2": 155.6
    },
    {
     "label": "10\" wide",
     "partNumber": "PR2VD10",
     "area_in2": 200.8
    },
    {
     "label": "12\" wide",
     "partNumber": "PR2VD12",
     "area_in2": 246
    }
   ]
  },
  {
   "id": "v_cab",
   "name": "Vertical en gabinete / in-cabinet",
   "brand": "Panduit",
   "products": [
    {
     "label": "side mount, 2\"W x 3\"D x 6'H",
     "partNumber": "CWMPV2340",
     "area_in2": 5.2
    },
    {
     "label": "side mount, 2\"W x 4\"D x 6'H",
     "partNumber": "CWMPV2440",
     "area_in2": 5.7
    },
    {
     "label": "side mount, 3\"W x 3\"D x 6'H",
     "partNumber": "CWMPV3340",
     "area_in2": 7.8
    },
    {
     "label": "side mount, 3\"W x 4\"D x 6'H",
     "partNumber": "CWMPV3440",
     "area_in2": 9.1
    }
   ]
  }
 ]
};
