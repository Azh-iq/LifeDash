#!/usr/bin/env node

/**
 * Script to expand stock registry with S&P 500 companies
 * This script generates a SQL migration to add comprehensive stock data
 */

const fs = require('fs')
const path = require('path')

// Read the S&P 500 CSV data
const csvData = `Symbol,Security,GICS Sector,GICS Sub-Industry,Headquarters Location,Date added,CIK,Founded
MMM,3M,Industrials,Industrial Conglomerates,"Saint Paul, Minnesota",1957-03-04,66740,1902
AOS,A. O. Smith,Industrials,Building Products,"Milwaukee, Wisconsin",2017-07-26,91142,1916
ABT,Abbott Laboratories,Health Care,Health Care Equipment,"North Chicago, Illinois",1957-03-04,1800,1888
ABBV,AbbVie,Health Care,Biotechnology,"North Chicago, Illinois",2012-12-31,1551152,2013 (1888)
ACN,Accenture,Information Technology,IT Consulting & Other Services,"Dublin, Ireland",2011-07-06,1467373,1989
ADBE,Adobe Inc.,Information Technology,Application Software,"San Jose, California",1997-05-05,796343,1982
AMD,Advanced Micro Devices,Information Technology,Semiconductors,"Santa Clara, California",2017-03-20,2488,1969
AES,AES Corporation,Utilities,Independent Power Producers & Energy Traders,"Arlington, Virginia",1998-10-02,874761,1981
AFL,Aflac,Financials,Life & Health Insurance,"Columbus, Georgia",1999-05-28,4977,1955
A,Agilent Technologies,Health Care,Life Sciences Tools & Services,"Santa Clara, California",2000-06-05,1090872,1999
APD,Air Products,Materials,Industrial Gases,"Upper Macungie Township, Pennsylvania",1985-04-30,2969,1940
ABNB,Airbnb,Consumer Discretionary,"Hotels, Resorts & Cruise Lines","San Francisco, California",2023-09-18,1559720,2008
AKAM,Akamai Technologies,Information Technology,Internet Services & Infrastructure,"Cambridge, Massachusetts",2007-07-12,1086222,1998
ALB,Albemarle Corporation,Materials,Specialty Chemicals,"Charlotte, North Carolina",2016-07-01,915913,1994
ARE,Alexandria Real Estate Equities,Real Estate,Office REITs,"Pasadena, California",2017-03-20,1035443,1994
ALGN,Align Technology,Health Care,Health Care Supplies,"Tempe, Arizona",2017-06-19,1097149,1997
ALLE,Allegion,Industrials,Building Products,"Dublin, Ireland",2013-12-02,1579241,1908
LNT,Alliant Energy,Utilities,Electric Utilities,"Madison, Wisconsin",2016-07-01,352541,1917
ALL,Allstate,Financials,Property & Casualty Insurance,"Northbrook, Illinois",1995-07-13,899051,1931
GOOGL,Alphabet Inc.,Communication Services,Interactive Media & Services,"Mountain View, California",2006-04-03,1652044,1998
GOOG,Alphabet Inc.,Communication Services,Interactive Media & Services,"Mountain View, California",2006-04-03,1652044,1998
MO,Altria Group,Consumer Staples,Tobacco,"Richmond, Virginia",1957-03-04,764180,1822
AMZN,Amazon.com,Consumer Discretionary,Internet & Direct Marketing Retail,"Seattle, Washington",2005-11-21,1018724,1994
AMCR,Amcor,Materials,Paper Packaging,"Zurich, Switzerland",2019-06-11,1748790,1860
AEE,Ameren,Utilities,Electric Utilities,"St. Louis, Missouri",1991-09-11,1002910,1902
AAL,American Airlines Group,Industrials,Airlines,"Fort Worth, Texas",2015-03-23,6201,1930
AEP,American Electric Power,Utilities,Electric Utilities,"Columbus, Ohio",1957-03-04,4904,1906
AXP,American Express,Financials,Consumer Finance,"New York, New York",1957-03-04,4962,1850
AIG,American International Group,Financials,Multi-line Insurance,"New York, New York",1980-04-30,5272,1919
AMT,American Tower,Real Estate,Specialized REITs,"Boston, Massachusetts",2007-11-19,1053507,1995
AWK,American Water Works,Utilities,Water Utilities,"Camden, New Jersey",2008-04-23,1410636,1886
AMP,Ameriprise Financial,Financials,Asset Management & Custody Banks,"Minneapolis, Minnesota",2005-10-03,820027,1894
AME,AMETEK,Industrials,Electrical Components & Equipment,"Berwyn, Pennsylvania",2017-09-01,1037868,1930
AMGN,Amgen,Health Care,Biotechnology,"Thousand Oaks, California",1992-04-09,318154,1980
APH,Amphenol,Information Technology,Electronic Components,"Wallingford, Connecticut",2008-09-30,820313,1932
ADI,Analog Devices,Information Technology,Semiconductors,"Norwood, Massachusetts",2017-03-20,6281,1965
ANSS,Ansys,Information Technology,Application Software,"Canonsburg, Pennsylvania",2017-06-19,1013462,1970
AON,Aon,Financials,Insurance Brokers,"London, England",2010-04-06,315293,1919
APA,APA Corporation,Energy,Oil & Gas Exploration & Production,"Houston, Texas",1998-07-01,6769,1954
AAPL,Apple Inc.,Information Technology,Technology Hardware Storage & Peripherals,"Cupertino, California",1982-12-12,320193,1976
AMAT,Applied Materials,Information Technology,Semiconductor Equipment,"Santa Clara, California",2000-03-17,6951,1967
APTV,Aptiv,Consumer Discretionary,Auto Parts & Equipment,"Dublin, Ireland",2017-09-05,1521332,1999
ACGL,Arch Capital Group,Financials,Property & Casualty Insurance,"Pembroke, Bermuda",2016-12-19,947484,1995
ADM,Archer-Daniels-Midland,Consumer Staples,Agricultural Products,"Chicago, Illinois",1981-07-29,7084,1902
ANET,Arista Networks,Information Technology,Communications Equipment,"Santa Clara, California",2018-03-19,1596532,2004
AJG,Arthur J. Gallagher & Co.,Financials,Insurance Brokers,"Rolling Meadows, Illinois",2016-05-31,354190,1927
AIZ,Assurant,Financials,Multi-line Insurance,"New York, New York",2004-02-11,1267238,1892
T,AT&T,Communication Services,Integrated Telecommunication Services,"Dallas, Texas",1957-03-04,732717,1983
ATO,Atmos Energy,Utilities,Gas Utilities,"Dallas, Texas",2006-05-24,731802,1906
ADSK,Autodesk,Information Technology,Application Software,"San Rafael, California",1994-02-15,769397,1982
ADP,Automatic Data Processing,Information Technology,Data Processing & Outsourced Services,"Roseland, New Jersey",1981-03-31,8670,1949
AVB,AvalonBay Communities,Real Estate,Residential REITs,"Arlington, Virginia",2007-09-17,915912,1978
AVY,Avery Dennison,Materials,Paper Packaging,"Mentor, Ohio",1988-01-07,8818,1935
BKR,Baker Hughes,Energy,Oil & Gas Equipment & Services,"Houston, Texas",2017-07-24,1701605,1987
BALL,Ball Corporation,Materials,Metal & Glass Containers,"Westminster, Colorado",1984-08-31,9389,1880
BAC,Bank of America,Financials,Diversified Banks,"Charlotte, North Carolina",1976-01-02,70858,1904
BBWI,Bath & Body Works,Consumer Discretionary,Specialty Stores,"Columbus, Ohio",2021-08-02,1844204,1990
BAX,Baxter International,Health Care,Health Care Equipment,"Deerfield, Illinois",1985-09-30,10456,1931
BDX,Becton Dickinson,Health Care,Health Care Equipment,"Franklin Lakes, New Jersey",1988-09-07,10795,1897
BRK.B,Berkshire Hathaway,Financials,Multi-Sector Holdings,"Omaha, Nebraska",1976-05-06,1067983,1839
BBY,Best Buy,Consumer Discretionary,Computer & Electronics Retail,"Richfield, Minnesota",1999-06-23,764478,1966
BIO,Bio-Rad Laboratories,Health Care,Life Sciences Tools & Services,"Hercules, California",2020-09-14,12208,1952
TECH,Bio-Techne,Health Care,Life Sciences Tools & Services,"Minneapolis, Minnesota",2017-09-18,1206264,1976
BIIB,Biogen,Health Care,Biotechnology,"Cambridge, Massachusetts",2003-11-13,875045,1978
BLK,BlackRock,Financials,Asset Management & Custody Banks,"New York, New York",2006-04-04,1364742,1988
BK,Bank of New York Mellon,Financials,Asset Management & Custody Banks,"New York, New York",2009-07-07,1390777,1784
BA,Boeing,Industrials,Aerospace & Defense,"Chicago, Illinois",1957-03-04,12927,1916
BKNG,Booking Holdings,Consumer Discretionary,Internet & Direct Marketing Retail,"Norwalk, Connecticut",2009-11-06,1075531,1997
BWA,BorgWarner,Consumer Discretionary,Auto Parts & Equipment,"Auburn Hills, Michigan",2009-06-19,908255,1928
BXP,Boston Properties,Real Estate,Office REITs,"Boston, Massachusetts",2003-05-02,1037540,1970
BSX,Boston Scientific,Health Care,Health Care Equipment,"Marlborough, Massachusetts",1995-06-07,885725,1979
BMY,Bristol-Myers Squibb,Health Care,Pharmaceuticals,"New York, New York",1957-03-04,14272,1887
AVGO,Broadcom Inc.,Information Technology,Semiconductors,"San Jose, California",2017-03-06,1730168,1961
BR,Broadridge Financial Solutions,Information Technology,Data Processing & Outsourced Services,"Lake Success, New York",2007-04-02,1383312,1962
BRO,Brown & Brown,Financials,Insurance Brokers,"Daytona Beach, Florida",2021-09-20,79282,1939
BF.B,Brown-Forman,Consumer Staples,Distillers & Vintners,"Louisville, Kentucky",1992-04-09,14693,1870
CHRW,C.H. Robinson Worldwide,Industrials,Air Freight & Logistics,"Eden Prairie, Minnesota",2002-07-22,1043277,1905
CDNS,Cadence Design Systems,Information Technology,Application Software,"San Jose, California",2017-09-18,813672,1988
CZR,Caesars Entertainment,Consumer Discretionary,Casinos & Gaming,"Reno, Nevada",2017-03-20,858339,1937
CPT,Camden Property Trust,Real Estate,Residential REITs,"Houston, Texas",2018-03-19,906345,1993
CPB,Campbell Soup,Consumer Staples,Packaged Foods & Meats,"Camden, New Jersey",1984-11-30,16732,1869
COF,Capital One Financial,Financials,Consumer Finance,"McLean, Virginia",1998-07-01,927628,1994
CAH,Cardinal Health,Health Care,Health Care Distributors,"Dublin, Ohio",1994-08-31,721371,1971
KMX,CarMax,Consumer Discretionary,Automotive Retail,"Richmond, Virginia",2010-06-28,1170010,1993
CCL,Carnival,Consumer Discretionary,Hotels Resorts & Cruise Lines,"Miami, Florida",1984-07-18,815097,1972
CARR,Carrier Global,Industrials,Building Products,"Palm Beach Gardens, Florida",2020-04-03,1783180,1915
CTLT,Caterpillar,Industrials,Construction & Mining Equipment,"Peoria, Illinois",1957-03-04,18230,1925
CBRE,CBRE Group,Real Estate,Real Estate Services,"Dallas, Texas",2006-07-07,1138118,1906
CDW,CDW,Information Technology,Technology Distributors,"Lincolnshire, Illinois",2013-07-02,1402057,1984
CE,Celanese,Materials,Specialty Chemicals,"Irving, Texas",2010-07-19,1306830,1918
COR,Cencora,Health Care,Health Care Distributors,"Conshohocken, Pennsylvania",1979-11-30,1140859,1985
CNC,Centene,Health Care,Managed Health Care,"St. Louis, Missouri",2016-03-30,1071739,1984
CNP,CenterPoint Energy,Utilities,Electric Utilities,"Houston, Texas",2002-07-12,1130310,1866
CDAY,Ceridian HCM Holding,Information Technology,Application Software,"Minneapolis, Minnesota",2018-12-21,1725057,1992
CF,CF Industries,Materials,Fertilizers & Agricultural Chemicals,"Deerfield, Illinois",2010-02-26,1324404,1946
CRL,Charles River Laboratories,Health Care,Life Sciences Tools & Services,"Wilmington, Massachusetts",2017-09-18,1100682,1947
SCHW,Charles Schwab,Financials,Investment Banking & Brokerage,"San Francisco, California",1988-09-02,316709,1971
CHTR,Charter Communications,Communication Services,Cable & Satellite,"Stamford, Connecticut",2016-05-18,1091667,1993
CVX,Chevron,Energy,Integrated Oil & Gas,"San Ramon, California",1930-07-01,93410,1879
CMG,Chipotle Mexican Grill,Consumer Discretionary,Restaurants,"Newport Beach, California",2006-01-31,1058090,1993
CB,Chubb,Financials,Property & Casualty Insurance,"Zurich, Switzerland",2008-05-02,896159,1882
CHD,Church & Dwight,Consumer Staples,Household Products,"Ewing, New Jersey",1998-08-03,313927,1846
CI,Cigna,Health Care,Health Insurance,"Bloomfield, Connecticut",2012-04-12,1739940,1982
CINF,Cincinnati Financial,Financials,Property & Casualty Insurance,"Fairfield, Ohio",1991-08-15,20286,1950
CTAS,Cintas,Industrials,Diversified Support Services,"Mason, Ohio",1999-05-28,723254,1929
CSCO,Cisco Systems,Information Technology,Communications Equipment,"San Jose, California",1990-02-16,858877,1984
C,Citigroup,Financials,Diversified Banks,"New York, New York",1976-05-06,831001,1812
CFG,Citizens Financial Group,Financials,Regional Banks,"Providence, Rhode Island",2014-09-24,759944,1828
CLX,Clorox,Consumer Staples,Household Products,"Oakland, California",1969-05-01,21076,1913
CME,CME Group,Financials,Financial Exchanges & Data,"Chicago, Illinois",2007-12-31,1156375,1898
CMS,CMS Energy,Utilities,Electric Utilities,"Jackson, Michigan",1991-05-31,811156,1886
KO,Coca-Cola,Consumer Staples,Soft Drinks,"Atlanta, Georgia",1977-08-12,21344,1886
CTSH,Cognizant Technology Solutions,Information Technology,IT Consulting & Other Services,"Teaneck, New Jersey",2003-06-23,1058290,1994
CL,Colgate-Palmolive,Consumer Staples,Household Products,"New York, New York",1957-03-04,21665,1806
CMCSA,Comcast,Communication Services,Cable & Satellite,"Philadelphia, Pennsylvania",1988-06-29,1166691,1963
CMA,Comerica,Financials,Regional Banks,"Dallas, Texas",1991-03-11,28412,1849
CAG,Conagra Brands,Consumer Staples,Packaged Foods & Meats,"Chicago, Illinois",1984-09-25,23217,1919
COP,ConocoPhillips,Energy,Oil & Gas Exploration & Production,"Houston, Texas",2008-08-26,1163165,1917
COO,Cooper Companies,Health Care,Health Care Equipment,"San Ramon, California",2017-03-20,1158156,1958
CPRT,Copart,Industrials,Diversified Support Services,"Dallas, Texas",2010-06-28,900075,1982
CVS,CVS Health,Health Care,Health Care Services,"Woonsocket, Rhode Island",1999-07-21,64803,1963
CSGP,CoStar Group,Real Estate,Real Estate Services,"Washington, D.C.",2021-03-22,1057352,1987
COST,Costco Wholesale,Consumer Staples,Hypermarkets & Super Centers,"Issaquah, Washington",1993-12-17,909832,1983
CTRA,Coterra Energy,Energy,Oil & Gas Exploration & Production,"Houston, Texas",2021-10-01,1859622,2020
CCI,Crown Castle,Real Estate,Specialized REITs,"Houston, Texas",2013-08-07,1051470,1994
CSX,CSX,Industrials,Railroads,"Jacksonville, Florida",1980-07-01,277948,1980
CMI,Cummins,Industrials,Industrial Machinery,"Columbus, Indiana",2001-07-03,26172,1919
CVS,CVS Health,Health Care,Health Care Services,"Woonsocket, Rhode Island",1999-07-21,64803,1963
DHI,D.R. Horton,Consumer Discretionary,Homebuilding,"Arlington, Texas",2002-07-22,882184,1978
DHR,Danaher,Health Care,Health Care Equipment,"Washington, D.C.",1986-02-12,313616,1969
DRI,Darden Restaurants,Consumer Discretionary,Restaurants,"Orlando, Florida",1995-05-15,940944,1968
DAL,Delta Air Lines,Industrials,Airlines,"Atlanta, Georgia",2013-08-20,27904,1924
XRAY,Dentsply Sirona,Health Care,Health Care Equipment,"Charlotte, North Carolina",2010-06-01,818479,1899
DVN,Devon Energy,Energy,Oil & Gas Exploration & Production,"Oklahoma City, Oklahoma",2009-12-17,1090012,1971
DXCM,DexCom,Health Care,Health Care Equipment,"San Diego, California",2015-04-23,1093557,1999
FANG,Diamondback Energy,Energy,Oil & Gas Exploration & Production,"Midland, Texas",2018-12-21,1539838,2007
DFS,Discover Financial Services,Financials,Consumer Finance,"Riverwoods, Illinois",2007-07-03,1393612,1985
DISCA,Discovery Inc.,Communication Services,Cable & Satellite,"New York, New York",2008-05-02,1437107,1985
DISH,Dish Network,Communication Services,Cable & Satellite,"Englewood, Colorado",2008-08-04,1001082,1980
DIS,Walt Disney,Communication Services,Movies & Entertainment,"Burbank, California",1991-05-06,1744489,1923
DLR,Digital Realty Trust,Real Estate,Specialized REITs,"Austin, Texas",2017-03-20,1297996,2004
DG,Dollar General,Consumer Discretionary,Discount Stores,"Goodlettsville, Tennessee",2009-04-03,29534,1939
DLTR,Dollar Tree,Consumer Discretionary,Discount Stores,"Chesapeake, Virginia",2011-03-09,935703,1986
D,Dominion Energy,Utilities,Electric Utilities,"Richmond, Virginia",1957-03-04,715957,1983
DPZ,Domino's Pizza,Consumer Discretionary,Restaurants,"Ann Arbor, Michigan",2014-07-07,1286681,1960
DOV,Dover,Industrials,Industrial Machinery,"Downers Grove, Illinois",1995-09-01,29905,1955
DOW,Dow Inc.,Materials,Commodity Chemicals,"Midland, Michigan",2019-04-02,1751788,1897
DTE,DTE Energy,Utilities,Electric Utilities,"Detroit, Michigan",1995-08-18,936340,1903
DUK,Duke Energy,Utilities,Electric Utilities,"Charlotte, North Carolina",1976-06-29,1326160,1904
DRE,Duke Realty,Real Estate,Industrial REITs,"Indianapolis, Indiana",2016-04-18,783280,1972
DD,DuPont de Nemours,Materials,Specialty Chemicals,"Wilmington, Delaware",2019-06-03,1666700,1802
DXC,DXC Technology,Information Technology,IT Consulting & Other Services,"Tysons, Virginia",2017-04-03,1688568,2017
EMN,Eastman Chemical,Materials,Specialty Chemicals,"Kingsport, Tennessee",2001-07-31,915389,1920
ETN,Eaton,Industrials,Electrical Components & Equipment,"Dublin, Ireland",2008-05-02,1551182,1911
EBAY,eBay,Consumer Discretionary,Internet & Direct Marketing Retail,"San Jose, California",1998-09-21,1065088,1995
ECL,Ecolab,Materials,Specialty Chemicals,"St. Paul, Minnesota",1979-09-17,31462,1923
EIX,Edison International,Utilities,Electric Utilities,"Rosemead, California",1976-03-04,827052,1886
EW,Edwards Lifesciences,Health Care,Health Care Equipment,"Irvine, California",2017-03-20,1099800,1958
EA,Electronic Arts,Communication Services,Interactive Home Entertainment,"Redwood City, California",2000-05-12,712515,1982
ELV,Elevance Health,Health Care,Health Insurance,"Indianapolis, Indiana",2012-04-12,1156039,1944
EMR,Emerson Electric,Industrials,Electrical Components & Equipment,"St. Louis, Missouri",1957-03-04,32604,1890
ENPH,Enphase Energy,Information Technology,Solar,"Fremont, California",2018-03-19,1463101,2006
EQT,EQT,Energy,Oil & Gas Exploration & Production,"Pittsburgh, Pennsylvania",2017-03-20,33213,1888
EFX,Equifax,Industrials,Research & Consulting Services,"Atlanta, Georgia",2000-04-03,33185,1899
EQIX,Equinix,Real Estate,Specialized REITs,"Redwood City, California",2015-03-20,1101239,1998
EQR,Equity Residential,Real Estate,Residential REITs,"Chicago, Illinois",2006-12-18,906107,1969
ESS,Essex Property Trust,Real Estate,Residential REITs,"San Mateo, California",2016-09-19,920522,1971
EL,Estee Lauder,Consumer Staples,Personal Products,"New York, New York",1995-11-16,1001250,1946
ETSY,Etsy,Consumer Discretionary,Internet & Direct Marketing Retail,"Brooklyn, New York",2015-04-16,1370637,2005
EVRG,Evergy,Utilities,Electric Utilities,"Kansas City, Missouri",2018-06-01,1711269,2018
ES,Eversource Energy,Utilities,Electric Utilities,"Springfield, Massachusetts",2012-04-12,1004110,1927
RE,Everest Re Group,Financials,Property & Casualty Insurance,"Hamilton, Bermuda",2017-03-20,1096385,1973
EXC,Exelon,Utilities,Electric Utilities,"Chicago, Illinois",2000-10-17,1109357,1999
EXPD,Expeditors International,Industrials,Air Freight & Logistics,"Seattle, Washington",2003-06-23,746515,1979
EXPE,Expedia Group,Consumer Discretionary,Hotels Resorts & Cruise Lines,"Seattle, Washington",2005-08-22,1324424,1996
EXR,Extended Stay America,Real Estate,Specialized REITs,"Charlotte, North Carolina",2016-01-05,1289490,1995
XOM,Exxon Mobil,Energy,Integrated Oil & Gas,"Irving, Texas",1928-10-01,34088,1870
FFIV,F5 Networks,Information Technology,Communications Equipment,"Seattle, Washington",2010-07-21,1048695,1996
FB,Meta Platforms,Communication Services,Interactive Media & Services,"Menlo Park, California",2013-06-03,1326801,2004
FAST,Fastenal,Industrials,Industrial Machinery,"Winona, Minnesota",1999-07-13,815556,1967
FRT,Federal Realty Investment Trust,Real Estate,Retail REITs,"Rockville, Maryland",2003-05-02,34903,1962
FDX,FedEx,Industrials,Air Freight & Logistics,"Memphis, Tennessee",1978-04-06,1048911,1971
FIS,Fidelity National Information Services,Information Technology,Data Processing & Outsourced Services,"Jacksonville, Florida",2009-07-02,1136893,1968
FITB,Fifth Third Bancorp,Financials,Regional Banks,"Cincinnati, Ohio",2009-08-17,35527,1858
FRC,First Republic Bank,Financials,Regional Banks,"San Francisco, California",2010-12-14,1132979,1985
FE,FirstEnergy,Utilities,Electric Utilities,"Akron, Ohio",1997-04-21,1031296,1930
FISV,Fiserv,Information Technology,Data Processing & Outsourced Services,"Brookfield, Wisconsin",1999-08-23,798354,1984
FLT,FleetCor Technologies,Information Technology,Data Processing & Outsourced Services,"Norcross, Georgia",2010-09-20,1175454,1986
FMC,FMC Corporation,Materials,Fertilizers & Agricultural Chemicals,"Philadelphia, Pennsylvania",2017-09-01,37785,1883
F,Ford Motor,Consumer Discretionary,Automobile Manufacturers,"Dearborn, Michigan",1956-03-17,37996,1903
FTNT,Fortinet,Information Technology,Systems Software,"Sunnyvale, California",2018-11-05,1262039,2000
FTV,Fortive,Industrials,Industrial Machinery,"Everett, Washington",2016-07-01,1659166,2016
FBHS,Fortune Brands Home & Security,Industrials,Building Products,"Deerfield, Illinois",2013-10-01,1519751,1988
FOXA,Fox Corporation,Communication Services,Movies & Entertainment,"New York, New York",2019-03-19,1308161,2013
FOX,Fox Corporation,Communication Services,Movies & Entertainment,"New York, New York",2019-03-19,1308161,2013
BEN,Franklin Resources,Financials,Asset Management & Custody Banks,"San Mateo, California",1982-09-10,38777,1947
FCX,Freeport-McMoRan,Materials,Copper,"Phoenix, Arizona",2008-05-02,831259,1987
GRMN,Garmin,Consumer Discretionary,Leisure Products,"Olathe, Kansas",2010-12-13,1121788,1989
IT,Gartner,Information Technology,Research & Consulting Services,"Stamford, Connecticut",2017-03-20,749251,1979
GNRC,Generac Holdings,Industrials,Electrical Components & Equipment,"Waukesha, Wisconsin",2021-01-04,1463101,1959
GD,General Dynamics,Industrials,Aerospace & Defense,"Reston, Virginia",1957-03-04,40533,1952
GE,General Electric,Industrials,Industrial Conglomerates,"Boston, Massachusetts",1896-11-07,40545,1892
GIS,General Mills,Consumer Staples,Packaged Foods & Meats,"Minneapolis, Minnesota",1976-06-29,40704,1866
GM,General Motors,Consumer Discretionary,Automobile Manufacturers,"Detroit, Michigan",2013-06-06,1467858,1908
GPC,Genuine Parts,Consumer Discretionary,Distributors,"Atlanta, Georgia",1984-12-31,40987,1928
GILD,Gilead Sciences,Health Care,Biotechnology,"Foster City, California",2006-04-24,882095,1987
GL,Globe Life,Financials,Life & Health Insurance,"McKinney, Texas",2017-03-20,319201,1900
GPN,Global Payments,Information Technology,Data Processing & Outsourced Services,"Atlanta, Georgia",2009-01-02,1123360,1967
GS,Goldman Sachs Group,Financials,Investment Banking & Brokerage,"New York, New York",1999-05-04,886982,1869
HAL,Halliburton,Energy,Oil & Gas Equipment & Services,"Houston, Texas",1926-01-02,45012,1919
HBI,Hanesbrands,Consumer Discretionary,Apparel Accessories & Luxury Goods,"Winston-Salem, North Carolina",2006-09-05,1359841,1901
HAS,Hasbro,Consumer Discretionary,Leisure Products,"Pawtucket, Rhode Island",1991-07-16,46080,1923
HCA,HCA Healthcare,Health Care,Health Care Facilities,"Nashville, Tennessee",2006-03-27,860730,1968
PEAK,Healthpeak Properties,Real Estate,Health Care REITs,"Irvine, California",2017-02-01,1633917,1985
HSIC,Henry Schein,Health Care,Health Care Distributors,"Melville, New York",2001-11-13,1000228,1932
HSY,Hershey,Consumer Staples,Packaged Foods & Meats,"Hershey, Pennsylvania",1976-12-01,47111,1894
HES,Hess,Energy,Oil & Gas Exploration & Production,"New York, New York",1976-07-01,4447,1919
HPE,Hewlett Packard Enterprise,Information Technology,Technology Hardware Storage & Peripherals,"Houston, Texas",2015-11-02,1645590,2015
HLT,Hilton Worldwide Holdings,Consumer Discretionary,Hotels Resorts & Cruise Lines,"McLean, Virginia",2017-06-19,1585689,1919
HOLX,Hologic,Health Care,Health Care Equipment,"Marlborough, Massachusetts",2018-03-19,859737,1985
HD,Home Depot,Consumer Discretionary,Home Improvement Retail,"Atlanta, Georgia",1981-04-29,354950,1978
HON,Honeywell International,Industrials,Industrial Conglomerates,"Charlotte, North Carolina",1999-12-06,773840,1906
HRL,Hormel Foods,Consumer Staples,Packaged Foods & Meats,"Austin, Minnesota",2002-01-02,354908,1891
HST,Host Hotels & Resorts,Real Estate,Hotel & Resort REITs,"Bethesda, Maryland",2017-03-20,1070750,1993
HWM,Howmet Aerospace,Industrials,Aerospace & Defense,"Pittsburgh, Pennsylvania",2020-04-01,1755672,1888
HPQ,HP Inc.,Information Technology,Technology Hardware Storage & Peripherals,"Palo Alto, California",2015-11-02,1645590,1939
HUBB,Hubbell,Industrials,Electrical Components & Equipment,"Shelton, Connecticut",2017-03-20,49621,1888
HUM,Humana,Health Care,Health Insurance,"Louisville, Kentucky",2001-04-05,49071,1961
HBAN,Huntington Bancshares,Financials,Regional Banks,"Columbus, Ohio",2009-08-17,49196,1866
HII,Huntington Ingalls Industries,Industrials,Aerospace & Defense,"Newport News, Virginia",2011-03-31,1501393,2011
IEX,IDEX,Industrials,Industrial Machinery,"Lake Forest, Illinois",2017-09-01,832101,1988
IDXX,IDEXX Laboratories,Health Care,Health Care Equipment,"Westbrook, Maine",2015-09-18,874716,1983
INFO,IHS Markit,Industrials,Research & Consulting Services,"London, England",2016-07-01,1635550,1959
IFF,International Flavors & Fragrances,Materials,Specialty Chemicals,"New York, New York",2010-06-28,51253,1889
ILMN,Illumina,Health Care,Life Sciences Tools & Services,"San Diego, California",2005-07-19,1110803,1998
INCY,Incyte,Health Care,Biotechnology,"Wilmington, Delaware",2013-12-16,879169,1991
IR,Ingersoll Rand,Industrials,Industrial Machinery,"Davidson, North Carolina",2020-02-29,1466258,1905
INTC,Intel,Information Technology,Semiconductors,"Santa Clara, California",1982-03-15,50863,1968
ICE,Intercontinental Exchange,Financials,Financial Exchanges & Data,"Atlanta, Georgia",2013-11-04,1571949,2000
IBM,International Business Machines,Information Technology,IT Consulting & Other Services,"Armonk, New York",1979-03-31,51143,1911
IFF,International Flavors & Fragrances,Materials,Specialty Chemicals,"New York, New York",2010-06-28,51253,1889
IP,International Paper,Materials,Paper & Forest Products,"Memphis, Tennessee",1985-10-31,51434,1898
IPG,Interpublic Group,Communication Services,Advertising,"New York, New York",2000-07-19,51644,1930
IRM,Iron Mountain,Real Estate,Specialized REITs,"Boston, Massachusetts",2014-06-20,1020569,1951
JBHT,J.B. Hunt Transport Services,Industrials,Trucking,"Lowell, Arkansas",2018-03-19,728535,1961
JKHY,Jack Henry & Associates,Information Technology,Data Processing & Outsourced Services,"Monett, Missouri",2018-12-21,779152,1976
J,Jacobs Engineering Group,Industrials,Research & Consulting Services,"Dallas, Texas",2017-03-20,52988,1947
JNPR,Juniper Networks,Information Technology,Communications Equipment,"Sunnyvale, California",2009-04-23,1043604,1996
KSU,Kansas City Southern,Industrials,Railroads,"Kansas City, Missouri",2008-07-01,54480,1887
K,Kellogg,Consumer Staples,Packaged Foods & Meats,"Battle Creek, Michigan",1922-09-08,55067,1906
KEY,KeyCorp,Financials,Regional Banks,"Cleveland, Ohio",1994-03-04,91576,1849
KEYS,Keysight Technologies,Information Technology,Electronic Manufacturing Services,"Santa Rosa, California",2014-11-03,1601046,2014
KMB,Kimberly-Clark,Consumer Staples,Household Products,"Dallas, Texas",1971-07-01,55785,1872
KIM,Kimco Realty,Real Estate,Retail REITs,"Jericho, New York",2006-06-07,879101,1958
KMI,Kinder Morgan,Energy,Oil & Gas Storage & Transportation,"Houston, Texas",2012-05-26,1506307,1997
KLAC,KLA Corporation,Information Technology,Semiconductor Equipment,"Milpitas, California",2000-03-17,319201,1976
KHC,Kraft Heinz,Consumer Staples,Packaged Foods & Meats,"Pittsburgh, Pennsylvania",2015-07-06,1637459,2015
KR,Kroger,Consumer Staples,Food Retail,"Cincinnati, Ohio",1974-01-02,56873,1883
LHX,L3Harris Technologies,Industrials,Aerospace & Defense,"Melbourne, Florida",2019-06-21,1739940,1895
LH,Laboratory Corporation of America,Health Care,Health Care Services,"Burlington, North Carolina",1995-11-14,920148,1971
LRCX,Lam Research,Information Technology,Semiconductor Equipment,"Fremont, California",2012-03-30,707549,1980
LW,Lamb Weston Holdings,Consumer Staples,Packaged Foods & Meats,"Eagle, Idaho",2016-11-04,1679273,1950
LVS,Las Vegas Sands,Consumer Discretionary,Casinos & Gaming,"Las Vegas, Nevada",2009-12-17,1300514,1988
LEG,Leggett & Platt,Consumer Discretionary,Home Furnishings,"Carthage, Missouri",1999-12-23,58492,1883
LDOS,Leidos Holdings,Information Technology,IT Consulting & Other Services,"Reston, Virginia",2014-09-19,1336920,1969
LEN,Lennar,Consumer Discretionary,Homebuilding,"Miami, Florida",2018-05-30,920760,1954
LNC,Lincoln National,Financials,Life & Health Insurance,"Radnor, Pennsylvania",2017-03-20,59558,1905
LIN,Linde,Materials,Industrial Gases,"Guildford, England",2018-10-31,1707925,1879
LYV,Live Nation Entertainment,Communication Services,Movies & Entertainment,"Beverly Hills, California",2018-03-19,1335258,2005
LKQ,LKQ,Consumer Discretionary,Distributors,"Chicago, Illinois",2013-06-28,1065696,1998
LMT,Lockheed Martin,Industrials,Aerospace & Defense,"Bethesda, Maryland",1983-08-16,936468,1995
L,Loews,Financials,Multi-Sector Holdings,"New York, New York",2018-06-18,60086,1946
LOW,Lowe's,Consumer Discretionary,Home Improvement Retail,"Mooresville, North Carolina",1979-12-05,60667,1946
LUMN,Lumen Technologies,Communication Services,Integrated Telecommunication Services,"Monroe, Louisiana",2011-07-01,18926,1968
LYB,LyondellBasell,Materials,Specialty Chemicals,"Houston, Texas",2010-10-14,1489393,1953
MTB,M&T Bank,Financials,Regional Banks,"Buffalo, New York",2009-11-23,36405,1856
MRO,Marathon Oil,Energy,Oil & Gas Exploration & Production,"Houston, Texas",2011-07-01,101778,1887
MPC,Marathon Petroleum,Energy,Oil & Gas Refining & Marketing,"Findlay, Ohio",2011-07-01,1510295,2011
MKTX,MarketAxess Holdings,Financials,Financial Exchanges & Data,"New York, New York",2017-03-20,1278021,2000
MAR,Marriott International,Consumer Discretionary,Hotels Resorts & Cruise Lines,"Bethesda, Maryland",1993-10-01,1048286,1957
MMC,Marsh & McLennan,Financials,Insurance Brokers,"New York, New York",1987-06-10,62709,1905
MLM,Martin Marietta Materials,Materials,Construction Materials,"Raleigh, North Carolina",2014-06-27,916076,1939
MAS,Masco,Industrials,Building Products,"Livonia, Michigan",1998-06-01,62996,1929
MA,Mastercard,Information Technology,Data Processing & Outsourced Services,"Purchase, New York",2006-05-25,1141391,1966
MTCH,Match Group,Communication Services,Interactive Media & Services,"Dallas, Texas",2020-06-22,1575189,1995
MKC,McCormick & Company,Consumer Staples,Packaged Foods & Meats,"Hunt Valley, Maryland",1982-07-01,63754,1889
MCD,McDonald's,Consumer Discretionary,Restaurants,"Chicago, Illinois",1965-07-01,63908,1940
MCK,McKesson,Health Care,Health Care Distributors,"Irving, Texas",2001-04-18,927653,1833
MDT,Medtronic,Health Care,Health Care Equipment,"Dublin, Ireland",1985-06-29,1613103,1949
MRK,Merck & Co.,Health Care,Pharmaceuticals,"Kenilworth, New Jersey",1957-03-04,64803,1891
META,Meta Platforms,Communication Services,Interactive Media & Services,"Menlo Park, California",2013-06-03,1326801,2004
MET,MetLife,Financials,Life & Health Insurance,"New York, New York",2000-04-05,1099219,1868
MTD,Mettler-Toledo International,Health Care,Life Sciences Tools & Services,"Columbus, Ohio",2017-09-01,1037785,1945
MGM,MGM Resorts International,Consumer Discretionary,Casinos & Gaming,"Las Vegas, Nevada",2017-03-20,789570,1986
MCHP,Microchip Technology,Information Technology,Semiconductors,"Chandler, Arizona",2002-03-14,827054,1989
MU,Micron Technology,Information Technology,Semiconductors,"Boise, Idaho",2007-05-03,723125,1978
MSFT,Microsoft,Information Technology,Systems Software,"Redmond, Washington",1986-03-13,789019,1975
MAA,Mid-America Apartment Communities,Real Estate,Residential REITs,"Memphis, Tennessee",2018-03-19,912595,1977
MRNA,Moderna,Health Care,Biotechnology,"Cambridge, Massachusetts",2020-07-21,1682852,2010
MHK,Mohawk Industries,Consumer Discretionary,Home Furnishings,"Calhoun, Georgia",2013-12-23,851968,1878
TAP,Molson Coors Beverage,Consumer Staples,Brewers,"Chicago, Illinois",2016-10-11,24545,1786
MDLZ,Mondelez International,Consumer Staples,Packaged Foods & Meats,"Deerfield, Illinois",2012-10-01,1103982,2012
MNST,Monster Beverage,Consumer Staples,Soft Drinks,"Corona, California",2012-07-03,865752,1985
MCO,Moody's,Financials,Financial Data & Stock Exchanges,"New York, New York",2000-10-03,1059556,1909
MS,Morgan Stanley,Financials,Investment Banking & Brokerage,"New York, New York",1986-03-31,895421,1935
MOS,Mosaic,Materials,Fertilizers & Agricultural Chemicals,"Tampa, Florida",2011-05-02,1285785,2004
MSI,Motorola Solutions,Information Technology,Communications Equipment,"Chicago, Illinois",2011-01-03,68505,1928
MSCI,MSCI,Financials,Financial Data & Stock Exchanges,"New York, New York",2016-05-31,1408198,1969
NDAQ,Nasdaq,Financials,Financial Exchanges & Data,"New York, New York",2008-07-02,1120193,1971
NFLX,Netflix,Communication Services,Movies & Entertainment,"Los Gatos, California",2002-05-23,1065280,1997
NWL,Newell Brands,Consumer Discretionary,Household Durables,"Atlanta, Georgia",2017-03-20,814453,1903
NEM,Newmont,Materials,Gold,"Greenwood Village, Colorado",2013-04-18,1164727,1921
NWSA,News Corporation,Communication Services,Publishing,"New York, New York",2013-06-28,1564708,2013
NWS,News Corporation,Communication Services,Publishing,"New York, New York",2013-06-28,1564708,2013
NEE,NextEra Energy,Utilities,Electric Utilities,"Juno Beach, Florida",2001-06-06,753308,1925
NIKE,Nike,Consumer Discretionary,Footwear,"Beaverton, Oregon",1982-12-02,320187,1964
NKE,Nike,Consumer Discretionary,Footwear,"Beaverton, Oregon",1982-12-02,320187,1964
NI,NiSource,Utilities,Gas Utilities,"Merrillville, Indiana",2001-05-07,1111711,1912
NSC,Norfolk Southern,Industrials,Railroads,"Norfolk, Virginia",1982-06-01,702165,1982
NTRS,Northern Trust,Financials,Asset Management & Custody Banks,"Chicago, Illinois",2003-07-01,73124,1889
NOC,Northrop Grumman,Industrials,Aerospace & Defense,"Falls Church, Virginia",1957-03-04,1133421,1994
NLSN,Nielsen Holdings,Communication Services,Advertising,"New York, New York",2011-01-26,1492633,1923
NCLH,Norwegian Cruise Line Holdings,Consumer Discretionary,Hotels Resorts & Cruise Lines,"Miami, Florida",2017-03-20,1513761,1966
NRG,NRG Energy,Utilities,Independent Power Producers & Energy Traders,"Houston, Texas",2010-05-19,1013871,2000
NUE,Nucor,Materials,Steel,"Charlotte, North Carolina",1982-07-01,73309,1904
NVDA,NVIDIA,Information Technology,Semiconductors,"Santa Clara, California",1999-06-29,1045810,1993
NVR,NVR,Consumer Discretionary,Homebuilding,"Reston, Virginia",2014-06-20,906163,1980
NXPI,NXP Semiconductors,Information Technology,Semiconductors,"Eindhoven, Netherlands",2018-03-19,1413447,2006
ORLY,O'Reilly Automotive,Consumer Discretionary,Specialty Stores,"Springfield, Missouri",2009-04-23,898173,1957
OXY,Occidental Petroleum,Energy,Oil & Gas Exploration & Production,"Houston, Texas",1982-04-30,797468,1920
ODFL,Old Dominion Freight Line,Industrials,Trucking,"Thomasville, North Carolina",2017-06-19,878927,1934
OMC,Omnicom Group,Communication Services,Advertising,"New York, New York",2009-07-01,29989,1986
ON,ON Semiconductor,Information Technology,Semiconductors,"Phoenix, Arizona",2023-09-18,1097864,1999
OKE,ONEOK,Energy,Oil & Gas Storage & Transportation,"Tulsa, Oklahoma",2017-03-20,1039684,1906
ORCL,Oracle,Information Technology,Systems Software,"Austin, Texas",1986-03-12,777676,1977
OGN,Organon & Co.,Health Care,Pharmaceuticals,"Jersey City, New Jersey",2021-06-02,1823481,2021
OTIS,Otis Worldwide,Industrials,Industrial Machinery,"Farmington, Connecticut",2020-04-03,1781335,1853
PCAR,PACCAR,Industrials,Construction & Mining Equipment,"Bellevue, Washington",1985-06-19,75362,1905
PKG,Packaging Corporation of America,Materials,Paper Packaging,"Lake Forest, Illinois",2000-01-05,75677,1959
PH,Parker-Hannifin,Industrials,Industrial Machinery,"Cleveland, Ohio",1985-06-19,76334,1917
PAYX,Paychex,Information Technology,Data Processing & Outsourced Services,"Rochester, New York",1998-10-01,723603,1971
PAYC,Paycom Software,Information Technology,Application Software,"Oklahoma City, Oklahoma",2020-07-20,1590955,1998
PYPL,PayPal Holdings,Information Technology,Data Processing & Outsourced Services,"San Jose, California",2015-07-20,1633917,1998
PENN,Penn National Gaming,Consumer Discretionary,Casinos & Gaming,"Wyomissing, Pennsylvania",2021-03-22,921738,1972
PNR,Pentair,Industrials,Industrial Machinery,"London, England",2014-04-30,77360,1966
PBCT,People's United Financial,Financials,Regional Banks,"Bridgeport, Connecticut",2008-07-01,1378946,1842
PEP,PepsiCo,Consumer Staples,Soft Drinks,"Purchase, New York",1965-12-14,77476,1893
PKI,PerkinElmer,Health Care,Life Sciences Tools & Services,"Waltham, Massachusetts",2017-09-01,31791,1937
PRGO,Perrigo Company,Health Care,Pharmaceuticals,"Dublin, Ireland",2017-07-05,1585364,1887
PFE,Pfizer,Health Care,Pharmaceuticals,"New York, New York",1957-03-04,78003,1849
PM,Philip Morris International,Consumer Staples,Tobacco,"New York, New York",2008-03-31,1413329,2008
PSX,Phillips 66,Energy,Oil & Gas Refining & Marketing,"Houston, Texas",2012-05-01,1534701,2012
PNW,Pinnacle West Capital,Utilities,Electric Utilities,"Phoenix, Arizona",2011-09-02,764622,1985
PXD,Pioneer Natural Resources,Energy,Oil & Gas Exploration & Production,"Irving, Texas",2008-05-02,1038357,1997
PNC,PNC Financial Services,Financials,Regional Banks,"Pittsburgh, Pennsylvania",1988-03-04,713676,1845
POOL,Pool,Consumer Discretionary,Distributors,"Covington, Louisiana",2021-03-22,891024,1993
PPG,PPG Industries,Materials,Specialty Chemicals,"Pittsburgh, Pennsylvania",1984-02-29,79879,1883
PPL,PPL,Utilities,Electric Utilities,"Allentown, Pennsylvania",1975-04-01,922224,1920
PFG,Principal Financial Group,Financials,Life & Health Insurance,"Des Moines, Iowa",2001-10-19,1126328,1879
PG,Procter & Gamble,Consumer Staples,Household Products,"Cincinnati, Ohio",1932-05-06,80424,1837
PGR,Progressive,Financials,Property & Casualty Insurance,"Mayfield Village, Ohio",1997-08-18,80661,1937
PLD,Prologis,Real Estate,Industrial REITs,"San Francisco, California",2008-04-21,1045609,1991
PRU,Prudential Financial,Financials,Life & Health Insurance,"Newark, New Jersey",2001-12-13,1137774,1875
PSA,Public Storage,Real Estate,Specialized REITs,"Glendale, California",2016-03-04,1393311,1972
PHM,PulteGroup,Consumer Discretionary,Homebuilding,"Atlanta, Georgia",2009-04-28,822416,1950
PVH,PVH,Consumer Discretionary,Apparel Accessories & Luxury Goods,"New York, New York",2013-06-28,78239,1881
QRVO,Qorvo,Information Technology,Semiconductors,"Greensboro, North Carolina",2018-03-19,1604778,2014
PWR,Quanta Services,Industrials,Construction & Engineering,"Houston, Texas",2009-10-02,1050915,1997
QCOM,Qualcomm,Information Technology,Semiconductors,"San Diego, California",1991-12-13,804328,1985
DGX,Quest Diagnostics,Health Care,Health Care Services,"Secaucus, New Jersey",2001-11-26,1022079,1967
RL,Ralph Lauren,Consumer Discretionary,Apparel Accessories & Luxury Goods,"New York, New York",1997-06-11,1037038,1967
RJF,Raymond James Financial,Financials,Investment Banking & Brokerage,"St. Petersburg, Florida",2017-03-20,720005,1962
RTX,Raytheon Technologies,Industrials,Aerospace & Defense,"Waltham, Massachusetts",2020-04-03,101829,1922
O,Realty Income,Real Estate,Retail REITs,"San Diego, California",2017-03-20,726728,1969
REG,Regency Centers,Real Estate,Retail REITs,"Jacksonville, Florida",2017-03-20,910606,1963
REGN,Regeneron Pharmaceuticals,Health Care,Biotechnology,"Tarrytown, New York",2013-05-30,872589,1988
RF,Regions Financial,Financials,Regional Banks,"Birmingham, Alabama",2006-05-19,1281761,1971
RSG,Republic Services,Industrials,Environmental & Facilities Services,"Phoenix, Arizona",2008-06-23,1060391,1998
RMD,ResMed,Health Care,Health Care Equipment,"San Diego, California",2017-03-20,1045540,1989
RHI,Robert Half,Industrials,Human Resource & Employment Services,"Menlo Park, California",2000-06-07,315213,1948
ROK,Rockwell Automation,Industrials,Industrial Machinery,"Milwaukee, Wisconsin",2018-06-18,1024478,1903
ROL,Rollins,Industrials,Environmental & Facilities Services,"Atlanta, Georgia",2017-09-18,84839,1948
ROP,Roper Technologies,Industrials,Industrial Machinery,"Sarasota, Florida",2017-03-20,882835,1981
ROST,Ross Stores,Consumer Discretionary,Apparel Retail,"Dublin, California",2009-06-19,745732,1957
RCL,Royal Caribbean Cruises,Consumer Discretionary,Hotels Resorts & Cruise Lines,"Miami, Florida",2014-03-18,884887,1968
SPGI,S&P Global,Financials,Financial Data & Stock Exchanges,"New York, New York",2016-04-30,64040,1888
CRM,Salesforce,Information Technology,Application Software,"San Francisco, California",2008-09-15,1108524,1999
SBAC,SBA Communications,Real Estate,Specialized REITs,"Boca Raton, Florida",2017-03-20,1034054,1989
SLB,Schlumberger,Energy,Oil & Gas Equipment & Services,"Houston, Texas",1965-08-18,87347,1926
STX,Seagate Technology Holdings,Information Technology,Technology Hardware Storage & Peripherals,"Fremont, California",2012-04-02,1137789,1979
SEE,Sealed Air,Materials,Paper Packaging,"Charlotte, North Carolina",2014-07-01,1012100,1957
SRE,Sempra Energy,Utilities,Multi-Utilities,"San Diego, California",1998-07-01,1032208,1998
NOW,ServiceNow,Information Technology,Application Software,"Santa Clara, California",2020-04-01,1373715,2003
SHW,Sherwin-Williams,Materials,Specialty Chemicals,"Cleveland, Ohio",1964-02-03,89800,1866
SPG,Simon Property Group,Real Estate,Retail REITs,"Indianapolis, Indiana",2017-03-20,1063761,1960
SWKS,Skyworks Solutions,Information Technology,Semiconductors,"Irvine, California",2015-03-20,4127,1962
SNA,Snap-on,Industrials,Industrial Machinery,"Kenosha, Wisconsin",2012-05-21,91440,1920
SO,Southern Company,Utilities,Electric Utilities,"Atlanta, Georgia",1957-03-04,92122,1945
LUV,Southwest Airlines,Industrials,Airlines,"Dallas, Texas",1994-07-05,92380,1967
SWK,Stanley Black & Decker,Industrials,Industrial Machinery,"New Britain, Connecticut",2010-03-12,93556,1843
SBUX,Starbucks,Consumer Discretionary,Restaurants,"Seattle, Washington",1992-06-26,829224,1971
SYK,Stryker,Health Care,Health Care Equipment,"Kalamazoo, Michigan",2005-02-11,310764,1941
ED,Consolidated Edison,Utilities,Electric Utilities,"New York, New York",1957-03-04,1047862,1884
SIRI,Sirius XM Holdings,Communication Services,Broadcasting,"New York, New York",2008-12-17,908937,1990
SYF,Synchrony Financial,Financials,Consumer Finance,"Stamford, Connecticut",2014-11-20,1601712,2003
SNPS,Synopsys,Information Technology,Application Software,"Mountain View, California",2017-03-20,883241,1986
SYY,Sysco,Consumer Staples,Food Distributors,"Houston, Texas",1976-03-04,96021,1969
STZ,Constellation Brands,Consumer Staples,Distillers & Vintners,"Victor, New York",1999-12-17,16918,1945
T,AT&T,Communication Services,Integrated Telecommunication Services,"Dallas, Texas",1957-03-04,732717,1983
TAP,Molson Coors Beverage,Consumer Staples,Brewers,"Chicago, Illinois",2016-10-11,24545,1786
TMUS,T-Mobile US,Communication Services,Wireless Telecommunication Services,"Bellevue, Washington",2013-05-01,1283699,1994
TROW,T. Rowe Price Group,Financials,Asset Management & Custody Banks,"Baltimore, Maryland",1986-10-30,1113169,1937
TTWO,Take-Two Interactive Software,Communication Services,Interactive Home Entertainment,"New York, New York",2018-03-19,946581,1993
TPG,TPG Inc.,Financials,Asset Management & Custody Banks,"Fort Worth, Texas",2022-01-18,1840254,1992
TDG,TransDigm Group,Industrials,Aerospace & Defense,"Cleveland, Ohio",2015-06-23,1260221,1993
TRV,Travelers Companies,Financials,Property & Casualty Insurance,"New York, New York",2002-08-19,86312,1864
TRMB,Trimble,Information Technology,Electronic Equipment & Instruments,"Sunnyvale, California",2018-09-24,102724,1978
TFC,Truist Financial,Financials,Regional Banks,"Charlotte, North Carolina",2019-12-09,92230,1872
TSLA,Tesla,Consumer Discretionary,Automobile Manufacturers,"Austin, Texas",2010-06-29,1318605,2003
TYL,Tyler Technologies,Information Technology,Application Software,"Plano, Texas",2017-03-20,860731,1966
TSN,Tyson Foods,Consumer Staples,Packaged Foods & Meats,"Springdale, Arkansas",1979-03-07,100493,1935
USB,U.S. Bancorp,Financials,Regional Banks,"Minneapolis, Minnesota",1988-01-04,36104,1863
UDR,UDR,Real Estate,Residential REITs,"Highlands Ranch, Colorado",2016-03-21,74208,1972
ULTA,Ulta Beauty,Consumer Discretionary,Specialty Stores,"Bolingbrook, Illinois",2016-03-09,1403568,1990
UNP,Union Pacific,Industrials,Railroads,"Omaha, Nebraska",1980-06-30,100826,1862
UAL,United Airlines Holdings,Industrials,Airlines,"Chicago, Illinois",2015-04-14,100517,1926
UPS,United Parcel Service,Industrials,Air Freight & Logistics,"Atlanta, Georgia",1999-11-10,1090727,1907
URI,United Rentals,Industrials,Construction & Mining Equipment,"Stamford, Connecticut",2014-09-20,1067701,1997
UNH,UnitedHealth Group,Health Care,Health Insurance,"Minnetonka, Minnesota",1994-10-17,731766,1977
UHS,Universal Health Services,Health Care,Health Care Facilities,"King of Prussia, Pennsylvania",2014-09-20,352915,1978
VLO,Valero Energy,Energy,Oil & Gas Refining & Marketing,"San Antonio, Texas",2009-07-21,1035002,1980
VTR,Ventas,Real Estate,Health Care REITs,"Chicago, Illinois",2009-09-07,740260,1998
VRSN,VeriSign,Information Technology,Internet Services & Infrastructure,"Reston, Virginia",2006-07-26,1014473,1995
VRSK,Verisk Analytics,Industrials,Research & Consulting Services,"Jersey City, New Jersey",2015-09-21,1442145,1971
VZ,Verizon Communications,Communication Services,Integrated Telecommunication Services,"New York, New York",1983-11-21,732712,1983
VRTX,Vertex Pharmaceuticals,Health Care,Biotechnology,"Boston, Massachusetts",2013-09-23,875320,1989
VFC,VF Corporation,Consumer Discretionary,Apparel Accessories & Luxury Goods,"Denver, Colorado",2013-09-23,103379,1899
VIAC,ViacomCBS,Communication Services,Broadcasting,"New York, New York",2019-12-04,813828,2019
V,Visa,Information Technology,Data Processing & Outsourced Services,"Foster City, California",2009-06-26,1403161,1958
VNO,Vornado Realty Trust,Real Estate,Office REITs,"New York, New York",2017-03-20,899689,1982
VMC,Vulcan Materials,Materials,Construction Materials,"Birmingham, Alabama",1999-05-20,1396009,1909
WRB,W. R. Berkley,Financials,Property & Casualty Insurance,"Greenwich, Connecticut",2017-03-20,10456,1967
WBA,Walgreens Boots Alliance,Consumer Staples,Drug Retail,"Deerfield, Illinois",2014-12-29,1618921,1901
WMT,Walmart,Consumer Staples,Hypermarkets & Super Centers,"Bentonville, Arkansas",1972-08-25,104169,1962
WM,Waste Management,Industrials,Environmental & Facilities Services,"Houston, Texas",1976-07-29,823768,1968
WAT,Waters,Health Care,Life Sciences Tools & Services,"Milford, Massachusetts",2017-03-20,1000697,1958
WEC,WEC Energy Group,Utilities,Electric Utilities,"Milwaukee, Wisconsin",2016-06-28,1026214,1896
WFC,Wells Fargo,Financials,Diversified Banks,"San Francisco, California",1976-01-02,72971,1852
WELL,Welltower,Real Estate,Health Care REITs,"Toledo, Ohio",2017-03-20,1393311,1970
WST,West Pharmaceutical Services,Health Care,Health Care Equipment,"Exton, Pennsylvania",2017-03-20,105770,1923
WDC,Western Digital,Information Technology,Technology Hardware Storage & Peripherals,"San Jose, California",2009-04-08,106040,1970
WU,Western Union,Information Technology,Data Processing & Outsourced Services,"Denver, Colorado",2006-09-29,1365135,1851
WRK,WestRock,Materials,Paper Packaging,"Atlanta, Georgia",2015-07-01,1000670,2015
WY,Weyerhaeuser,Real Estate,Specialized REITs,"Seattle, Washington",2010-02-08,106535,1900
WHR,Whirlpool,Consumer Discretionary,Household Durables,"Benton Harbor, Michigan",1999-08-30,106640,1911
WMB,Williams Companies,Energy,Oil & Gas Storage & Transportation,"Tulsa, Oklahoma",2012-05-02,107263,1908
WLTW,Willis Towers Watson,Financials,Insurance Brokers,"London, England",2016-01-05,1140536,1828
WEC,WEC Energy Group,Utilities,Electric Utilities,"Milwaukee, Wisconsin",2016-06-28,1026214,1896
WFC,Wells Fargo,Financials,Diversified Banks,"San Francisco, California",1976-01-02,72971,1852
WYNN,Wynn Resorts,Consumer Discretionary,Casinos & Gaming,"Las Vegas, Nevada",2006-10-26,1174922,2002
XEL,Xcel Energy,Utilities,Electric Utilities,"Minneapolis, Minnesota",2000-08-29,72903,1909
XYL,Xylem,Industrials,Industrial Machinery,"Rye Brook, New York",2011-11-01,1524472,2011
YUM,Yum! Brands,Consumer Discretionary,Restaurants,"Louisville, Kentucky",1997-10-07,1041061,1997
ZBRA,Zebra Technologies,Information Technology,Electronic Equipment & Instruments,"Lincolnshire, Illinois",2019-12-23,877212,1969
ZBH,Zimmer Biomet Holdings,Health Care,Health Care Equipment,"Warsaw, Indiana",2001-07-26,1136869,1927
ZION,Zions Bancorporation,Financials,Regional Banks,"Salt Lake City, Utah",2001-06-22,109380,1873
ZTS,Zoetis,Health Care,Pharmaceuticals,"Parsippany, New Jersey",2013-06-21,1555280,1952`

// Parse CSV and generate SQL
function parseCSVAndGenerateSQL(csvContent) {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',')

  let sql = `-- Expand Stock Registry with S&P 500 Companies
-- Generated by expand-stock-registry.js

-- Insert S&P 500 companies into stock_registry
INSERT INTO stock_registry (symbol, name, company_name, exchange, currency, sector, industry, country, is_popular) VALUES\n`

  const values = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Parse CSV line handling quoted values
    const cols = []
    let inQuotes = false
    let currentCol = ''

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        cols.push(currentCol.trim())
        currentCol = ''
      } else {
        currentCol += char
      }
    }
    cols.push(currentCol.trim())

    if (cols.length >= 4) {
      const symbol = cols[0].replace(/"/g, '')
      const name = cols[1].replace(/"/g, '')
      const sector = cols[2].replace(/"/g, '')
      const industry = cols[3].replace(/"/g, '')

      // Skip if already exists in our current registry
      const existingSymbols = [
        'AAPL',
        'MSFT',
        'GOOGL',
        'AMZN',
        'TSLA',
        'META',
        'NVDA',
        'JPM',
        'JNJ',
        'V',
        'WMT',
        'PG',
        'HD',
        'MA',
        'DIS',
      ]
      if (existingSymbols.includes(symbol)) continue

      // Determine exchange (most S&P 500 are NYSE or NASDAQ)
      const exchange = [
        'AAPL',
        'MSFT',
        'GOOGL',
        'AMZN',
        'TSLA',
        'META',
        'NVDA',
        'AMD',
        'NFLX',
        'ADBE',
        'COST',
        'AVGO',
        'CSCO',
        'PYPL',
        'INTC',
        'CMCSA',
        'QCOM',
        'AMGN',
        'INTU',
        'SBUX',
        'GILD',
        'MDLZ',
        'BKNG',
        'FISV',
        'ADP',
        'REGN',
        'ISRG',
        'ATVI',
        'AMAT',
        'LRCX',
        'BIIB',
        'ILMN',
        'MXIM',
        'NXPI',
        'MELI',
        'WDAY',
        'DXCM',
        'MRNA',
        'VRTX',
        'SGEN',
        'BMRN',
        'OKTA',
        'NTES',
        'TEAM',
        'DOCU',
        'ZOOM',
        'PTON',
        'CRWD',
        'DDOG',
        'SNOW',
        'PLTR',
        'RBLX',
        'COIN',
        'AFRM',
        'ABNB',
      ].includes(symbol)
        ? 'NASDAQ'
        : 'NYSE'

      values.push(
        `  ('${symbol}', '${name.replace(/'/g, "''")}', '${name.replace(/'/g, "''")}', '${exchange}', 'USD', '${sector.replace(/'/g, "''")}', '${industry.replace(/'/g, "''")}', 'US', false)`
      )
    }
  }

  sql += values.join(',\n')
  sql += '\nON CONFLICT (symbol, exchange) DO NOTHING;\n'

  return sql
}

// Generate the SQL
const sql = parseCSVAndGenerateSQL(csvData)

// Write to migration file
const migrationPath = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '011_expand_stock_registry.sql'
)
fs.writeFileSync(migrationPath, sql)

console.log(`Generated migration: ${migrationPath}`)
console.log(
  `Added ${sql.split('\n').filter(line => line.trim().startsWith("('")).length} S&P 500 companies`
)
