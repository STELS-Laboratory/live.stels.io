import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import { filterSession } from "@/lib/utils";

function Fred() {
  const session = useSessionStoreSync() as any;

  const fredData = filterSession(session || {}, /\.fred\..*\.indicator$/);
  //console.log(fredData);
  // Example of fredData
  //   [
  //     {
  //         "key": "testnet.fred.WDI.NE.TRD.GNFS.ZS.US.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.TRD.GNFS.ZS.US.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.TRD.GNFS.ZS.US.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "NE.TRD.GNFS.ZS",
  //                 "indicatorName": "Trade (X+M) (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 24.8879916970734,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.TX.VAL.TECH.MF.ZS.EU.tech.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.TX.VAL.TECH.MF.ZS.EU.tech.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.TX.VAL.TECH.MF.ZS.EU.tech.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "tech",
  //                 "indicator": "TX.VAL.TECH.MF.ZS",
  //                 "indicatorName": "High-tech exports (% of manuf. exports)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2023",
  //                 "value": 19.182000672927,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.GDI.TOTL.CD.EU.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.GDI.TOTL.CD.EU.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.GDI.TOTL.CD.EU.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "NE.GDI.TOTL.CD",
  //                 "indicatorName": "Gross capital formation (US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 4136322702940.97,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.BX.KLT.DINV.CD.WD.UA.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.BX.KLT.DINV.CD.WD.UA.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.BX.KLT.DINV.CD.WD.UA.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "BX.KLT.DINV.CD.WD",
  //                 "indicatorName": "FDI, net inflows (US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 3796000000,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SP.DYN.LE00.IN.US.social.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SP.DYN.LE00.IN.US.social.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SP.DYN.LE00.IN.US.social.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SP.DYN.LE00.IN",
  //                 "indicatorName": "Life expectancy at birth (years)",
  //                 "unit": "years",
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2023",
  //                 "value": 78.3853658536585,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SH.XPD.CHEX.GD.ZS.EU.social.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SH.XPD.CHEX.GD.ZS.EU.social.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SH.XPD.CHEX.GD.ZS.EU.social.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SH.XPD.CHEX.GD.ZS",
  //                 "indicatorName": "Current health exp. (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2022",
  //                 "value": 10.3657237718615,
  //                 "decimal": 2
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SL.UEM.TOTL.ZS.US.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SL.UEM.TOTL.ZS.US.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SL.UEM.TOTL.ZS.US.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "SL.UEM.TOTL.ZS",
  //                 "indicatorName": "Unemployment (% of labor force)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "invert": true,
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 4.106,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GDP.PCAP.CD.US.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GDP.PCAP.CD.US.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GDP.PCAP.CD.US.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "NY.GDP.PCAP.CD",
  //                 "indicatorName": "GDP per capita (current US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 85809.9003846356,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.GDI.TOTL.CD.UA.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.GDI.TOTL.CD.UA.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.GDI.TOTL.CD.UA.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "NE.GDI.TOTL.CD",
  //                 "indicatorName": "Gross capital formation (US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 35559948654.6493,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.IT.NET.USER.ZS.US.tech.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.IT.NET.USER.ZS.US.tech.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.IT.NET.USER.ZS.US.tech.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "tech",
  //                 "indicator": "IT.NET.USER.ZS",
  //                 "indicatorName": "Internet users (% of population)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2023",
  //                 "value": 93.1,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GNS.ICTR.ZS.EU.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GNS.ICTR.ZS.EU.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GNS.ICTR.ZS.EU.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "NY.GNS.ICTR.ZS",
  //                 "indicatorName": "Gross savings (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 24.4518141078614,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.FI.RES.TOTL.CD.US.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.FI.RES.TOTL.CD.US.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.FI.RES.TOTL.CD.US.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "FI.RES.TOTL.CD",
  //                 "indicatorName": "Total reserves (current US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 910036546651.5,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.CM.MKT.TRAD.GD.ZS.US.depth.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.CM.MKT.TRAD.GD.ZS.US.depth.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.CM.MKT.TRAD.GD.ZS.US.depth.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "depth",
  //                 "indicator": "CM.MKT.TRAD.GD.ZS",
  //                 "indicatorName": "Stocks traded value (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 145.96665284673,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.FS.AST.PRVT.GD.ZS.UA.depth.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.FS.AST.PRVT.GD.ZS.UA.depth.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.FS.AST.PRVT.GD.ZS.UA.depth.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "depth",
  //                 "indicator": "FS.AST.PRVT.GD.ZS",
  //                 "indicatorName": "Credit to private sector (% GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2023",
  //                 "value": 18.6466208363539,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.FP.CPI.TOTL.ZG.EU.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.FP.CPI.TOTL.ZG.EU.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.FP.CPI.TOTL.ZG.EU.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "FP.CPI.TOTL.ZG",
  //                 "indicatorName": "Inflation, CPI (annual %)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "invert": true,
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 2.43531202435314,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.AG.LND.FRST.ZS.US.energy.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.AG.LND.FRST.ZS.US.energy.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.AG.LND.FRST.ZS.US.energy.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "energy",
  //                 "indicator": "AG.LND.FRST.ZS",
  //                 "indicatorName": "Forest area (% of land)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2022",
  //                 "value": 33.8669264120375,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SP.DYN.LE00.IN.EU.social.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SP.DYN.LE00.IN.EU.social.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SP.DYN.LE00.IN.EU.social.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SP.DYN.LE00.IN",
  //                 "indicatorName": "Life expectancy at birth (years)",
  //                 "unit": "years",
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2023",
  //                 "value": 81.4114503796875,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SL.UEM.TOTL.ZS.EU.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SL.UEM.TOTL.ZS.EU.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SL.UEM.TOTL.ZS.EU.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "SL.UEM.TOTL.ZS",
  //                 "indicatorName": "Unemployment (% of labor force)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "invert": true,
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 5.91813025174577,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GDP.MKTP.CD.EU.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GDP.MKTP.CD.EU.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GDP.MKTP.CD.EU.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "NY.GDP.MKTP.CD",
  //                 "indicatorName": "GDP (current US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 19423319451330.3,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.TX.VAL.TECH.MF.ZS.UA.tech.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.TX.VAL.TECH.MF.ZS.UA.tech.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.TX.VAL.TECH.MF.ZS.UA.tech.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "tech",
  //                 "indicator": "TX.VAL.TECH.MF.ZS",
  //                 "indicatorName": "High-tech exports (% of manuf. exports)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2023",
  //                 "value": 6.68812192869261,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.DT.DOD.DECT.CD.UA.external.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.DT.DOD.DECT.CD.UA.external.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.DT.DOD.DECT.CD.UA.external.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "DT.DOD.DECT.CD",
  //                 "indicatorName": "External debt stocks (US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "invert": true,
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2023",
  //                 "value": 176645481677.3,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.IMP.GNFS.ZS.EU.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.IMP.GNFS.ZS.EU.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.IMP.GNFS.ZS.EU.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "NE.IMP.GNFS.ZS",
  //                 "indicatorName": "Imports of G&S (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 46.3055205455627,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.BN.CAB.XOKA.GD.ZS.US.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.BN.CAB.XOKA.GD.ZS.US.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.BN.CAB.XOKA.GD.ZS.US.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "BN.CAB.XOKA.GD.ZS",
  //                 "indicatorName": "Current account (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": -3.88426682437385,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GNS.ICTR.ZS.US.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GNS.ICTR.ZS.US.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GNS.ICTR.ZS.US.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "NY.GNS.ICTR.ZS",
  //                 "indicatorName": "Gross savings (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 18.1401506053304,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.EXP.GNFS.ZS.US.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.EXP.GNFS.ZS.US.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.EXP.GNFS.ZS.US.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "NE.EXP.GNFS.ZS",
  //                 "indicatorName": "Exports of G&S (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 10.8968750610333,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.GB.XPD.RSDV.GD.ZS.US.tech.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.GB.XPD.RSDV.GD.ZS.US.tech.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.GB.XPD.RSDV.GD.ZS.US.tech.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "tech",
  //                 "indicator": "GB.XPD.RSDV.GD.ZS",
  //                 "indicatorName": "R&D expenditure (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2022",
  //                 "value": 3.58623003959656,
  //                 "decimal": 2
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.GC.TAX.TOTL.GD.ZS.EU.fiscal.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.GC.TAX.TOTL.GD.ZS.EU.fiscal.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.GC.TAX.TOTL.GD.ZS.EU.fiscal.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "fiscal",
  //                 "indicator": "GC.TAX.TOTL.GD.ZS",
  //                 "indicatorName": "Tax revenue (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2022",
  //                 "value": 19.7708146687632,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.GDI.TOTL.CD.US.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.GDI.TOTL.CD.US.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.GDI.TOTL.CD.US.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "NE.GDI.TOTL.CD",
  //                 "indicatorName": "Gross capital formation (US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 6345913000000,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.BN.CAB.XOKA.GD.ZS.UA.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.BN.CAB.XOKA.GD.ZS.UA.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.BN.CAB.XOKA.GD.ZS.UA.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "BN.CAB.XOKA.GD.ZS",
  //                 "indicatorName": "Current account (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": -7.20819382813332,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.EG.USE.PCAP.KG.OE.EU.energy.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.EG.USE.PCAP.KG.OE.EU.energy.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.EG.USE.PCAP.KG.OE.EU.energy.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "energy",
  //                 "indicator": "EG.USE.PCAP.KG.OE",
  //                 "indicatorName": "Energy use (kg oil eq. per cap)",
  //                 "unit": "ratio",
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2023",
  //                 "value": 2849.40218908629,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.TRD.GNFS.ZS.UA.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.TRD.GNFS.ZS.UA.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.TRD.GNFS.ZS.UA.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "NE.TRD.GNFS.ZS",
  //                 "indicatorName": "Trade (X+M) (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 77.7530113300514,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GDP.MKTP.KD.ZG.US.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GDP.MKTP.KD.ZG.US.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GDP.MKTP.KD.ZG.US.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "NY.GDP.MKTP.KD.ZG",
  //                 "indicatorName": "Real GDP growth (annual %)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 2.79619035621393,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GDP.MKTP.CD.UA.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GDP.MKTP.CD.UA.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GDP.MKTP.CD.UA.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "NY.GDP.MKTP.CD",
  //                 "indicatorName": "GDP (current US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 190741263731.535,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.EXP.GNFS.ZS.EU.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.EXP.GNFS.ZS.EU.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.EXP.GNFS.ZS.EU.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "NE.EXP.GNFS.ZS",
  //                 "indicatorName": "Exports of G&S (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 50.6996759251977,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SP.DYN.LE00.IN.UA.social.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SP.DYN.LE00.IN.UA.social.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SP.DYN.LE00.IN.UA.social.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SP.DYN.LE00.IN",
  //                 "indicatorName": "Life expectancy at birth (years)",
  //                 "unit": "years",
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2023",
  //                 "value": 73.422,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.IT.CEL.SETS.P2.US.tech.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.IT.CEL.SETS.P2.US.tech.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.IT.CEL.SETS.P2.US.tech.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "tech",
  //                 "indicator": "IT.CEL.SETS.P2",
  //                 "indicatorName": "Mobile subscriptions (per 100)",
  //                 "unit": "per100",
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2023",
  //                 "value": 112.411,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.GC.DOD.TOTL.GD.ZS.US.fiscal.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.GC.DOD.TOTL.GD.ZS.US.fiscal.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.GC.DOD.TOTL.GD.ZS.US.fiscal.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "fiscal",
  //                 "indicator": "GC.DOD.TOTL.GD.ZS",
  //                 "indicatorName": "Central gov. debt (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "invert": true,
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2023",
  //                 "value": 114.755553330184,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.GC.TAX.TOTL.GD.ZS.UA.fiscal.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.GC.TAX.TOTL.GD.ZS.UA.fiscal.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.GC.TAX.TOTL.GD.ZS.UA.fiscal.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "fiscal",
  //                 "indicator": "GC.TAX.TOTL.GD.ZS",
  //                 "indicatorName": "Tax revenue (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2023",
  //                 "value": 17.4590616933322,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GDP.MKTP.CD.US.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GDP.MKTP.CD.US.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GDP.MKTP.CD.US.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "NY.GDP.MKTP.CD",
  //                 "indicatorName": "GDP (current US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 29184890000000,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GDP.MKTP.KD.ZG.EU.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GDP.MKTP.KD.ZG.EU.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GDP.MKTP.KD.ZG.EU.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "NY.GDP.MKTP.KD.ZG",
  //                 "indicatorName": "Real GDP growth (annual %)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 1.02536782724844,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.FM.LBL.BMNY.GD.ZS.US.depth.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.FM.LBL.BMNY.GD.ZS.US.depth.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.FM.LBL.BMNY.GD.ZS.US.depth.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "depth",
  //                 "indicator": "FM.LBL.BMNY.GD.ZS",
  //                 "indicatorName": "Broad money (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 99.2267346257056,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SH.XPD.CHEX.GD.ZS.US.social.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SH.XPD.CHEX.GD.ZS.US.social.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SH.XPD.CHEX.GD.ZS.US.social.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SH.XPD.CHEX.GD.ZS",
  //                 "indicatorName": "Current health exp. (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2022",
  //                 "value": 16.49613953,
  //                 "decimal": 2
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SP.POP.TOTL.UA.social.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SP.POP.TOTL.UA.social.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SP.POP.TOTL.UA.social.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SP.POP.TOTL",
  //                 "indicatorName": "Population, total",
  //                 "unit": "count",
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 37860221,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SE.SEC.ENRR.US.social.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SE.SEC.ENRR.US.social.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SE.SEC.ENRR.US.social.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SE.SEC.ENRR",
  //                 "indicatorName": "School enrollment, secondary (% gross)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2022",
  //                 "value": 97.4734878540039,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.FS.AST.PRVT.GD.ZS.US.depth.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.FS.AST.PRVT.GD.ZS.US.depth.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.FS.AST.PRVT.GD.ZS.US.depth.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "depth",
  //                 "indicator": "FS.AST.PRVT.GD.ZS",
  //                 "indicatorName": "Credit to private sector (% GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 197.896120599056,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SE.SEC.ENRR.EU.social.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SE.SEC.ENRR.EU.social.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SE.SEC.ENRR.EU.social.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SE.SEC.ENRR",
  //                 "indicatorName": "School enrollment, secondary (% gross)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2023",
  //                 "value": 107.661437988281,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.EXP.GNFS.ZS.UA.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.EXP.GNFS.ZS.UA.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.EXP.GNFS.ZS.UA.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "NE.EXP.GNFS.ZS",
  //                 "indicatorName": "Exports of G&S (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 29.4102139813249,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SP.URB.TOTL.IN.ZS.EU.social.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SP.URB.TOTL.IN.ZS.EU.social.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SP.URB.TOTL.IN.ZS.EU.social.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SP.URB.TOTL.IN.ZS",
  //                 "indicatorName": "Urban population (% of total)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 75.949283176978,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.FP.CPI.TOTL.ZG.US.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.FP.CPI.TOTL.ZG.US.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.FP.CPI.TOTL.ZG.US.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "FP.CPI.TOTL.ZG",
  //                 "indicatorName": "Inflation, CPI (annual %)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "invert": true,
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 2.94952520485207,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SP.POP.TOTL.EU.social.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SP.POP.TOTL.EU.social.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SP.POP.TOTL.EU.social.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SP.POP.TOTL",
  //                 "indicatorName": "Population, total",
  //                 "unit": "count",
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 450185396,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.GC.REV.XGRT.GD.ZS.US.fiscal.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.GC.REV.XGRT.GD.ZS.US.fiscal.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.GC.REV.XGRT.GD.ZS.US.fiscal.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "fiscal",
  //                 "indicator": "GC.REV.XGRT.GD.ZS",
  //                 "indicatorName": "Revenue excl. grants (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2023",
  //                 "value": 17.5921957840256,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.GDI.TOTL.ZS.UA.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.GDI.TOTL.ZS.UA.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.GDI.TOTL.ZS.UA.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "NE.GDI.TOTL.ZS",
  //                 "indicatorName": "Gross capital formation (% GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 18.6430287599957,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SL.UEM.1524.ZS.US.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SL.UEM.1524.ZS.US.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SL.UEM.1524.ZS.US.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "SL.UEM.1524.ZS",
  //                 "indicatorName": "Youth unemployment 15–24 (%)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "invert": true,
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 9.389,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GNS.ICTR.ZS.UA.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GNS.ICTR.ZS.UA.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GNS.ICTR.ZS.UA.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "NY.GNS.ICTR.ZS",
  //                 "indicatorName": "Gross savings (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 11.3293261562199,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.FS.AST.PRVT.GD.ZS.EU.depth.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.FS.AST.PRVT.GD.ZS.EU.depth.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.FS.AST.PRVT.GD.ZS.EU.depth.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "depth",
  //                 "indicator": "FS.AST.PRVT.GD.ZS",
  //                 "indicatorName": "Credit to private sector (% GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 75.8306206925824,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SP.POP.TOTL.US.social.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SP.POP.TOTL.US.social.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SP.POP.TOTL.US.social.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SP.POP.TOTL",
  //                 "indicatorName": "Population, total",
  //                 "unit": "count",
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 340110988,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.IT.NET.USER.ZS.UA.tech.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.IT.NET.USER.ZS.UA.tech.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.IT.NET.USER.ZS.UA.tech.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "tech",
  //                 "indicator": "IT.NET.USER.ZS",
  //                 "indicatorName": "Internet users (% of population)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2023",
  //                 "value": 82.4,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.FM.LBL.BMNY.GD.ZS.UA.depth.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.FM.LBL.BMNY.GD.ZS.UA.depth.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.FM.LBL.BMNY.GD.ZS.UA.depth.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "depth",
  //                 "indicator": "FM.LBL.BMNY.GD.ZS",
  //                 "indicatorName": "Broad money (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 45.5481410402979,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.AG.LND.FRST.ZS.EU.energy.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.AG.LND.FRST.ZS.EU.energy.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.AG.LND.FRST.ZS.EU.energy.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "energy",
  //                 "indicator": "AG.LND.FRST.ZS",
  //                 "indicatorName": "Forest area (% of land)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2022",
  //                 "value": 39.9291602010185,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.GC.TAX.TOTL.GD.ZS.US.fiscal.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.GC.TAX.TOTL.GD.ZS.US.fiscal.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.GC.TAX.TOTL.GD.ZS.US.fiscal.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "fiscal",
  //                 "indicator": "GC.TAX.TOTL.GD.ZS",
  //                 "indicatorName": "Tax revenue (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2023",
  //                 "value": 10.6459127722888,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.FI.RES.TOTL.CD.UA.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.FI.RES.TOTL.CD.UA.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.FI.RES.TOTL.CD.UA.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "FI.RES.TOTL.CD",
  //                 "indicatorName": "Total reserves (current US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 43780549772.8406,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SP.URB.TOTL.IN.ZS.UA.social.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SP.URB.TOTL.IN.ZS.UA.social.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SP.URB.TOTL.IN.ZS.UA.social.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SP.URB.TOTL.IN.ZS",
  //                 "indicatorName": "Urban population (% of total)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 70.284,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.GC.REV.XGRT.GD.ZS.EU.fiscal.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.GC.REV.XGRT.GD.ZS.EU.fiscal.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.GC.REV.XGRT.GD.ZS.EU.fiscal.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "fiscal",
  //                 "indicator": "GC.REV.XGRT.GD.ZS",
  //                 "indicatorName": "Revenue excl. grants (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2022",
  //                 "value": 35.6591577207594,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GDP.MKTP.KD.ZG.UA.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GDP.MKTP.KD.ZG.UA.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GDP.MKTP.KD.ZG.UA.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "NY.GDP.MKTP.KD.ZG",
  //                 "indicatorName": "Real GDP growth (annual %)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 2.91382221470535,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.IT.CEL.SETS.P2.EU.tech.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.IT.CEL.SETS.P2.EU.tech.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.IT.CEL.SETS.P2.EU.tech.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "tech",
  //                 "indicator": "IT.CEL.SETS.P2",
  //                 "indicatorName": "Mobile subscriptions (per 100)",
  //                 "unit": "per100",
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2022",
  //                 "value": 123.687099666304,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.CM.MKT.LCAP.GD.ZS.US.depth.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.CM.MKT.LCAP.GD.ZS.US.depth.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.CM.MKT.LCAP.GD.ZS.US.depth.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "depth",
  //                 "indicator": "CM.MKT.LCAP.GD.ZS",
  //                 "indicatorName": "Market capitalization (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 213.074934735063,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.IMP.GNFS.ZS.US.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.IMP.GNFS.ZS.US.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.IMP.GNFS.ZS.US.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "NE.IMP.GNFS.ZS",
  //                 "indicatorName": "Imports of G&S (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 13.9911166360401,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.IMP.GNFS.ZS.UA.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.IMP.GNFS.ZS.UA.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.IMP.GNFS.ZS.UA.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "NE.IMP.GNFS.ZS",
  //                 "indicatorName": "Imports of G&S (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 48.3427973487265,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.TRD.GNFS.ZS.EU.external.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.TRD.GNFS.ZS.EU.external.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.TRD.GNFS.ZS.EU.external.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "external",
  //                 "indicator": "NE.TRD.GNFS.ZS",
  //                 "indicatorName": "Trade (X+M) (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 92.1542833802318,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.BX.KLT.DINV.CD.WD.EU.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.BX.KLT.DINV.CD.WD.EU.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.BX.KLT.DINV.CD.WD.EU.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "BX.KLT.DINV.CD.WD",
  //                 "indicatorName": "FDI, net inflows (US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 247680815882.403,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.EG.USE.PCAP.KG.OE.UA.energy.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.EG.USE.PCAP.KG.OE.UA.energy.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.EG.USE.PCAP.KG.OE.UA.energy.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "energy",
  //                 "indicator": "EG.USE.PCAP.KG.OE",
  //                 "indicatorName": "Energy use (kg oil eq. per cap)",
  //                 "unit": "ratio",
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2022",
  //                 "value": 1492.96963034755,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.GB.XPD.RSDV.GD.ZS.UA.tech.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.GB.XPD.RSDV.GD.ZS.UA.tech.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.GB.XPD.RSDV.GD.ZS.UA.tech.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "tech",
  //                 "indicator": "GB.XPD.RSDV.GD.ZS",
  //                 "indicatorName": "R&D expenditure (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2023",
  //                 "value": 0.326530009508133,
  //                 "decimal": 2
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.EG.USE.PCAP.KG.OE.US.energy.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.EG.USE.PCAP.KG.OE.US.energy.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.EG.USE.PCAP.KG.OE.US.energy.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "energy",
  //                 "indicator": "EG.USE.PCAP.KG.OE",
  //                 "indicatorName": "Energy use (kg oil eq. per cap)",
  //                 "unit": "ratio",
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2023",
  //                 "value": 6392.26488409079,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GDP.PCAP.CD.UA.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GDP.PCAP.CD.UA.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GDP.PCAP.CD.UA.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "NY.GDP.PCAP.CD",
  //                 "indicatorName": "GDP per capita (current US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 5389.47314453125,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.GB.XPD.RSDV.GD.ZS.EU.tech.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.GB.XPD.RSDV.GD.ZS.EU.tech.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.GB.XPD.RSDV.GD.ZS.EU.tech.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "tech",
  //                 "indicator": "GB.XPD.RSDV.GD.ZS",
  //                 "indicatorName": "R&D expenditure (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2022",
  //                 "value": 2.24284673104663,
  //                 "decimal": 2
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.BX.KLT.DINV.CD.WD.US.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.BX.KLT.DINV.CD.WD.US.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.BX.KLT.DINV.CD.WD.US.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "BX.KLT.DINV.CD.WD",
  //                 "indicatorName": "FDI, net inflows (US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 387990000000,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SP.URB.TOTL.IN.ZS.US.social.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SP.URB.TOTL.IN.ZS.US.social.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SP.URB.TOTL.IN.ZS.US.social.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "social",
  //                 "indicator": "SP.URB.TOTL.IN.ZS",
  //                 "indicatorName": "Urban population (% of total)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 83.515,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.GDI.TOTL.ZS.US.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.GDI.TOTL.ZS.US.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.GDI.TOTL.ZS.US.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "NE.GDI.TOTL.ZS",
  //                 "indicatorName": "Gross capital formation (% GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 21.7438304547319,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NY.GDP.PCAP.CD.EU.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NY.GDP.PCAP.CD.EU.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NY.GDP.PCAP.CD.EU.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "NY.GDP.PCAP.CD",
  //                 "indicatorName": "GDP per capita (current US$)",
  //                 "unit": "usd",
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 43145.1566930223,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.SL.UEM.1524.ZS.EU.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.SL.UEM.1524.ZS.EU.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.SL.UEM.1524.ZS.EU.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "SL.UEM.1524.ZS",
  //                 "indicatorName": "Youth unemployment 15–24 (%)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "invert": true,
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 15.9411990871465,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.TX.VAL.TECH.MF.ZS.US.tech.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.TX.VAL.TECH.MF.ZS.US.tech.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.TX.VAL.TECH.MF.ZS.US.tech.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "tech",
  //                 "indicator": "TX.VAL.TECH.MF.ZS",
  //                 "indicatorName": "High-tech exports (% of manuf. exports)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "US",
  //                 "countryName": "United States",
  //                 "date": "2024",
  //                 "value": 24.322982844202,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.IT.CEL.SETS.P2.UA.tech.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.IT.CEL.SETS.P2.UA.tech.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.IT.CEL.SETS.P2.UA.tech.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "tech",
  //                 "indicator": "IT.CEL.SETS.P2",
  //                 "indicatorName": "Mobile subscriptions (per 100)",
  //                 "unit": "per100",
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2023",
  //                 "value": 122.758,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.FP.CPI.TOTL.ZG.UA.macro.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.FP.CPI.TOTL.ZG.UA.macro.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.FP.CPI.TOTL.ZG.UA.macro.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "macro",
  //                 "indicator": "FP.CPI.TOTL.ZG",
  //                 "indicatorName": "Inflation, CPI (annual %)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "invert": true,
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2024",
  //                 "value": 6.50198464669254,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.GC.REV.XGRT.GD.ZS.UA.fiscal.2023.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.GC.REV.XGRT.GD.ZS.UA.fiscal.2023.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.GC.REV.XGRT.GD.ZS.UA.fiscal.2023.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "fiscal",
  //                 "indicator": "GC.REV.XGRT.GD.ZS",
  //                 "indicatorName": "Revenue excl. grants (% of GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2023",
  //                 "value": 30.8349656855253,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.AG.LND.FRST.ZS.UA.energy.2022.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.AG.LND.FRST.ZS.UA.energy.2022.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.AG.LND.FRST.ZS.UA.energy.2022.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "energy",
  //                 "indicator": "AG.LND.FRST.ZS",
  //                 "indicatorName": "Forest area (% of land)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "UA",
  //                 "countryName": "Ukraine",
  //                 "date": "2022",
  //                 "value": 16.7449085260614,
  //                 "decimal": 1
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     },
  //     {
  //         "key": "testnet.fred.WDI.NE.GDI.TOTL.ZS.EU.invest.2024.indicator",
  //         "value": {
  //             "channel": "testnet.fred.WDI.NE.GDI.TOTL.ZS.EU.invest.2024.indicator",
  //             "module": "fred",
  //             "widget": "widget.testnet.fred.WDI.NE.GDI.TOTL.ZS.EU.invest.2024.indicator",
  //             "raw": {
  //                 "source": "WDI",
  //                 "groupId": "invest",
  //                 "indicator": "NE.GDI.TOTL.ZS",
  //                 "indicatorName": "Gross capital formation (% GDP)",
  //                 "unit": "pct",
  //                 "scale": 0.01,
  //                 "agg": "last",
  //                 "country": "EU",
  //                 "countryName": "European Union",
  //                 "date": "2024",
  //                 "value": 21.2956529562596,
  //                 "decimal": 0
  //             },
  //             "timestamp": 1755626502774
  //         }
  //     }
  // ]

  return <div>Fred</div>;
}

export default Fred;
